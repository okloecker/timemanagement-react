import { makeStyles } from "@material-ui/core/styles";
import React from "react";

const useStyles = makeStyles({
  time: { fontSize: "40px", fontWeight: 100 },
  unit: { fontSize: "smaller" }
});

const TimeDuration = ({ h, m, bigger, fallback }) => {
  const classes = useStyles();
  return (
    <>
      {!!h && (
        <>
          <span className={!!bigger && classes.time}>{h}</span>
          <span className={classes.unit}>h</span>{" "}
        </>
      )}
      {(!!m || m === 0) && (
        <>
          <span className={!!bigger && classes.time}>{m}</span>
          <span className={classes.unit}>m</span>
        </>
      )}
      {!h && !m && m !== 0 && <span>{fallback}</span>}
    </>
  );
};

export default TimeDuration;
