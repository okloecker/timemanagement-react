import React from "react";
import { Formik } from "formik";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Snackbar,
  TextField,
  Typography
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import Close from "@material-ui/icons/Close";
import Done from "@material-ui/icons/Done";
import Edit from "@material-ui/icons/Edit";
import { makeStyles } from "@material-ui/core/styles";
import { useQuery, useMutation, queryCache } from "react-query";
import format from "date-fns/format";
import parse from "date-fns/parse";
import parseISO from "date-fns/parseISO";
import isDate from "date-fns/isDate";
import isValid from "date-fns/isValid";
import { getCookie } from "helpers/cookies";
import PagingControls from "PagingControls";

const PAGE_SIZE = 30;

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
  }
});

const fetchRecords = async (
  key,
  { startDate, endDate, contains, authToken }
) => {
  try {
    const from = format(
      isDate(startDate) ? startDate : parseISO(startDate),
      "yyyy-MM-dd"
    );
    const to = format(
      isDate(endDate) ? endDate : parseISO(endDate),
      "yyyy-MM-dd"
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

const putRecord = ({ row, authToken }) =>
  axios(`/app/timerecord/${row.id}`, {
    method: "PUT",
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
    onMutate: ({ row: newRow }) => {
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
      queryCache.setQueryData(
        key,
        previousData.map(r => (r.id === newRow.id ? newRow : r))
      );
      setGlobalError(null);
      setEditRow(null);
      return () => queryCache.setQueryData(key, previousData); // the rollback function
    },
    onError: (err, { row }, rollback) => {
      const reasons = err.response.data
        ? Object.keys(err.response.data).reduce(
            (acc, k) => acc.concat(err.response.data[k].flat()),
            []
          )
        : [];
      rollback();
      // user must correct error or reset values
      setEditRow(row.id);
      setGlobalError({ message: `Update failed with error: ${err}`, reasons });
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
      authToken
    });

  const firstIdx = Math.max(0, page - 1) * PAGE_SIZE;
  const lastIdx = page * PAGE_SIZE;
  const pageData = data.slice(firstIdx, lastIdx);

  return (
    <Box m={2}>
      <PagingControls
        page={page}
        setPage={setPage}
        lastPage={Math.ceil(data.length / PAGE_SIZE)}
        firstIdx={firstIdx}
        lastIdx={lastIdx}
        dataCount={data.length}
      />
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
      <Grid container>
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
              newDay={i===0 || row.date !== arr[Math.max(0, i - 1)].date}
              classes={classes}
            />
          ))
        ) : (
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
        )}
      </Grid>
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
      validate={values => {
        const errors = {};
        if (!values.date) {
          errors.date = "Required";
        } else if (!values.date.match(/[\d]{4}-[\d]{2}-[\d]{2}/)) {
          errors.date = "Must be YYYY-MM-DD";
        } else if (
          !isValid(parse(values.date, "yyyy-MM-dd", new Date()))
        ) {
          errors.date = "Invalid Date";
        }
        if (!values.timeString) {
          errors.timeString = "Required";
        } else if (!values.timeString.match(/\d?\d:\d\d/)) {
          errors.timeString = "Must be (H)H:MM";
        }

        return errors;
      }}
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
    rovalue.split("\n").map((line, i, arr) => (
      <div style={{ overflow: "auto" }} key={i + line}>
        {i === arr.length - 1 ? line : line + "↵ "}
      </div>
    ))
  );

export default React.memo(RecordsGrid);
