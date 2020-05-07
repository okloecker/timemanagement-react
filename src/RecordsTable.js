import React from "react";
import {
  Card,
  CardContent,
  LinearProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useQuery } from "react-query";
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

const getJson = async data => {
  if (
    (((data || {}).headers || {}).get("content-type") || "").includes(
      "application/json"
    )
  ) {
    return await data.json();
  } else return "NO_JSON";
};

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
    const result = await fetch(
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
    return getJson(result);
  } catch (err) {
    console.log("ERROR:", err);
    return err;
  }
};

const RecordsTable = props => {
  const classes = useStyles();

  const authToken = getCookie("authToken");

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

  if (status === "loading") {
    return <LinearProgress />;
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

  return (
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
                <TableCell>{row.note}</TableCell>
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
  );
};

export default React.memo(RecordsTable);
