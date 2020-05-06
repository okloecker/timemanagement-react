import React from "react";
import { Formik } from "formik";
import { Grid, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import DateFnsUtils from "@date-io/date-fns";
import isDate from "date-fns/isDate";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import isBefore from "date-fns/isBefore";
import isEqual from "date-fns/isEqual";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from "@material-ui/pickers";
import RecordsTable from "RecordsTable";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  paper: {
    height: 140,
    width: 100
  },
  control: {
    padding: theme.spacing(2)
  }
}));

const Dashboard = props => {
  const classes = useStyles();

  return (
    <Grid container className={classes.root} justify="center" spacing={2}>
      <Grid item xs={10}>
        <Paper className={classes.control} elevation={2}>
          <Formik
            initialValues={{
              selectedStartDate: startOfMonth(new Date()),
              selectedEndDate: endOfMonth(new Date())
            }}
            validate={values => {
              const errors = {};
              if (
                isDate(values.selectedStartDate) &&
                isDate(values.selectedEndDate) &&
                !isBefore(values.selectedStartDate, values.selectedEndDate) &&
                !isEqual(values.selectedStartDate, values.selectedEndDate)
              ) {
                errors.selectedEndDate =
                  "End date must be at or after start date.";
              }
              return errors;
            }}
          >
            {({ values, errors, setFieldValue }) => (
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container justify="center" spacing={5}>
                  <Grid item>
                    <KeyboardDatePicker
                      margin="normal"
                      id="date-picker-dialog-start"
                      label="Start Date"
                      format="MM/dd/yyyy"
                      value={values.selectedStartDate}
                      onChange={e =>
                        isDate(e) &&
                        e.toString() !== "Invalid Date" &&
                        setFieldValue("selectedStartDate", e)
                      }
                      error={!!errors.selectedStartDate}
                      helperText={errors.selectedStartDate}
                      KeyboardButtonProps={{
                        "aria-label": "change start date"
                      }}
                    />
                  </Grid>
                  <Grid item>
                    <KeyboardDatePicker
                      margin="normal"
                      id="date-picker-dialog-end"
                      label="End Date"
                      format="MM/dd/yyyy"
                      value={values.selectedEndDate}
                      onChange={e =>
                        isDate(e) &&
                        e.toString() !== "Invalid Date" &&
                        setFieldValue("selectedEndDate", e)
                      }
                      error={!!errors.selectedEndDate}
                      helperText={errors.selectedEndDate}
                      KeyboardButtonProps={{
                        "aria-label": "change end date"
                      }}
                    />
                  </Grid>
                </Grid>
                <RecordsTable
                  startDate={values.selectedStartDate}
                  endDate={values.selectedEndDate}
                />
              </MuiPickersUtilsProvider>
            )}
          </Formik>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
