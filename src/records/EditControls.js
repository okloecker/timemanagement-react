import React from "react";
import { Grid, IconButton } from "@material-ui/core";
import {
  Close,
  Delete,
  Done,
  Edit,
  CheckCircleOutline,
  PlayCircleOutline
} from "@material-ui/icons";

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
const StartStopButton = ({ onClick, showStartButton }) => (
  <Grid container justify="center">
    <Grid item>
      {showStartButton ? "Start new recording:" : "Stop current recording:"}
      <IconButton aria-label="edit" size="medium" onClick={onClick}>
        {showStartButton ? <PlayCircleOutline /> : <CheckCircleOutline />}
      </IconButton>
    </Grid>
  </Grid>
);

export { AddControls, EditControls, StartEditControls, StartStopButton };
