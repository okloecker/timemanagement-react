import React from "react";
import { Formik } from "formik";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import parseISO from "date-fns/parseISO";
import isDate from "date-fns/isDate";
import { getCookie } from "helpers/cookies";

const useStyles = makeStyles({
  table: {
    minWidth: 650
  },
  root: {
    minWidth: 275
  },
  title: {
    fontSize: 20,
    textAlign: "center"
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

const RecordsTable = props => {
  const classes = useStyles();

  const authToken = getCookie("authToken");

  const [editRow, setEditRow] = React.useState();

  const [globalError, setGlobalError] = React.useState();

  React.useEffect(
    () => {
      setGlobalError(null);
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
      return () => queryCache.setQueryData(key, previousData); // the rollback function
    },
    onError: (err, row, rollback) => {
      const reason = err.response.data.date
        ? err.response.data.date.join(";")
        : null;
      setGlobalError(`Update failed with error: ${err} ${reason || ""}`);
      debugger;
      rollback();
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

  if (!data || !data || !data.length) {
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
  return (
    <Box m={2}>
      {globalError && <Alert severity="error">{globalError}</Alert>}
      <TableContainer>
        <Table className={classes.table} aria-label="time records" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Edit</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Hours</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length ? (
              data.map(row => (
                <EditableTableRow
                  key={row.id}
                  editing={row.id === editRow}
                  row={row}
                  setEditing={setEditRow}
                  onUpdate={v => {
                    console.log("new value", v);
                    if (v !== row.date)
                      handleRowUpdate({ row, newRow: v });
                    setEditRow(null);
                  }}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3}>
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
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const EditableTableRow = ({ row, editing, setEditing, onUpdate }) => {
  return (
    <Formik
      initialValues={{
        date: row.date,
        timeString: row.timeString,
        note: row.note
      }}
      onSubmit={(values, actions) => {
        values.canceled ? setEditing(null) : onUpdate(values);
        actions.resetForm();
      }}
    >
      {({
        values,
        errors,
        touched,
        handleBlur,
        handleSubmit,
        handleChange,
        setFieldValue
      }) => (
        <TableRow>
          {/* Edit/Cancel icons */}
          <TableCell>
            {/*TODO: 
            use https://material-ui.com/customization/breakpoints/ for mobile
            */}
            {editing ? (
              <IconButton aria-label="edit" onClick={handleSubmit}>
                <Done />
              </IconButton>
            ) : (
              <IconButton aria-label="edit" onClick={_ => setEditing(row.id)}>
                <Edit />
              </IconButton>
            )}
            {editing && (
              <IconButton
                aria-label="edit"
                onClick={_ => {
                  setFieldValue("canceled", true);
                  handleSubmit();
                }}
              >
                <Close />
              </IconButton>
            )}
          </TableCell>
          {/* Date field */}
          <TableCell>
            <EditableTextField
              editing={editing}
              name={"date"}
              value={values.date}
              rovalue={row.date}
              onChange={handleChange}
              label="Date"
            />
          </TableCell>
          {/* Time field */}
          <TableCell align="right">
            <EditableTextField
              editing={editing}
              name={"timeString"}
              value={values.timeString}
              rovalue={row.timeString}
              onChange={handleChange}
              label="Hours"
            />
          </TableCell>
          {/* Note field */}
          <TableCell>
            <EditableTextField
              editing={editing}
              name={"note"}
              value={values.note}
              rovalue={row.note}
              onChange={handleChange}
              label="Note"
            />
          </TableCell>
        </TableRow>
      )}
    </Formik>
  );
};

const EditableTextField = ({
  editing,
  name,
  value,
  rovalue,
  label,
  onChange
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
    />
  ) : (
    rovalue.replace(/\n\n/g, " ↵ ")
  );

export default React.memo(RecordsTable);
