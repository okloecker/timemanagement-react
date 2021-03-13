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
      <Tooltip title="Finish" aria-label="finish">
        <IconButton aria-label="edit" size="small" onClick={_ => setStop(id)}>
          <Check />
        </IconButton>
      </Tooltip>
    )}
    <Tooltip title="Edit" aria-label="edit">
      <IconButton aria-label="edit" size="small" onClick={_ => setEditing(id)}>
        <Edit />
      </IconButton>
    </Tooltip>
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
    <Tooltip title="Save" aria-label="save">
      <IconButton aria-label="save" size="small" onClick={handleSubmit}>
        <Done />
      </IconButton>
    </Tooltip>
    <Tooltip title="Cancel" aria-label="cancel">
      <IconButton aria-label="cancel" size="small" onClick={handleReset}>
        <Close />
      </IconButton>
    </Tooltip>
    <Tooltip title="Delete" aria-label="delete">
      <IconButton
        aria-label="delete"
        size="small"
        onClick={_ => handleRecordDelete(row)}
      >
        <Delete />
      </IconButton>
    </Tooltip>
  </>
);

/* Done/Close buttons in "add" form */
const AddControls = ({ handleSubmit, handleReset }) => (
  <Grid item xs={12} md={1}>
    <Tooltip title="Save" aria-label="save">
      <IconButton aria-label="save" size="small" onClick={handleSubmit}>
        <Done />
      </IconButton>
    </Tooltip>
    <Tooltip title="Cancel" aria-label="cancel">
      <IconButton aria-label="cancel" size="small" onClick={handleReset}>
        <Close />
      </IconButton>
    </Tooltip>
  </Grid>
);

/* The start/stop button to add or stop a new record with time current when pressed */
const StartStopButton = React.forwardRef(({ onClick, showStartButton, topActivities = [] }, ref) => {
  const classes = useStyles();
  const [pendingValue, setPendingValue] = React.useState(topActivities.length ? topActivities[0].note : undefined);
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
            getOptionLabel={option => option.note || pendingValue}
            onSelect={e => setPendingValue(e.target.value)}
            onChange={(_, newValue) => setPendingValue(newValue.note)}
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
            ref={ref}
          >
            {showStartButton ? <PlayArrow /> : <Check />}
          </Fab>
        </Tooltip>
      </div>
    </Grid>
  );
});

export { AddControls, EditControls, StartEditControls, StartStopButton };
