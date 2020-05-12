import React from "react";
import { Formik } from "formik";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Fab,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  TextField,
  Typography
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { Add, Close, Done, Edit } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { useQuery, useMutation, queryCache } from "react-query";
import format from "date-fns/format";
import parse from "date-fns/parse";
import parseISO from "date-fns/parseISO";
import isDate from "date-fns/isDate";
import isValid from "date-fns/isValid";
import { getCookie } from "helpers/cookies";
import PagingControls from "PagingControls";
import { getStorageItem } from "storage/storage";

const PAGE_SIZE = 30;
const DATE_FORMAT = "yyyy-MM-dd";
const TMP_ID = Number.MAX_SAFE_INTEGER;

const useStyles = makeStyles({
  root: {
    minWidth: 275
  },
  title: {
    fontSize: 20,
    textAlign: "center"
  },
  editCell: {
    backgroundColor: "#ffffe4",
    paddingTop: "8px"
  },
  controls: {
    paddingTop: "8px",
    paddingBottom: "16px"
  },
  fab: {
    paddingLeft: "8px"
  }
});

const fetchRecords = async (
  key,
  { startDate, endDate, contains, authToken }
) => {
  try {
    const from = format(
      isDate(startDate) ? startDate : parseISO(startDate),
      DATE_FORMAT
    );
    const to = format(
      isDate(endDate) ? endDate : parseISO(endDate),
      DATE_FORMAT
    );
    const result = await axios(
      `/app/timerecords?dateFrom=${from}&dateTo=${to}${
        contains ? "&contains=" + contains : ""
      }`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-AUTH-TOKEN": authToken
        }
      }
    );
    if (result.status >= 400) {
      return {
        error: { status: result.status, statusText: result.statusText }
      };
    } else return result.data;
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

const putRecord = ({ row, user, authToken, method = "PUT" }) =>
  axios(`/app/timerecord${method === "PUT" ? "/" + row.id : ""}`, {
    method, // "PUT" or "POST"
    headers: {
      "Content-Type": "application/json",
      "X-AUTH-TOKEN": authToken
    },
    data: row
  });

const RecordsGrid = props => {
  const classes = useStyles();

  const authToken = getCookie("authToken");

  const [editRow, setEditRow] = React.useState();
  const [addRow, setAddRow] = React.useState(null);
  const [globalError, setGlobalError] = React.useState();
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    return () => {
      // on unmounting, clear react-query cache, otherwise it will continue to
      // fetch
      queryCache.clear();
    };
  }, []);

  React.useEffect(
    () => {
      if (editRow === null) setGlobalError(null);
    },
    [editRow]
  );

  React.useEffect(
    () => {
      if (addRow === null) setGlobalError(null);
    },
    [addRow]
  );

  const { status, data, error } = useQuery(
    [
      "records",
      {
        startDate: props.startDate,
        endDate: props.endDate,
        authToken,
        contains: props.searchText
      }
    ],
    fetchRecords,
    { staleTime: 10 * 1000 } // milliseconds
  );

  // update record with new data, optimistically showing new data in table, but
  // rolling back on error
  const [mutate] = useMutation(putRecord, {
    onMutate: ({ row: newRow, method }) => {
      const key = [
        "records",
        {
          startDate: props.startDate,
          endDate: props.endDate,
          authToken,
          contains: props.searchText
        }
      ];
      const previousData = queryCache.getQueryData(key);
      if (method === "PUT") {
        queryCache.setQueryData(
          key,
          previousData.map(r => (r.id === newRow.id ? newRow : r))
        );
        setEditRow(null);
      } else {
        const newData = previousData
          .concat({ ...newRow, id: TMP_ID })
          .sort((a, b) => b.id - a.id);
        queryCache.setQueryData(key, newData);
        setAddRow(null);
      }
      setGlobalError(null);
      return () => queryCache.setQueryData(key, previousData); // the rollback function
    },
    onError: (err, { row }, rollback) => {
      let reasons = [((err.response.data || {}).error || {}).message];
      if (!reasons.length)
        reasons = err.response.data
          ? Object.keys(err.response.data).reduce(
              (acc, k) => acc.concat(err.response.data[k].flat()),
              []
            )
          : [];
      rollback();
      if (row.id !== TMP_ID) {
        // user must correct error or reset values
        setEditRow(row.id);
      } else {
        setAddRow(row);
      }
      setGlobalError({ message: `Update failed with error: ${err}`, reasons });
    },
    onSuccess: data => {
      console.log(`onSuccess  `);
      // TODO: this fetches all data; a better way would be if the backend
      // returned the new item so we could queryCache.setQueryData() with it,
      // replacing the optimistically set one with temporary ID; but the
      // backend just says "Record add was successful"
      queryCache.refetchQueries("records", {
        force: true
      });
    }
  });

  if (status === "loading") {
    return (
      <Box m={2}>
        <LinearProgress />
      </Box>
    );
  }

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

  if (data && data.error) {
    return <Alert severity="error">{data.error.statusText}</Alert>;
  }

  if (!data || !data.length) {
    return (
      <Card className={classes.root}>
        <CardContent>
          <Typography
            className={classes.title}
            color="textSecondary"
            gutterBottom
          >
            There is no data to display for these dates, try to change start and
            end dates.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleRowUpdate = async ({ row, newRow }) =>
    await mutate({
      row: {
        ...row,
        ...newRow
      },
      method: "PUT",
      authToken
    });

  /* trigger showing a new record in edit mode */
  const handleAddRecord = async ({ newRow }) => {
    setAddRow({});
  };

  /* post new record to backend */
  const handleRecordAdd = async record => {
    await mutate({
      row: { ...record, user: JSON.parse(getStorageItem("userInfo")).user },
      method: "POST",
      authToken
    });
  };

  const firstIdx = Math.max(0, page - 1) * PAGE_SIZE;
  const lastIdx = page * PAGE_SIZE;
  const pageData = data.slice(firstIdx, lastIdx);

  return (
    <Box m={2}>
      <div className={classes.controls}>
        <PagingControls
          page={page}
          setPage={setPage}
          lastPage={Math.ceil(data.length / PAGE_SIZE)}
          firstIdx={firstIdx}
          lastIdx={lastIdx}
          dataCount={data.length}
        />
        &emsp;
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleAddRecord}
          size="small"
        >
          <Add />
        </Fab>
      </div>
      {globalError && globalError.reasons && (
        <Alert severity="error">
          {globalError.message}
          <ul>
            {globalError.reasons.map(r => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Alert>
      )}

      {addRow && (
        <AddTableRow
          onAdd={handleRecordAdd}
          setAddRow={setAddRow}
          classes={classes}
        />
      )}

      {pageData.length ? (
        pageData.map((row, i, arr) => (
          <EditableTableRow
            key={row.id}
            editing={row.id === editRow}
            row={row}
            setEditing={setEditRow}
            onUpdate={v => {
              if (v !== row.date) handleRowUpdate({ row, newRow: v });
            }}
            newDay={i === 0 || row.date !== arr[Math.max(0, i - 1)].date}
            classes={classes}
          />
        ))
      ) : (
        <Grid container>
          <Grid xs={12} md={6}>
            <Card className={classes.root}>
              <CardContent>
                <Typography
                  className={classes.title}
                  color="textSecondary"
                  gutterBottom
                >
                  There is no data to display for this search text.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      <PagingControls
        page={page}
        setPage={setPage}
        lastPage={Math.ceil(data.length / PAGE_SIZE)}
        firstIdx={firstIdx}
        lastIdx={lastIdx}
        dataCount={data.length}
      />
    </Box>
  );
};

const EditableTableRow = ({
  row,
  newDay,
  editing,
  setEditing,
  onUpdate,
  classes
}) => {
  return (
    <Formik
      initialValues={{
        date: row.date,
        timeString: row.timeString,
        note: row.note
      }}
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
          row={row}
          newDay={newDay}
          classes={classes}
          errors={errors}
        />
      )}
    </Formik>
  );
};

const Record = ({
  values,
  handleChange,
  handleSubmit,
  handleReset,
  setFieldValue,
  errors,
  editing,
  setEditing,
  row,
  newDay,
  classes
}) => {
  return (
    <Grid container className={editing ? classes.editCell : ""}>
      <Grid item xs={12}>
        {newDay && <Divider variant="fullWidth" />}
      </Grid>
      {/* Edit/Cancel icons */}
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
          <IconButton
            aria-label="edit"
            size="small"
            onClick={_ => {
              handleReset();
            }}
          >
            <Close />
          </IconButton>
        )}
      </Grid>
      {/* Date field */}
      <Grid item xs={12} md={2}>
        <Box m={1}>
          <EditableTextField
            editing={editing}
            name={"date"}
            value={values.date}
            rovalue={newDay ? row.date : ""}
            onChange={handleChange}
            label="Date"
            errors={errors}
          />
        </Box>
      </Grid>
      {/* Time field */}
      <Grid item xs={12} md={1}>
        <Box m={1}>
          <EditableTextField
            editing={editing}
            name={"timeString"}
            value={values.timeString}
            rovalue={row.timeString}
            onChange={handleChange}
            label="Hours"
            errors={errors}
          />
        </Box>
      </Grid>
      {/* Note field */}
      <Grid item xs={12} md={8}>
        <Box m={1}>
          <EditableTextField
            editing={editing}
            name={"note"}
            value={values.note}
            rovalue={row.note}
            onChange={handleChange}
            label="Note"
            errors={errors}
          />
        </Box>
      </Grid>
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
      margin="normal"
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
    (rovalue || "").split("\n").map((line, i, arr) => (
      <div style={{ overflow: "auto" }} key={i + line}>
        {i === arr.length - 1 ? line : line + "↵ "}
      </div>
    ))
  );

const AddTableRow = ({ onAdd, setAddRow, classes }) => (
  <Formik
    initialValues={{
      id: TMP_ID,
      date: format(new Date(), DATE_FORMAT),
      timeString: "00:00",
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
      <Grid container className={classes.editCell}>
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
          <Box m={1}>
            <EditableTextField
              editing={true}
              name={"date"}
              value={values.date}
              onChange={handleChange}
              label="Date"
              errors={errors}
            />
          </Box>
        </Grid>
        {/* Time field */}
        <Grid item xs={12} md={1}>
          <Box m={1}>
            <EditableTextField
              editing={true}
              name={"timeString"}
              value={values.timeString}
              onChange={handleChange}
              label="Hours"
              errors={errors}
            />
          </Box>
        </Grid>
        {/* Note field */}
        <Grid item xs={12} md={8}>
          <Box m={1}>
            <EditableTextField
              editing={true}
              name={"note"}
              value={values.note}
              onChange={handleChange}
              label="Note"
              errors={errors}
            />
          </Box>
        </Grid>
      </Grid>
    )}
  </Formik>
);

const validateRecord = values => {
  const errors = {};
  if (!values.date) {
    errors.date = "Required";
  } else if (!values.date.match(/[\d]{4}-[\d]{2}-[\d]{2}/)) {
    errors.date = `Must be ${DATE_FORMAT.toUpperCase()}`;
  } else if (!isValid(parse(values.date, DATE_FORMAT, new Date()))) {
    errors.date = "Invalid Date";
  }
  if (!values.timeString) {
    errors.timeString = "Required";
  } else if (!values.timeString.match(/\d?\d:\d\d/)) {
    errors.timeString = "Must be (H)H:MM";
  }

  return errors;
};

export default React.memo(RecordsGrid);
