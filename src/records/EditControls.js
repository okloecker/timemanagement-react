import React from "react";
import { Grid, IconButton, TextField } from "@material-ui/core";
import {
  Close,
  Delete,
  Done,
  Edit,
  CheckCircleOutline,
  PlayCircleOutline
} from "@material-ui/icons";
import Autocomplete from "@material-ui/lab/Autocomplete";
import log from "loglevel";

/* Done/Edit/Cancel/Delete icon buttons in "edit" form */
const StartEditControls = ({ id, setEditing, setStop }) => (
  <>
    {setStop && (
      <IconButton aria-label="edit" size="small" onClick={_ => setStop(id)}>
        <CheckCircleOutline />
      </IconButton>
    )}
    <IconButton aria-label="edit" size="small" onClick={_ => setEditing(id)}>
      <Edit />
    </IconButton>
  </>
);

const EditControls = ({
  handleSubmit,
  handleReset,
  handleRecordDelete,
  row,
  setEditing
}) => (
  <>
    <IconButton aria-label="edit" size="small" onClick={handleSubmit}>
      <Done />
    </IconButton>
    <IconButton aria-label="reset" size="small" onClick={handleReset}>
      <Close />
    </IconButton>
    <IconButton
      aria-label="delete"
      size="small"
      onClick={_ => handleRecordDelete(row)}
    >
      <Delete />
    </IconButton>
  </>
);

/* Done/Close buttons in "add" form */
const AddControls = ({ handleSubmit, handleReset }) => (
  <Grid item xs={12} md={1}>
    <IconButton aria-label="edit" size="small" onClick={handleSubmit}>
      <Done />
    </IconButton>
    <IconButton aria-label="edit" size="small" onClick={handleReset}>
      <Close />
    </IconButton>
  </Grid>
);

/* The start/stop button to add or stopa new record with time current when pressed */
const StartStopButton = ({ onClick, showStartButton, topActivities = [] }) => {
  const [pendingValue, setPendingValue] = React.useState();
  return (
    <Grid container justify="center">
      {!!topActivities.length && showStartButton && (
        <Grid item>
          <ActivityDropddown
            /* when deleting latest activity, make sure a new component is created by
             * changing the key, otherwise material-ui will complain about making an
             * uncontrolled component controlled by changing defaultValue: */
            key={topActivities[0].note}
            options={topActivities}
            onSelect={setPendingValue}
            defaultValue={topActivities[0]}
          />
          {log.debug(
            "defaultValue",
            topActivities[0].note,
            topActivities[0].startTime
          )}
        </Grid>
      )}
      <Grid item>
        {!!showStartButton ? "Start new:" : "Stop current:"}
        <IconButton
          aria-label="edit"
          size="medium"
          onClick={() => onClick(pendingValue)}
        >
          {showStartButton ? <PlayCircleOutline /> : <CheckCircleOutline />}
        </IconButton>
      </Grid>
    </Grid>
  );
};

const ActivityDropddown = ({ options, onSelect, defaultValue }) => (
  <Autocomplete
    id="activity-dropdown"
    fullWidth
    freeSolo
    options={options}
    getOptionLabel={option => option.note}
    style={{ width: 300 }}
    onSelect={e => onSelect(e.target.value)}
    defaultValue={defaultValue}
    renderInput={params => <TextField {...params} label="Previous Notes" />}
  />
);

export {
  AddControls,
  EditControls,
  StartEditControls,
  StartStopButton,
  ActivityDropddown
};
