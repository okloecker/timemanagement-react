import React from "react";
import { Box, Divider, Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import format from "date-fns/format";
import isValid from "date-fns/isValid";
import { minToArr } from "helpers/time";
import { StartEditControls } from "./EditControls";
import TimeDuration from "TimeDuration";

const useStyles = makeStyles({
  duration: { fontStyle: "italic", textAlign: "right" }
});

const ReadonlyRecord = ({
  id,
  startTime,
  endTime,
  durationMinutes,
  note,
  newDay,
  dateTimeFormat,
  setEditing,
  setStop
}) => {
  const classes = useStyles();
  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        {newDay && <Divider variant="fullWidth" />}
      </Grid>

      {/* Edit/Cancel etc icons */}
      <Grid item xs={12} sm={1}>
        <StartEditControls setEditing={setEditing} id={id} setStop={setStop} />
      </Grid>

      {/* StartTime field */}
      <Grid item xs={12} sm={5} md={2} lg={2} xl={2}>
        <Box m={1}>
          <div>{format(startTime, dateTimeFormat)}</div>
        </Box>
      </Grid>

      {/* EndTime field */}
      <Grid item xs={12} sm={4} md={1} lg={1} xl={2}>
        <Box m={1}>
          <div>
            {endTime
              ? isValid(endTime)
                ? format(endTime, "HH:mm")
                : "—"
              : null}
          </div>
        </Box>
      </Grid>

      {/* duration field */}
      <Grid item xs={12} sm={2} md={1}>
        <Box m={1} className={classes.duration}>
          <TimeDuration {...minToArr(durationMinutes)} fallback="—"/>
        </Box>
      </Grid>

      {/* Note field */}
      <Grid item xs={12} sm={12} md={7} lg={7} xl={6}>
        <Box m={1}>
          {(note || "").split("\n").map((line, i, arr) => (
            <div style={{ overflow: "auto" }} key={i + line}>
              {i === arr.length - 1 ? line : line + " ↵ "}
            </div>
          ))}
        </Box>
      </Grid>
    </Grid>
  );
};

export default React.memo(ReadonlyRecord);
