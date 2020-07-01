import { Box, Card, CardContent } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import format from "date-fns/format";
// import log from "loglevel";
import React from "react";

import EditableRecord from "./EditableRecord";
import ReadonlyRecord from "./ReadonlyRecord";

const useStyles = makeStyles({ activeRecord: { backgroundColor: "#e9ffe9" },
  dayCards:{
    marginBottom: "16px"
  }});

const Records = ({
  data,
  dateTimeFormat,
  editRow,
  handleRecordDelete,
  handleRowUpdate,
  handleStop,
  hoursPerDay,
  noteRef,
  setEditRow,
  activeRecordTime
}) => {
  const classes = useStyles();

  // object of keys <day> and values <data items for that day>
  const dayGroupedData = data.reduce((acc, d) => {
    const day = format(d.startTime, "yyyy-MM-dd");
    (acc[day] || (acc[day] = [])).push(d);
    return acc;
  }, {});
  // log.debug("dayGroupedData=", dayGroupedData);

  return Object.keys(dayGroupedData).map(day => (
    <Box mt={1} key={day} >
    <Card variant="outlined" >
      <CardContent>
        {dayGroupedData[day].map((row, i, arr) => {
          return row.id !== editRow ? (
            <div
              key={row.id /*might be assigned during optimistic update*/}
              className={row.endTime ? "" : classes.activeRecord}
            >
              <ReadonlyRecord
                startTime={row.startTime}
                endTime={row.endTime}
                durationMinutes={row.durationMinutes || activeRecordTime}
                note={row.note}
                id={row.id}
                setEditing={setEditRow}
                newDay={
                  i === 0 ||
                  !!differenceInCalendarDays(
                    row.startTime,
                    arr[Math.max(0, i - 1)].startTime
                  )
                }
                dateTimeFormat={dateTimeFormat}
                setStop={!row.endTime ? handleStop : null}
                hoursPerDay={hoursPerDay}
              />
            </div>
          ) : (
            <EditableRecord
              key={row.id /*might be assigned during optimistic update*/}
              row={row}
              setEditing={setEditRow}
              handleRecordDelete={handleRecordDelete}
              onUpdate={v => {
                if (v !== row.startTime) handleRowUpdate({ row, newRow: v });
              }}
              dateTimeFormat={dateTimeFormat}
              noteRef={noteRef}
            />
          );
        })}
      </CardContent>
    </Card>
      </Box>
  ));
};

export { Records };
