import DateFnsUtils from "@date-io/date-fns";
import {
  Box,
  Button,
  ButtonGroup,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Clear, ExpandMore, Search } from "@material-ui/icons";
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider
} from "@material-ui/pickers";
import endOfDay from "date-fns/endOfDay";
import endOfMonth from "date-fns/endOfMonth";
import endOfWeek from "date-fns/endOfWeek";
import isBefore from "date-fns/isBefore";
import isDate from "date-fns/isDate";
import isEqual from "date-fns/isEqual";
import isValid from "date-fns/isValid";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import startOfDay from "date-fns/startOfDay";
import startOfMonth from "date-fns/startOfMonth";
import startOfWeek from "date-fns/startOfWeek";
import { Formik } from "formik";
import React from "react";
import RecordsGrid from "records/RecordsGrid";
import { getStorageItem, setStorageItem } from "storage/storage";
import { elliptic } from "helpers/strings";

const DEBOUNCE_TIMEOUT_MS = 500;
const DATE_FORMAT = "yyyy-MM-dd";
const EM_DASH = "—";

const useStyles = makeStyles(theme => ({
  root: { flexGrow: 1 },
  paper: { height: 140, width: 100 },
  control: { padding: theme.spacing(2) }
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

  // atomically set both date1 and date2 at the same time
  // doing it directly one after the other with handleDatesChange can lead to calls being lost
  const handleDatesChange = (date1, date2, setFieldValue) => {
    if (isValid(date1) && isValid(date2)) {
      setFieldValue("selectedStartDate", date1);
      setFieldValue("selectedEndDate", date2);
      setStorageItem("selectedStartDate", date1.toISOString());
      setStorageItem("selectedEndDate", date2.toISOString());
      setFormValues({
        ...formValues,
        selectedStartDate: date1,
        selectedEndDate: date2
      });
    }
  };

  const handleMouseDownSearch = event => {
    event.preventDefault();
  };

  // Keyboard shortcuts: imperatively remote control RecordsGrid's start/stop
  // button to start an active record with "ctrl-alt-s" and stop it with "ctrl-alt-x"
  // and edit with "ctrl-alt-e"
  const recordsGridRef = React.createRef();
  React.useEffect(
    () => {
      const onKeyUp = ({ key, shiftKey, ctrlKey, altKey }) => {
        if (recordsGridRef && recordsGridRef.current && ctrlKey && altKey) {
          switch (key.toLowerCase()) {
            case "s":
              recordsGridRef.current.toggle(true);
              break;
            case "x":
              recordsGridRef.current.toggle(false);
              break;
            case "e":
              recordsGridRef.current.editLatest();
              break;
            default:
            // Keyboard shortcut not defined
          }
        }
      };

      document.addEventListener("keyup", onKeyUp);
      return () => {
        window.removeEventListener("keyup", onKeyUp);
      };
    },
    [recordsGridRef]
  );

  const handlePresetButtonClick = (interval, setFieldValue) => {
    let date1 = startOfDay(new Date());
    let date2 = endOfDay(date1);
    switch (interval) {
      case "month":
        date1 = startOfMonth(new Date());
        date2 = endOfMonth(date1);
        break;
      case "week":
        date1 = startOfWeek(new Date(), { weekStartsOn: 1 });
        date2 = endOfWeek(date1, { weekStartsOn: 1 });
        break;
      case "today":
      default:
      // same as today
    }
    handleDatesChange(date1, date2, setFieldValue);
  };

  return (
    <Box m={2}>
      {/* add some margin to component */}
      <Grid container className={classes.root} justify="center">
        <Grid item xs={12} lg={11} xl={10}>
          <Paper className={classes.control} elevation={2}>
            <ExpansionPanel>
              <ExpansionPanelSummary
                expandIcon={<ExpandMore />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                Filter{" "}
                {`${format(
                  formValues.selectedStartDate,
                  DATE_FORMAT
                )} ${EM_DASH} ${format(
                  formValues.selectedEndDate,
                  DATE_FORMAT
                )}  ${EM_DASH} ${elliptic(formValues.searchText, 30)}`}
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <Formik
                  initialValues={getInitialValues()}
                  validate={values => {
                    const errors = {};
                    if (
                      isDate(values.selectedStartDate) &&
                      isDate(values.selectedEndDate) &&
                      !isBefore(
                        values.selectedStartDate,
                        values.selectedEndDate
                      ) &&
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
                    <Grid container justify="center" spacing={0}>
                      <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <Grid container justify="center" spacing={0}>
                          <Box p={1}>
                            <ButtonGroup aria-label="preset date intervals">
                              <Button
                                onClick={_ =>
                                  handlePresetButtonClick(
                                    "month",
                                    setFieldValue
                                  )
                                }
                              >
                                This Month
                              </Button>
                              <Button
                                onClick={_ =>
                                  handlePresetButtonClick("week", setFieldValue)
                                }
                              >
                                This Week
                              </Button>
                              <Button
                                onClick={_ =>
                                  handlePresetButtonClick(
                                    "today",
                                    setFieldValue
                                  )
                                }
                              >
                                Today
                              </Button>
                            </ButtonGroup>
                          </Box>
                        </Grid>
                        <Grid container justify="center" spacing={0}>
                          <Box mr={1} minWidth={170} width={"10%"}>
                            <Grid item>
                              <KeyboardDatePicker
                                id="date-picker-dialog-start"
                                margin="dense"
                                label="Start Date"
                                format={DATE_FORMAT}
                                showTodayButton
                                value={values.selectedStartDate}
                                onChange={d =>
                                  handleDateChange(
                                    "selectedStartDate",
                                    startOfDay(d),
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
                                format={DATE_FORMAT}
                                showTodayButton
                                value={values.selectedEndDate}
                                onChange={d =>
                                  handleDateChange(
                                    "selectedEndDate",
                                    endOfDay(d),
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
                      </MuiPickersUtilsProvider>
                    </Grid>
                  )}
                </Formik>
              </ExpansionPanelDetails>
            </ExpansionPanel>

            <RecordsGrid
              startDate={formValues.selectedStartDate}
              endDate={formValues.selectedEndDate}
              searchText={(formValues.searchText || "").trim()}
              ref={recordsGridRef}
              userInfo={props.userInfo}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
