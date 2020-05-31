import React from "react";
import { Fab, Grid, IconButton, TextField, Tooltip } from "@material-ui/core";
import {
  Close,
  Delete,
  Done,
  Edit,
  Check,
  PlayArrow
} from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
// import log from "loglevel";

const useStyles = makeStyles({
  startStopButton: {
    position: "absolute",
    top: "1em",
    right: "1em"
  }
});

/* Done/Edit/Cancel/Delete icon buttons in "edit" form */
const StartEditControls = ({ id, setEditing, setStop }) => (
  <>
    {setStop && (
      <IconButton aria-label="edit" size="small" onClick={_ => setStop(id)}>
        <Check />
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
  const classes = useStyles();
  const [pendingValue, setPendingValue] = React.useState();
  return (
    <Grid container justify="center" spacing={2}>
      {!!topActivities.length && showStartButton && (
        <Grid item xs={12} md={8}>
          <Autocomplete
            id="activity-dropdown"
            /* when deleting latest activity, make sure a new component is created by
             * changing the key, otherwise material-ui will complain about making an
             * uncontrolled component controlled by changing defaultValue: */
            key={topActivities[0].note}
            fullWidth
            freeSolo
            options={topActivities}
            getOptionLabel={option => option.note}
            onSelect={e => setPendingValue(e.target.value)}
            defaultValue={topActivities[0]}
            renderInput={params => (
              <TextField {...params} label="Previous Notes" />
            )}
          />
        </Grid>
      )}
      <div className={classes.startStopButton}>
        <Tooltip
          title={!!showStartButton ? "Start new" : "Stop current"}
          aria-label={!!showStartButton ? "Start new:" : "Stop current:"}
        >
          <Fab
            color="primary"
            aria-label="edit"
            onClick={() => onClick(pendingValue)}
            size="large"
          >
            {showStartButton ? <PlayArrow /> : <Check />}
          </Fab>
        </Tooltip>
      </div>
    </Grid>
  );
};

export { AddControls, EditControls, StartEditControls, StartStopButton };
