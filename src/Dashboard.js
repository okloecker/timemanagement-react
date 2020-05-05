import React from "react";
// import PropTypes from 'prop-types';
import { Grid, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import DateFnsUtils from "@date-io/date-fns";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker
} from "@material-ui/pickers";

// timerecords?dateFrom=2016-07-28&dateTo=2016-07-31

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

  const [selectedStartDate, setSelectedStartDate] = React.useState(
    startOfMonth(new Date())
  );
  const [selectedEndDate, setSelectedEndDate] = React.useState(
    endOfMonth(new Date())
  );

  return (
    <Grid container className={classes.root} justify="center" spacing={2}>
      <Grid item xs={10}>
        <Paper className={classes.control} elevation={2}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Grid container justify="center" spacing={5}>
              <Grid item>
                <KeyboardDatePicker
                  margin="normal"
                  id="date-picker-dialog-start"
                  label="Start Date"
                  format="MM/dd/yyyy"
                  value={selectedStartDate}
                  onChange={setSelectedStartDate}
                  KeyboardButtonProps={{
                    "aria-label": "change start date"
                  }}
                />
              </Grid>
              <Grid item>
                <KeyboardTimePicker
                  margin="normal"
                  id="time-picker-start"
                  label="Start Time"
                  value={selectedStartDate}
                  onChange={setSelectedStartDate}
                  KeyboardButtonProps={{
                    "aria-label": "change start time"
                  }}
                />
              </Grid>
              <Grid item>
                <KeyboardDatePicker
                  margin="normal"
                  id="date-picker-dialog-end"
                  label="End Date"
                  format="MM/dd/yyyy"
                  value={selectedEndDate}
                  onChange={setSelectedEndDate}
                  KeyboardButtonProps={{
                    "aria-label": "change end date"
                  }}
                />
              </Grid>
              <Grid item>
                <KeyboardTimePicker
                  margin="normal"
                  id="time-picker-end"
                  label="End Time"
                  value={selectedEndDate}
                  onChange={setSelectedEndDate}
                  KeyboardButtonProps={{
                    "aria-label": "change end time"
                  }}
                />
              </Grid>
            </Grid>
          </MuiPickersUtilsProvider>
        </Paper>
      </Grid>
    </Grid>
  );
};

// Dashboard.propTypes = {
// };

export default Dashboard;
