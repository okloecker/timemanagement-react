import React from "react";
import { Formik } from "formik";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
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
import Check from "@material-ui/icons/Check";
import Close from "@material-ui/icons/Close";
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
    return err;
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
  const handleCellClick = (name, id) => {
    setEditRow(id);
  };

  const [globalError, setGlobalError] = React.useState();

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
    { staleTime: 60 * 1000 } // milliseconds
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
      setGlobalError(`Update failed with error: ${err}`);
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

  const handleRowUpdate = async ({ row, name, value }) =>
    await mutate({
      row: {
        ...row,
        [name]: value
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
              <TableCell>Date</TableCell>
              <TableCell align="right">Hours</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length ? (
              data.map(row => (
                <TableRow key={row.id} row={row}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">{row.timeString}</TableCell>
                  <TableCell onClick={_ => handleCellClick("note", row.id)}>
                    {editRow === row.id ? (
                      <EditableNote
                        fieldName={"Note"}
                        fieldValue={row.note}
                        onUpdate={v => {
                          console.log("new value", v);
                          if (v !== row.note)
                            handleRowUpdate({ row, name: "note", value: v });
                          setEditRow(null);
                        }}
                      />
                    ) : (
                      row.note
                    )}
                  </TableCell>
                </TableRow>
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

const EditableNote = ({ fieldName, fieldValue, onUpdate }) => {
  return (
    <Formik
      initialValues={{ [fieldName]: fieldValue }}
      onSubmit={(values, actions) => onUpdate(values[fieldName])}
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
        <TextField
          fullWidth
          margin="normal"
          name={fieldName}
          label={`Edit ${fieldName}`}
          id={fieldName}
          value={values[fieldName]}
          onChange={e => {
            handleBlur(e);
            handleChange(e);
          }}
          inputProps={{ id: fieldName }}
          InputProps={{
            endAdornment: (
              <>
                <InputAdornment position="start">
                  {touched[fieldName] && (
                    <IconButton aria-label="save" onClick={handleSubmit}>
                      <Check />
                    </IconButton>
                  )}
                </InputAdornment>
                <InputAdornment position="start">
                  {touched[fieldName] && (
                    <IconButton
                      aria-label="cancel"
                      onClick={e => {
                        setFieldValue(fieldName, fieldValue);
                        handleSubmit(e);
                      }}
                    >
                      <Close />
                    </IconButton>
                  )}
                </InputAdornment>
              </>
            )
          }}
        />
      )}
    </Formik>
  );
};

export default React.memo(RecordsTable);
