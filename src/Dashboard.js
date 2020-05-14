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
import { Clear, Search } from "@material-ui/icons";
import DateFnsUtils from "@date-io/date-fns";
import isDate from "date-fns/isDate";
import isValid from "date-fns/isValid";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import isBefore from "date-fns/isBefore";
import isEqual from "date-fns/isEqual";
import parseISO from "date-fns/parseISO";
import { getStorageItem, setStorageItem } from "storage/storage";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from "@material-ui/pickers";
import RecordsGrid from "RecordsGrid";

const DEBOUNCE_TIMEOUT_MS = 500;

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
  selectedStartDate: getStorageItem("selectedStartDate")
    ? parseISO(getStorageItem("selectedStartDate"))
    : startOfMonth(new Date()),
  selectedEndDate: getStorageItem("selectedEndDate")
    ? parseISO(getStorageItem("selectedEndDate"))
    : endOfMonth(new Date()),
  searchText: getStorageItem("searchText") || ""
});

const Dashboard = props => {
  const classes = useStyles();

  const [searchTimeout, setSearchTimeout] = React.useState(null);
  const [formValues, setFormValues] = React.useState(getInitialValues());
  // changes searchText prop for RecordsTable only when there's no keyboard input for 750ms
  const debounceSearchTextChange = (text = "", setFieldValue) => {
    setFieldValue("searchText", text);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        setFormValues({ ...formValues, searchText: text });
      }, DEBOUNCE_TIMEOUT_MS)
    );
  };

  const handleDateChange = (name, d, setFieldValue) => {
    if (isValid(d)) {
      setFieldValue(name, d);
      setStorageItem(name, d.toISOString());
      setFormValues({ ...formValues, [name]: d });
    }
  };

  const handleMouseDownSearch = event => {
    event.preventDefault();
  };

  return (
    <Box m={2}>
      {/* add some margin to component */}
      <Grid container className={classes.root} justify="center">
        <Grid item xs={12} md={11} lg={10}>
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
                  setStorageItem("searchText", values.searchText);
                return errors;
              }}
            >
              {({ values, errors, handleChange, setFieldValue }) => (
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <Grid container justify="center" spacing={0}>
                    <Box mr={1} minWidth={170} width={"10%"}>
                      <Grid item>
                        <KeyboardDatePicker
                          id="date-picker-dialog-start"
                          margin="dense"
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
                    </Box>
                    <Box mr={1} minWidth={170} width={"10%"}>
                      <Grid item>
                        <KeyboardDatePicker
                          id="date-picker-dialog-end"
                          margin="dense"
                          label="End Date"
                          format="yyyy-MM-dd"
                          value={values.selectedEndDate}
                          onChange={e =>
                            handleDateChange(
                              "selectedEndDate",
                              e,
                              setFieldValue
                            )
                          }
                          error={!!errors.selectedEndDate}
                          helperText={errors.selectedEndDate}
                          KeyboardButtonProps={{
                            "aria-label": "change end date"
                          }}
                        />
                      </Grid>
                    </Box>
                    <Box m={0}>
                      <Grid item>
                        <TextField
                          name="searchText"
                          margin="dense"
                          label="Search"
                          id="searchbox"
                          value={values.searchText}
                          onChange={e =>
                            debounceSearchTextChange(
                              e.target.value,
                              setFieldValue
                            )
                          }
                          inputProps={{ id: "searchText" }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                {values.searchText && (
                                  <IconButton
                                    aria-label="clear search"
                                    onClick={e =>
                                      debounceSearchTextChange(
                                        e.target.value,
                                        setFieldValue
                                      )
                                    }
                                    onMouseDown={handleMouseDownSearch}
                                  >
                                    <Clear />
                                  </IconButton>
                                )}
                                <IconButton aria-label="search" disabled>
                                  <Search />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    </Box>
                  </Grid>
                  <RecordsGrid
                    startDate={formValues.selectedStartDate}
                    endDate={formValues.selectedEndDate}
                    searchText={formValues.searchText}
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
