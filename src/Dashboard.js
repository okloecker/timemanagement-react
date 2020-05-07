import React from "react";
import { Formik } from "formik";
import {
  Box,
  Grid,
  Paper,
  TextField,
  IconButton,
  InputAdornment
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Search from "@material-ui/icons/Search";
import Clear from "@material-ui/icons/Clear";
import DateFnsUtils from "@date-io/date-fns";
import isDate from "date-fns/isDate";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import isBefore from "date-fns/isBefore";
import isEqual from "date-fns/isEqual";
import parseISO from "date-fns/parseISO";
import * as storage from "storage/storage";
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

const getInitialValues = _ => ({
  selectedStartDate: storage.local.getItem("selectedStartDate")
    ? parseISO(storage.local.getItem("selectedStartDate"))
    : startOfMonth(new Date()),
  selectedEndDate: storage.local.getItem("selectedEndDate")
    ? parseISO(storage.local.getItem("selectedEndDate"))
    : endOfMonth(new Date()),
  searchText: storage.local.getItem("searchText")
});

const handleDateChange = (name, d, setFieldValue) => {
  if (isDate(d) && d.toString() !== "Invalid Date") {
    setFieldValue(name, d);
    storage.local.setItem(name, d.toISOString());
  }
};

const Dashboard = props => {
  const classes = useStyles();

  const handleMouseDownSearch = event => {
    event.preventDefault();
  };

  return (
    <Box m={2}>
      {" "}
      {/* add some margin to component */}
      <Grid container className={classes.root} justify="center">
        <Grid item xs={10}>
          <Paper className={classes.control} elevation={2}>
            <Formik
              initialValues={getInitialValues()}
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
                if (Object.keys(errors === 0))
                  storage.local.setItem("searchText", values.searchText);
                return errors;
              }}
            >
              {({ values, errors, handleChange, setFieldValue }) => (
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <Grid container justify="center" spacing={5}>
                    <Grid item>
                      <KeyboardDatePicker
                        margin="normal"
                        id="date-picker-dialog-start"
                        label="Start Date"
                        format="yyyy-MM-dd"
                        value={values.selectedStartDate}
                        onChange={e =>
                          handleDateChange(
                            "selectedStartDate",
                            e,
                            setFieldValue
                          )
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
                        format="yyyy-MM-dd"
                        value={values.selectedEndDate}
                        onChange={e =>
                          handleDateChange("selectedEndDate", e, setFieldValue)
                        }
                        error={!!errors.selectedEndDate}
                        helperText={errors.selectedEndDate}
                        KeyboardButtonProps={{
                          "aria-label": "change end date"
                        }}
                      />
                    </Grid>
                    <Grid item>
                      <TextField
                        margin="normal"
                        name="searchText"
                        label="Search"
                        id="searchbox"
                        value={values.searchText}
                        onChange={handleChange}
                        inputProps={{ id: "searchText" }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {values.searchText && (
                                <IconButton
                                  aria-label="clear search"
                                  onClick={e => setFieldValue("searchText", "")}
                                  onMouseDown={handleMouseDownSearch}
                                >
                                  <Clear />
                                </IconButton>
                              )}
                              <IconButton aria-label="search">
                                <Search />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                  <RecordsTable
                    startDate={values.selectedStartDate}
                    endDate={values.selectedEndDate}
                    searchText={values.searchText}
                  />
                </MuiPickersUtilsProvider>
              )}
            </Formik>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
