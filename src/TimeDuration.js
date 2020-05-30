import { makeStyles } from "@material-ui/core/styles";
import React from "react";

const useStyles = makeStyles({ unit: { fontSize: "x-small" } });

const TimeDuration = ({ h, m, fallback }) => {
  const classes = useStyles();
  return (
    <>
      {!!h && (
        <>
          <span>{h}</span>
          <span className={classes.unit}>h</span>{" "}
        </>
      )}
      {(!!m || m === 0) && (
        <>
          <span>{m}</span>
          <span className={classes.unit}>m</span>
        </>
      )}
      {!h && !m && m!== 0 && <span>{fallback}</span>}
    </>
  );
};

export default TimeDuration;
