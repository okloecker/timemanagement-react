import { Box, Divider, Grid, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import format from "date-fns/format";
import isValid from "date-fns/isValid";
import { minToArr } from "helpers/time";
import React from "react";
import TimeDuration from "TimeDuration";

import { StartEditControls } from "./EditControls";

const DATE_FORMAT = "yyyy-MM-dd";
const HUMAN_DATE_FORMAT = "dd LLL yyyy";
const EM_DASH = "—";

const useStyles = makeStyles(theme => ({
  duration: {
    textAlign: "right",
    fontWeight: 200,
    color: "#3f51b5"
  },
  dividerFullWidth: {
    margin: `5px 0 0 ${theme.spacing(2)}px`,

    textAlign: "center"
  },
  timeHH: {},
  timeMM: { fontSize: "smaller" }
}));

const ReadonlyRecord = ({
  id,
  startTime,
  endTime,
  durationMinutes,
  note,
  newDay,
  dateTimeFormat,
  setEditing,
  setStop,
  hoursPerDay
}) => {
  const classes = useStyles();
  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        {newDay && (
          <>
            <Typography
              className={classes.dividerFullWidth}
              color="textSecondary"
              display="block"
              variant="caption"
            >
              {format(startTime, HUMAN_DATE_FORMAT)}
              {" - "}
              <TimeDuration
                {...minToArr(
                  hoursPerDay[format(startTime, DATE_FORMAT)] || 0,
                  0
                )}
                fallback={EM_DASH}
              />
            </Typography>
          </>
        )}
      </Grid>

      {/* Edit/Cancel etc icons */}
      <Grid item xs={4} sm={4} md={1}>
        <StartEditControls setEditing={setEditing} id={id} setStop={setStop} />
      </Grid>

      <Grid item xs={4} sm={4} md={2} lg={2} xl={3}>
        {/* StartTime field */}
        <Box m={1}>
          <FormatHHMM d={startTime} classes={classes} />
          &ndash;
          {/* EndTime field */}
          {endTime ? (
            isValid(endTime) ? (
              <FormatHHMM d={endTime} classes={classes} />
            ) : (
              EM_DASH
            )
          ) : null}
        </Box>
      </Grid>

      {/* duration field */}
      <Grid item xs={4} sm={4} md={1}>
        <Box m={1} className={classes.duration}>
          <TimeDuration {...minToArr(durationMinutes)} fallback={EM_DASH} />
        </Box>
      </Grid>

      {/* Note field */}
      <Grid item xs={12} sm={12} md={8} lg={8} xl={6}>
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

const FormatHHMM = ({ d, classes }) => (
  <>
    <span className={classes.timeHH}>{format(d, "HH")}</span>:
    <span className={classes.timeMM}>{format(d, "mm")}</span>
  </>
);

export default React.memo(ReadonlyRecord);
