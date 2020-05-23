import React from "react";
import { Grid, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker
} from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { Formik } from "formik";
import validateRecord from "records/validateRecord";
import { EditControls } from "./EditControls";

const useStyles = makeStyles({
  editCell: { backgroundColor: "#ffffe4", paddingTop: "8px" }
});

const EditableRecord = ({
  row,
  setEditing,
  handleRecordDelete,
  onUpdate,
  dateTimeFormat
}) => {
  const classes = useStyles();
  return (
    <Formik
      initialValues={{
        startTime: row.startTime,
        endTime: row.endTime,
        durationMinutes: row.durationMinutes,
        note: row.note
      }}
      enableReinitialize={true}
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
        <Grid container className={classes.editCell} spacing={1}>
          {/* Done, Exit, Delete icons */}
          <Grid item xs={12} sm={12} md={1} lg={1}>
            <EditControls
              row={row}
              setEditing={setEditing}
              handleSubmit={handleSubmit}
              handleReset={handleReset}
              handleRecordDelete={handleRecordDelete}
            />
          </Grid>

          {/* Date field */}
          <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <KeyboardDateTimePicker
                margin="dense"
                id="start-date-time-picker"
                label="Start Time"
                format={dateTimeFormat}
                ampm={false}
                autoOk
                showTodayButton
                value={values.startTime}
                onChange={v => setFieldValue("startTime", v)}
                error={!!errors.startTime}
                helperText={errors.startTime}
                KeyboardButtonProps={{
                  "aria-label": "change start date"
                }}
              />
            </MuiPickersUtilsProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <KeyboardDateTimePicker
                margin="dense"
                id="end-date-time-picker"
                label="End Time"
                format={dateTimeFormat}
                ampm={false}
                autoOk
                showTodayButton
                value={values.endTime}
                onChange={v => setFieldValue("endTime", v)}
                error={!!errors.endTime}
                helperText={errors.endTime}
                KeyboardButtonProps={{
                  "aria-label": "change end date"
                }}
              />
            </MuiPickersUtilsProvider>
          </Grid>

          {/* Note field */}
          <Grid item xs={12} sm={12} md={4} lg={4} xl={6}>
            <TextField
              margin="dense"
              name={"note"}
              label={"Note"}
              id={"note"}
              value={values.note}
              onChange={handleChange}
              multiline={true}
              fullWidth
              error={!!errors.note}
              helperText={errors.note}
            />
          </Grid>

          {/* Edit/Cancel icons */}
          <Grid item xs={12} sm={12} md={1} lg={1}>
            <EditControls
              row={row}
              setEditing={setEditing}
              handleSubmit={handleSubmit}
              handleReset={handleReset}
              handleRecordDelete={handleRecordDelete}
            />
          </Grid>
        </Grid>
      )}
    </Formik>
  );
};

export default EditableRecord;
