import React from "react";
import {
  Box,
  Button,
  Divider,
  Fab,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  TextField
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Add, Close, Delete, Done, Edit } from "@material-ui/icons";
import { Alert, Pagination } from "@material-ui/lab";
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker
} from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import * as imm from "object-path-immutable";
import format from "date-fns/format";
import formatISO from "date-fns/formatISO";
import isDate from "date-fns/isDate";
import isValid from "date-fns/isValid";
import differenceInMinutes from "date-fns/differenceInMinutes";
import parseISO from "date-fns/parseISO";
import compareDesc from "date-fns/compareDesc";
import { Formik } from "formik";
import { queryCache, useMutation, useQuery } from "react-query";
import { getStorageItemJson } from "storage/storage";
import { minToHHMM } from "helpers/time";
import EmptyState from "EmptyState";

const PAGE_SIZE = 30;
const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";

const recordSortFunction = (a, b) => compareDesc(a.startTime, b.startTime);

const useStyles = makeStyles({
  root: { minWidth: 275 },
  title: { fontSize: 20, textAlign: "center" },
  editCell: { backgroundColor: "#ffffe4", paddingTop: "8px" },
  controls: { paddingTop: "16px", paddingBottom: "16px" },
  pagination: { display: "inline-block" },
  fab: { paddingLeft: "8px" },
  duration: { fontStyle: "italic" }
});

/* Async backend call to fetch data */
const fetchRecords = async (
  key,
  { startDate, endDate, contains, authToken }
) => {
  try {
    const from = formatISO(isDate(startDate) ? startDate : parseISO(startDate));
    const to = formatISO(isDate(endDate) ? endDate : parseISO(endDate));
    // must encode dateFrom/dateTo, otherwise the "+" before the timezone
    // offset will be interpreted as a space
    const result = await axios(
      `/api/timerecords?dateFrom=${encodeURIComponent(
        from
      )}&dateTo=${encodeURIComponent(to)}${
        contains ? "&contains=" + encodeURIComponent(contains) : ""
      }`,
      {
        headers: {
          "Content-Type": "application/json",
          AuthToken: authToken
        }
      }
    );
    if (result.status >= 400) {
      return {
        error: { status: result.status, statusText: result.statusText }
      };
    } else
      return result.data.data
        .map(d => ({
          ...d,
          startTime: parseISO(d.startTime),
          endTime: isValid(parseISO(d.endTime)) ? parseISO(d.endTime) : null
        }))
        .sort(recordSortFunction);
  } catch (err) {
    console.log("ERROR:", err);
    return {
      error: {
        status: err.response.status,
        statusText: `${err.response.statusText}  ${err.response.data}`
      }
    };
  }
};

const updateRecord = ({ row, user, authToken, method = "PUT" }) => {
  let url;
  if (method === "UNDO_DELETE") {
    url = `/api/timerecords/${row.id}/undelete`;
    method = "PUT";
  } else if (method === "POST") url = "/api/timerecords";
  else url = `/api/timerecords/${row.id}`;

  return axios(url, {
    method, // "PUT" or "POST" or "DELETE"
    headers: { "Content-Type": "application/json", AuthToken: authToken },
    data: row
  });
};

/*
 * Component to show time records.
 * Responsive layout achieved by using Grid (not Table): on narrow screens, the
 * rows will stack internally.
 */
const RecordsGrid = props => {
  const classes = useStyles();

  const authToken = ((getStorageItemJson("userInfo") || {}).authToken || {})
    .token;
  const userId = (getStorageItemJson("userInfo") || {}).id;

  // "editing" state: row id to edit
  const [editRow, setEditRow] = React.useState();

  // "adding" state: row object to add
  const [addRow, setAddRow] = React.useState(null);

  // "undo" state: row object to undo
  const [undoRow, setUndoRow] = React.useState();

  // general error object
  const [globalError, setGlobalError] = React.useState();

  // undo message
  const [snackMessage, setSnackMessage] = React.useState();

  // current page if paging
  const [page, setPage] = React.useState(1);

  /* On unmounting, clear react-query cache, otherwise it will continue to
   * fetch
   */
  React.useEffect(() => {
    return () => {
      queryCache.clear();
    };
  }, []);

  /* Clear global error when showing/submitting record edit or add form. */
  React.useEffect(
    () => {
      if (editRow === null) setGlobalError(null);
      if (addRow === null) setGlobalError(null);
    },
    [addRow, editRow]
  );

  /* Whenever user deletes record, pop up a snack to allow undo */
  React.useEffect(
    () => {
      if (undoRow) {
        setSnackMessage({
          message: "Delete successful",
          row: undoRow,
          date: new Date().getTime()
        });
      }
    },
    [undoRow]
  );

  const recordsQueryKey = [
    "records",
    {
      startDate: props.startDate,
      endDate: props.endDate,
      authToken,
      contains: props.searchText
    }
  ];

  /* Filtered query to fetch data */
  const { status, data, error } = useQuery(
    recordsQueryKey,
    fetchRecords,
    { staleTime: 10 * 1000 } // milliseconds
  );

  // Update record with new data, optimistically showing new data in table, but
  // rolling back on error
  const [mutate] = useMutation(updateRecord, {
    onMutate: ({ row: newRow, method }) => {
      const previousData = queryCache.getQueryData(recordsQueryKey);
      // optimistically change, add or delete in-memory records:
      switch (method) {
        case "PUT":
          queryCache.setQueryData(
            recordsQueryKey,
            previousData.map(r => (r.id === newRow.id ? newRow : r))
          );
          break;
        case "POST":
          queryCache.setQueryData(
            recordsQueryKey,
            previousData
              .concat({ ...newRow })
              .sort((a, b) => compareDesc(a.startTime, b.startTime))
          );
          setAddRow(null);
          break;
        case "DELETE":
          setUndoRow(newRow);
          queryCache.setQueryData(
            recordsQueryKey,
            previousData.filter(r => r.id !== newRow.id)
          );
          break;
        case "UNDO_DELETE":
          setUndoRow(null);
          queryCache.setQueryData(
            recordsQueryKey,
            previousData
              .concat({ ...newRow })
              .sort((a, b) => compareDesc(a.startTime, b.startTime))
          );
          break;
        default:
          console.log("Unknown method", method);
      }
      setEditRow(null);
      setGlobalError(null);
      return () => queryCache.setQueryData(recordsQueryKey, previousData); // the rollback function
    },
    onError: (err, { row, method }, rollback) => {
      const rqData = err.response.data; // react-query object
      let reasons = [];
      if (rqData.error.message) {
        // general error:
        reasons.push({ key: "Update failed", message: rqData.error.message });
      }
      // validation error:
      if (rqData.error.validation)
        reasons = reasons.concat(rqData.error.validation);
      rollback(); // revert to previous records
      switch (method) {
        case "PUT":
          if (row.id) {
            // user must correct error or reset values, open edit form again:
            setEditRow(row.id);
          }
          break;
        case "POST":
          // user must correct error or reset values, open add form again:
          setAddRow(row);
          break;
        case "DELETE":
          // nothing else to do here
          break;
        case "UNDO_DELETE":
          // nothing else to do here
          break;
        default:
          console.log("Unknown method", method);
      }
      setGlobalError({
        message: `Update failed with error: ${err}`,
        reasons
      });
    },
    onSuccess: ({ data: rqData }) => {
      // update current cached data with latest from server
      const previousData = queryCache.getQueryData(recordsQueryKey);
      queryCache.setQueryData(
        recordsQueryKey,
        previousData
          .map(r => {
            return (r.tmpId && rqData.data.tmpId === r.tmpId) ||
              r.id === rqData.data.id
              ? imm
                  .wrap(rqData.data)
                  .del("tmpId")
                  .set("startTime", parseISO(rqData.data.startTime))
                  .set(
                    "endTime",
                    rqData.data.endTime ? parseISO(rqData.data.endTime) : null
                  )
                  .value()
              : r;
          })
          .sort(recordSortFunction)
      );
    }
  });

  /* User edited record: put new values to backend */
  const handleRowUpdate = async ({ row, newRow }) =>
    await mutate({
      row: {
        ...row,
        ...newRow
      },
      method: "PUT",
      authToken
    });

  /* User clicked "+" button: trigger showing a new record in edit mode */
  const handleAddRecord = async ({ newRow }) => {
    setAddRow({});
  };

  /* Post new record to backend */
  const handleRecordAdd = async record => {
    await mutate({
      row: { ...record, userId, tmpId: uuidv4() },
      method: "POST",
      authToken
    });
  };

  const handleRecordUndelete = async row => {
    await mutate({
      row,
      method: "UNDO_DELETE",
      authToken
    });
  };

  /* User clicked delete on record */
  const handleRecordDelete = async record => {
    await mutate({
      row: record,
      method: "DELETE",
      authToken
    });
  };

  /* User clicked "undo" after delete */
  const handleUndoDelete = async row => {
    if (undoRow) {
      await handleRecordUndelete(undoRow);
      setUndoRow(null);
    }
    setSnackMessage(null);
  };

  /* Data fetching turned up error */
  if (status === "error") {
    return (
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        open={status === "error"}
        autoHideDuration={6000}
        message={error}
      />
    );
  }

  // values for current page:
  const firstIdx = Math.max(0, page - 1) * PAGE_SIZE;
  const lastIdx = page * PAGE_SIZE;
  const pageData = Array.isArray(data) ? data.slice(firstIdx, lastIdx) : [];

  return (
    <Box mt={2}>
      {/* Empty state: no records found either because filter criteria are too
        strict or there are simply no records for user. 
        */}
      {(!data || !data.length) && (
        <EmptyState
          classes={classes}
          handleAddRecord={handleAddRecord}
          addRow={addRow}
          setAddRow={setAddRow}
          handleRecordAdd={handleRecordAdd}
        />
      )}

      {/* Loading state */}
      {status === "loading" && (
        <Box m={2} mt={3}>
          <LinearProgress />
        </Box>
      )}

      {/* General error alert */}
      {globalError && globalError.reasons && (
        <Alert severity="error">
          {globalError.message}
          <ul>
            {globalError.reasons.map(r => (
              <li key={r.key}>{r.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Error alert from data */}
      {(data || {}).error && (
        <Alert severity="error">{data.error.statusText}</Alert>
      )}

      {/* Pagination controls (if more data than fits on page 
          AND button to add record 
        */}
      {!!pageData.length && (
        <div className={classes.controls}>
          {pageData.length > PAGE_SIZE && (
            <>
              <span className={classes.pagination}>
                <Pagination
                  count={Math.ceil(data.length / PAGE_SIZE)}
                  showFirstButton
                  showLastButton
                  onChange={(e, p) => setPage(p)}
                />
              </span>
              &emsp;
            </>
          )}
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleAddRecord}
            size="small"
          >
            <Add />
          </Fab>
        </div>
      )}

      {/* Form to add a record after user clicked "+" button or again after
        adding failed */}
      {addRow && (
        <AddTableRow
          onAdd={handleRecordAdd}
          setAddRow={setAddRow}
          classes={classes}
        />
      )}

      {/* There is some data to display */}
      {!!pageData.length &&
        pageData.map((row, i, arr) => {
          return (
            <EditableTableRow
              key={row.id || row.tmpId /*assigned during optimistic update*/}
              editing={row.id === editRow}
              row={row}
              setEditing={setEditRow}
              handleRecordDelete={handleRecordDelete}
              onUpdate={v => {
                if (v !== row.date) handleRowUpdate({ row, newRow: v });
              }}
              newDay={i === 0 || row.date !== arr[Math.max(0, i - 1)].date}
              classes={classes}
            />
          );
        })}

      {/* Additional paging controls at bottom of page */}
      {pageData.length > PAGE_SIZE && (
        <Pagination
          count={Math.ceil(data.length / PAGE_SIZE)}
          showFirstButton
          showLastButton
          onChange={(e, p) => setPage(p)}
        />
      )}

      {/* Snacks to show after delete with undo button */}
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        open={!!snackMessage}
        autoHideDuration={15000}
        onClose={_ => {
          setUndoRow(null);
          setSnackMessage(null);
        }}
        message={(snackMessage || {}).message}
        action={
          <React.Fragment>
            <Button
              color="secondary"
              size="small"
              onClick={_ => handleUndoDelete(snackMessage.row)}
            >
              UNDO
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              className={classes.close}
              onClick={_ => {
                setUndoRow(null);
                setSnackMessage(null);
              }}
            >
              <Close />
            </IconButton>
          </React.Fragment>
        }
      />
    </Box>
  );
};

/*
 * Form wrapper for record.
 */
const EditableTableRow = ({
  row,
  newDay,
  editing,
  setEditing,
  handleRecordDelete,
  onUpdate,
  classes
}) => {
  return (
    <Formik
      initialValues={{
        startTime: row.startTime,
        endTime: row.endTime,
        durationMinutes: row.durationMinutes,
        note: row.note
      }}
      enableReinitialize={true}
      validate={validateRecord}
      onSubmit={(values, actions) => onUpdate(values)}
      onReset={(values, actions) => setEditing(null)}
    >
      {({
        values,
        handleSubmit,
        handleReset,
        handleChange,
        setFieldValue,
        errors
      }) => (
        <Record
          values={values}
          handleChange={handleChange}
          handleReset={handleReset}
          handleSubmit={handleSubmit}
          setFieldValue={setFieldValue}
          editing={editing}
          setEditing={setEditing}
          handleRecordDelete={handleRecordDelete}
          row={row}
          newDay={newDay}
          classes={classes}
          errors={errors}
        />
      )}
    </Formik>
  );
};

/*
 * A record Grid container, will show readonly data or form if editing.
 * When not editing, show pencil button to start editing.
 * When editing, show checkmark/save, x/cancel and trash bin buttons.
 */
const Record = ({
  values,
  handleChange,
  handleSubmit,
  handleReset,
  setFieldValue,
  errors,
  editing,
  setEditing,
  handleRecordDelete,
  row,
  newDay,
  classes
}) => {
  return (
    <Grid container className={editing ? classes.editCell : ""} spacing={1}>
      <Grid item xs={12}>
        {newDay && <Divider variant="fullWidth" />}
      </Grid>
      {/* Edit/Cancel etc icons */}
      <EditControls
        editing={editing}
        setEditing={setEditing}
        handleSubmit={handleSubmit}
        row={row}
        handleReset={handleReset}
        handleRecordDelete={handleRecordDelete}
      />
      {/* Date field */}
      <Grid
        item
        xs={12}
        sm={editing ? 6 : 5}
        md={editing ? 3 : 2}
        lg={editing ? 3 : 2}
        xl={editing ? 2 : 2}
      >
        {editing ? (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDateTimePicker
              margin="dense"
              id="start-date-time-picker"
              label="Start Time"
              format={DATE_TIME_FORMAT}
              ampm={false}
              autoOk
              showTodayButton
              value={values.startTime}
              onChange={v => setFieldValue("startTime", v)}
              error={!!errors.startTime}
              helperText={errors.startTime}
              KeyboardButtonProps={{
                "aria-label": "change start date"
              }}
            />
          </MuiPickersUtilsProvider>
        ) : (
          <Box m={1}>
            <div>{format(values.startTime, DATE_TIME_FORMAT)}</div>
          </Box>
        )}
      </Grid>
      <Grid
        item
        xs={12}
        sm={editing ? 6 : 5}
        md={editing ? 3 : 1}
        lg={editing ? 3 : 1}
        xl={editing ? 2 : 2}
      >
        {editing ? (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDateTimePicker
              margin="dense"
              id="end-date-time-picker"
              label="End Time"
              format={DATE_TIME_FORMAT}
              ampm={false}
              autoOk
              showTodayButton
              value={values.endTime}
              onChange={v => setFieldValue("endTime", v)}
              error={!!errors.endTime}
              helperText={errors.endTime}
              KeyboardButtonProps={{
                "aria-label": "change end date"
              }}
            />
          </MuiPickersUtilsProvider>
        ) : (
          <Box m={1}>
            <div>
              {values.endTime
                ? isValid(values.endTime)
                  ? format(values.endTime, "HH:mm")
                  : "—"
                : null}
            </div>
          </Box>
        )}
      </Grid>

      {/* duration field */}
      {editing || (
        <Grid item xs={12} sm={2} md={1}>
          <Box m={1} className={classes.duration}>{minToHHMM(values.durationMinutes, "—")}</Box>
        </Grid>
      )}

      {/* Note field */}
      <Grid
        item
        xs={12}
        sm={12}
        md={editing ? 5 : 7}
        lg={editing ? 5 : 7}
        xl={editing ? 6 : 6}
      >
        <EditableTextField
          editing={editing}
          name={"note"}
          value={values.note}
          rovalue={row.note || ""}
          onChange={handleChange}
          label="Note"
          errors={errors}
        />
      </Grid>

      {/* Edit/Cancel icons */}
      <EditControls
        editing={editing}
        setEditing={setEditing}
        handleSubmit={handleSubmit}
        row={row}
        handleReset={handleReset}
        handleRecordDelete={handleRecordDelete}
        show={editing}
      />
    </Grid>
  );
};

const EditableTextField = ({
  editing,
  name,
  value,
  rovalue,
  label,
  onChange,
  errors
}) =>
  editing ? (
    <TextField
      margin="dense"
      name={name}
      label={label}
      id={name}
      value={value}
      onChange={onChange}
      multiline={name === "note"}
      fullWidth
      error={!!errors[name]}
      helperText={errors[name]}
    />
  ) : (
    <Box m={1}>
      {(rovalue || "").split("\n").map((line, i, arr) => (
        <div style={{ overflow: "auto" }} key={i + line}>
          {i === arr.length - 1 ? line : line + " ↵ "}
        </div>
      ))}
    </Box>
  );

const AddTableRow = ({ onAdd, setAddRow, classes }) => (
  <Formik
    initialValues={{
      startTime: new Date(),
      endTime: null,
      note: ""
    }}
    validate={validateRecord}
    onSubmit={(values, actions) => onAdd(values)}
    onReset={(values, actions) => setAddRow(null)}
  >
    {({
      values,
      handleSubmit,
      handleReset,
      handleChange,
      setFieldValue,
      errors
    }) => (
      <Grid container className={classes.editCell} spacing={1}>
        {/* Done/Cancel icons */}
        <Grid item xs={12} md={1}>
          <IconButton aria-label="edit" size="small" onClick={handleSubmit}>
            <Done />
          </IconButton>
          <IconButton
            aria-label="edit"
            size="small"
            onClick={_ => {
              handleReset();
            }}
          >
            <Close />
          </IconButton>
        </Grid>
        {/* Date field */}
        <Grid item xs={12} md={2}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDateTimePicker
              margin="dense"
              id="start-date-time-picker"
              label="Start Time"
              format={DATE_TIME_FORMAT}
              ampm={false}
              autoOk
              showTodayButton
              value={values.startTime}
              onChange={v => setFieldValue("startTime", v)}
              error={!!errors.startTime}
              helperText={errors.startTime}
              KeyboardButtonProps={{
                "aria-label": "change start date"
              }}
            />
          </MuiPickersUtilsProvider>
        </Grid>
        <Grid item xs={12} md={2}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDateTimePicker
              margin="dense"
              id="end-date-time-picker"
              label="End Time"
              format={DATE_TIME_FORMAT}
              ampm={false}
              autoOk
              showTodayButton
              value={values.endTime}
              onChange={v => setFieldValue("endTime", v)}
              error={!!errors.endTime}
              helperText={errors.endTime}
              KeyboardButtonProps={{
                "aria-label": "change end date"
              }}
            />
          </MuiPickersUtilsProvider>
        </Grid>
        {/* Note field */}
        <Grid item xs={12} md={6}>
          <EditableTextField
            editing={true}
            name={"note"}
            value={values.note}
            onChange={handleChange}
            label="Note"
            errors={errors}
          />
        </Grid>
        <AddControls handleSubmit={handleSubmit} handleReset={handleReset} />
      </Grid>
    )}
  </Formik>
);

/* Done/Close buttons in "add" form */
const AddControls = ({ handleSubmit, handleReset }) => (
  <Grid item xs={12} md={1}>
    <IconButton aria-label="edit" size="small" onClick={handleSubmit}>
      <Done />
    </IconButton>
    <IconButton aria-label="edit" size="small" onClick={handleReset}>
      <Close />
    </IconButton>
  </Grid>
);

/* Done/Edit/Cancel/Delete icon buttons in "edit" form */
const EditControls = ({
  editing,
  setEditing,
  handleSubmit,
  row,
  handleReset,
  handleRecordDelete,
  show = true
}) =>
  show ? (
    <Grid item xs={12} md={1}>
      {editing ? (
        <IconButton aria-label="edit" size="small" onClick={handleSubmit}>
          <Done />
        </IconButton>
      ) : (
        <IconButton
          aria-label="edit"
          size="small"
          onClick={_ => setEditing(row.id)}
        >
          <Edit />
        </IconButton>
      )}
      {editing && (
        <>
          <IconButton aria-label="reset" size="small" onClick={handleReset}>
            <Close />
          </IconButton>
          <IconButton
            aria-label="delete"
            size="small"
            onClick={_ => handleRecordDelete(row)}
          >
            <Delete />
          </IconButton>
        </>
      )}
    </Grid>
  ) : null;

/* Validation functions for formal correctness of date and startTime fields */
const validateRecord = values => {
  const errors = {};
  if (!values.startTime) {
    errors.startTime = "Required";
  } else if (!isValid(values.startTime)) {
    errors.startTime = "Invalid Start Time";
  }

  if (values.endTime !== null && !isValid(values.endTime))
    errors.endTime = "Invalid Date";

  if (
    values.startTime &&
    values.endTime &&
    differenceInMinutes(values.endTime, values.startTime) < 0
  ) {
    errors.endTime = "End Time must be after Start Time";
  }

  return errors;
};

// Memoize component to minimize rendering of complex Grid
export default React.memo(RecordsGrid);
