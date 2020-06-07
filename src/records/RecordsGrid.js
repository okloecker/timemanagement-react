import React from "react";
import {
  Box,
  Divider,
  Button,
  Fab,
  IconButton,
  LinearProgress,
  Snackbar,
  Tooltip
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Add, Close } from "@material-ui/icons";
import { Alert, Pagination } from "@material-ui/lab";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import * as imm from "object-path-immutable";
import format from "date-fns/format";
import formatISO from "date-fns/formatISO";
import isDate from "date-fns/isDate";
import isValid from "date-fns/isValid";
import parseISO from "date-fns/parseISO";
import compareDesc from "date-fns/compareDesc";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { queryCache, useMutation, useQuery } from "react-query";
import log from "loglevel";
import EmptyState from "EmptyState";
import AddRecord from "records/AddRecord";
import ReadonlyRecord from "records/ReadonlyRecord";
import EditableRecord from "records/EditableRecord";
import { StartStopButton } from "./EditControls";
import { minToArr } from "helpers/time";
import { useInterval } from "helpers/useInterval";
import TimeDuration from "TimeDuration";

const PAGE_SIZE = 30;
const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";

const recordSortFunction = (a, b) => compareDesc(a.startTime, b.startTime);

const useStyles = makeStyles({
  root: { minWidth: 275, color: "#363737" }, // https://xkcd.com/color/rgb/ dark grey
  title: { fontSize: 20, textAlign: "center" },
  controls: { paddingTop: "16px", paddingBottom: "16px" },
  activeRecord: { backgroundColor: "#e9ffe9" },
  pagination: { marginTop: "16px", display: "inline-block" },
  fab: { paddingLeft: "8px" }
});

const calcTotalTime = (data = []) =>
  Array.isArray(data)
    ? // durationMinutes might be undefined for activeRecord without endTime:
      data.reduce((acc, d) => acc + (d.durationMinutes || 0), 0)
    : 0;

// calculates minutes between "startTime" and "now"
const calcRunningTime = startTime =>
  Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60);

const calcHoursPerDay = (data = []) => 
  data.reduce((acc, d) => {
    const day = format(d.startTime, "yyyy-MM-dd");
    let dayVal = acc[day] || 0;
    acc[day] = dayVal + (d.durationMinutes || calcRunningTime(d.startTime));
    return acc;
  }, {});

/* Async backend call to fetch data */
const fetchRecords = async (
  key,
  { startDate, endDate, contains, authToken }
) => {
  try {
    const from = formatISO(isDate(startDate) ? startDate : parseISO(startDate));
    const to = formatISO(isDate(endDate) ? endDate : parseISO(endDate));
    // must encode dateFrom/dateTo, otherwise the "+" before the timezone
    // offset will be interpreted as a space
    const result = await axios(
      `/api/timerecords?dateFrom=${encodeURIComponent(
        from
      )}&dateTo=${encodeURIComponent(to)}${
        contains ? "&contains=" + encodeURIComponent(contains) : ""
      }`,
      {
        headers: {
          "Content-Type": "application/json",
          AuthToken: authToken
        }
      }
    );
    if (result.status >= 400) {
      return {
        error: { status: result.status, statusText: result.statusText },
        records: []
      };
    } else {
      return {
        records: result.data.data
          .map(d => ({
            ...d,
            startTime: parseISO(d.startTime), // DateTimePicker expects Date object
            endTime: isValid(parseISO(d.endTime)) ? parseISO(d.endTime) : null
          }))
          .sort(recordSortFunction)
      };
    }
  } catch (err) {
    log.error("fetchRecords caught error:", JSON.stringify(err));
    if (err.response) {
      return {
        error: {
          status: err.response.status,
          statusText:
            (err.response.data || {}).error.message || err.response.status
        },
        records: []
      };
    } else
      return {
        error: {
          status: err.response.status,
          statusText: `${err.response.statusText}  ${JSON.stringify(
            err.response.data
          )}`
        },
        records: []
      };
  }
};

const updateRecord = ({ row, user, authToken, method = "PUT" }) => {
  let url;
  if (method === "UNDO_DELETE") {
    url = `/api/timerecords/${row.id}/undelete`;
    method = "PUT";
  } else if (method === "POST") url = "/api/timerecords";
  else url = `/api/timerecords/${row.id}`;

  return axios(url, {
    method, // "PUT" or "POST" or "DELETE"
    headers: { "Content-Type": "application/json", AuthToken: authToken },
    data: row
  });
};

// Sorts "data" array of objects according to their "startTime" descending and
// removes elements with duplicate "note" fields.
const sortUniqData = data =>
  [...data]
    .filter(d => d.note)
    .sort((a, b) => compareDesc(a.startTime, b.startTime))
    .reduce(
      (acc, d) =>
        acc.find(a => a.note === d.note) ? acc : acc.concat({ note: d.note }),
      []
    );

/*
 * Component to show time records.
 * Responsive layout achieved by using Grid (not Table): on narrow screens, the
 * rows will stack internally.
 */
const RecordsGrid = React.forwardRef((props, ref) => {
  const classes = useStyles();

  const userInfo = props.userInfo || {};
  const authToken = (userInfo.authToken || {}).token;
  const userId = userInfo.id;

  // "editing" state: row id to edit
  const [editRow, setEditRow] = React.useState();

  // "adding" state: row object to add
  const [addRow, setAddRow] = React.useState(null);

  // "undo" state: row object to undo
  const [undoRow, setUndoRow] = React.useState();

  // general error object
  const [globalError, setGlobalError] = React.useState();

  // undo message
  const [snackMessage, setSnackMessage] = React.useState();

  // current page if paging
  const [page, setPage] = React.useState(1);

  // accumulated total time in minutes of all data
  const [totalTime, setTotalTime] = React.useState(0);
  const [hoursPerDay, setHoursPerDay] = React.useState({});

  const [activeRecord, setActiveRecord] = React.useState();
  const [activeRecordTime, setActiveRecordTime] = React.useState(0);

  const [topActivities, setTopActivities] = React.useState();

  // React ref to TextField "note" in EditableRecord so it can be focused
  const noteRef = React.useRef(null);

  // React ref to FAB button "start/stop"
  const startStopButtonRef = React.useRef(null);

  // Components rendering RecordsGrid can call their ref to call
  // "ref.current.toggle()" to start/stop an active record
  React.useImperativeHandle(ref, () => ({
    toggle: toggleOn => {
      if(startStopButtonRef && startStopButtonRef.current)startStopButtonRef.current.click();
    },
    editLatest: _ => {
      let idToEdit;
      if (activeRecord) idToEdit = activeRecord.id;
      else if (data && data.records && data.records.length)
        idToEdit = data.records[0].id;
      if (idToEdit) setEditRow(idToEdit);
      if (noteRef && noteRef.current) noteRef.current.focus();
    }
  }));

  /* On unmounting, clear react-query cache, otherwise it will continue to
   * fetch
   */
  React.useEffect(() => {
    return () => {
      queryCache.clear();
    };
  }, []);

  /* Clear global error when showing/submitting record edit or add form. */
  React.useEffect(
    () => {
      if (editRow === null) setGlobalError(null);
      if (addRow === null) setGlobalError(null);
    },
    [addRow, editRow]
  );

  /* Whenever user deletes record, pop up a snack to allow undo */
  React.useEffect(
    () => {
      if (undoRow) {
        setSnackMessage({
          message: "Delete successful",
          row: undoRow,
          date: new Date().getTime()
        });
      }
    },
    [undoRow]
  );

  React.useEffect(
    () => {
      setPage(1);
    },
    [props.startDate, props.endDate, props.searchText]
  );

  const recordsQueryKey = [
    "records",
    {
      startDate: props.startDate,
      endDate: props.endDate,
      authToken,
      contains: props.searchText
    }
  ];

  /* Filtered query to fetch data */
  const { status, data, error } = useQuery(recordsQueryKey, fetchRecords, {
    staleTime: 10 * 1000, // milliseconds
    onSuccess: data => {
      if (data.error) return;

      const recordsWithoutEndTime = data.records.filter(d => !d.endTime);
      if (recordsWithoutEndTime.length > 1)
        setGlobalError({
          message: "Warning",
          reasons: [
            {
              key: "Inconsistency",
              message:
                "There are multiple active records without end time, there should be only one!"
            }
          ]
        });
      setTopActivities(sortUniqData(data.records));

      setHoursPerDay(calcHoursPerDay(data.records));
    }
  });

  React.useEffect(
    () => {
      if (!data || !data.records) return;
      setTotalTime(calcTotalTime(data.records) + activeRecordTime);
      setHoursPerDay(calcHoursPerDay(data.records));
    },
    [data, activeRecordTime]
  );

  const updateActiveRecordDuration = React.useCallback(activeRecord => {
    if ((activeRecord || {}).startTime) {
      setActiveRecordTime(calcRunningTime(activeRecord.startTime));
    }
  }, []);

  React.useEffect(
    () => {
      if (!data || !data.records) return;
      const arec =
        Array.isArray(data.records) && data.records.find(d => !d.endTime);
      if (arec) {
        setActiveRecord(arec);
        updateActiveRecordDuration(arec);
      } else {
        setActiveRecord(null);
        setActiveRecordTime(0);
      }
    },
    [data, updateActiveRecordDuration]
  );

  // runs every so often to update duration of active recod
  useInterval(
    () => updateActiveRecordDuration(activeRecord),
    !!activeRecord ? 10000 : null
  );

  // Update record with new data, optimistically showing new data in table, but
  // rolling back on error
  const [mutate] = useMutation(updateRecord, {
    onMutate: ({ row: newRow, method }) => {
      const previousData = queryCache.getQueryData(recordsQueryKey).records;
      // optimistically change, add or delete in-memory records:
      switch (method) {
        case "PUT":
          queryCache.setQueryData(recordsQueryKey, {
            records: previousData.map(r => (r.id === newRow.id ? newRow : r))
          });
          break;
        case "POST":
          queryCache.setQueryData(recordsQueryKey, {
            records: previousData
              .concat({ ...newRow })
              .sort((a, b) => compareDesc(a.startTime, b.startTime))
          });
          setAddRow(null);
          break;
        case "DELETE":
          setUndoRow(newRow);
          queryCache.setQueryData(recordsQueryKey, {
            records: previousData.filter(r => r.id !== newRow.id)
          });
          break;
        case "UNDO_DELETE":
          setUndoRow(null);
          queryCache.setQueryData(recordsQueryKey, {
            records: previousData
              .concat({ ...newRow })
              .sort((a, b) => compareDesc(a.startTime, b.startTime))
          });
          break;
        default:
          log.warn("Unknown method", method);
      }
      setEditRow(null);
      setGlobalError(null);
      return () =>
        queryCache.setQueryData(recordsQueryKey, { records: previousData }); // the rollback function
    },
    onError: (err, { row, method }, rollback) => {
      if (!err.response) return;
      const rqData = err.response.data; // react-query object
      let reasons = [];
      if (rqData.error.message) {
        // general error:
        reasons.push({ key: "Update failed", message: rqData.error.message });
      }
      // validation error:
      if (rqData.error.validation)
        reasons = reasons.concat(rqData.error.validation);
      rollback(); // revert to previous records
      switch (method) {
        case "PUT":
          if (row.id) {
            // user must correct error or reset values, open edit form again:
            setEditRow(row.id);
          }
          break;
        case "POST":
          // user must correct error or reset values, open add form again:
          setAddRow(row);
          break;
        case "DELETE":
          // nothing else to do here
          break;
        case "UNDO_DELETE":
          // nothing else to do here
          break;
        default:
          log.warn("Unknown method", method);
      }
      setGlobalError({
        message: `Update failed with error: ${err}`,
        reasons
      });
    },
    onSuccess: ({ data: rqData }) => {
      // update current cached data with latest from server
      const previousData = queryCache.getQueryData(recordsQueryKey).records;
      const newData = previousData
        .map(r => {
          // if a temporary ID was sent, server returns source-of-truth id and temp id in this format:
          // "<dbId>_<tmpId>"
          // dbid will be at least first part of id even if no "_" present
          const [dbId, tmpId] = rqData.data.id.split("_");
          return r.id === tmpId || r.id === dbId
            ? imm
                .wrap(rqData.data)
                .set("id", dbId) // replace temporary ID
                .set(
                  "startTime",
                  // DateTimePicker expects Date object
                  parseISO(rqData.data.startTime)
                )
                .set(
                  "endTime",
                  rqData.data.endTime ? parseISO(rqData.data.endTime) : null
                )
                .value()
            : r;
        })
        .sort(recordSortFunction);
      const newTopActivities = sortUniqData(newData);
      setTopActivities(sortUniqData(newTopActivities));
      queryCache.setQueryData(recordsQueryKey, { records: newData });
    },
    onSettled: () => {
      queryCache.refetchQueries(recordsQueryKey);
    }
  });

  /* User edited record: put new values to backend */
  const handleRowUpdate = async ({ row, newRow }) =>
    await mutate({
      row: {
        ...row,
        ...newRow
      },
      method: "PUT",
      authToken
    });

  /* User clicked "+" button: trigger showing a new record in edit mode */
  const handleAddRecord = async ({ newRow }) => {
    setAddRow({});
  };

  /* Post new record to backend */
  const handleRecordAdd = async record => {
    await mutate({
      row: { ...record, userId, id: uuidv4() },
      method: "POST",
      authToken
    });
  };

  const handleRecordUndelete = async row => {
    await mutate({
      row,
      method: "UNDO_DELETE",
      authToken
    });
  };

  /* User clicked delete on record */
  const handleRecordDelete = async record => {
    await mutate({
      row: record,
      method: "DELETE",
      authToken
    });
  };

  /* User clicked "undo" after delete */
  const handleUndoDelete = async row => {
    if (undoRow) {
      await handleRecordUndelete(undoRow);
      setUndoRow(null);
    }
    setSnackMessage(null);
  };

  /* User clicked "Stop current" button */
  const handleStop = async id => {
    const row = data.records.find(d => d.id === id);
    if (row)
      await mutate({
        row: {
          ...row,
          endTime: new Date()
        },
        method: "PUT",
        authToken
      });
  };

  /* User clicked "Start new" button */
  const handleStart = async note => {
    // if the dropdown next to start button returns undef, user hasn't changed it, so take the latest one
    let realNote;
    if (
      (note === undefined || note === null) &&
      topActivities &&
      topActivities.length
    )
      realNote = topActivities[0].note;
    else realNote = (note || "").trim();
    await handleRecordAdd({
      startTime: new Date(),
      note: realNote,
      durationMinutes: 0
    });
  };

  /* Data fetching turned up error */
  if (status === "error") {
    return (
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        open={status === "error"}
        autoHideDuration={6000}
        message={error}
      />
    );
  }

  // values for current page:
  const firstIdx = Math.max(0, page - 1) * PAGE_SIZE;
  const lastIdx = page * PAGE_SIZE;
  const pageData =
    data && Array.isArray(data.records)
      ? data.records.slice(firstIdx, lastIdx)
      : [];

  return (
    <Box mt={2}>
      {/* Empty state: no records found either because filter criteria are too
        strict or there are simply no records for user. 
        */}
      {data && (!data.records || !data.records.length) && (
        <EmptyState
          classes={classes}
          handleAddRecord={handleAddRecord}
          addRow={addRow}
          setAddRow={setAddRow}
          handleRecordAdd={handleRecordAdd}
        />
      )}

      {/* Loading state */}
      {status === "loading" && (
        <Box m={2} mt={3}>
          <LinearProgress />
        </Box>
      )}

      {/* General error alert */}
      {globalError && globalError.reasons && (
        <Alert severity="error">
          {globalError.message}
          <ul>
            {globalError.reasons.map(r => (
              <li key={r.key}>{r.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Error alert from data */}
      {(data || {}).error && (
        <Alert severity="error">{data.error.statusText}</Alert>
      )}

      <StartStopButton
        onClick={
          activeRecord
            ? () => handleStop(activeRecord.id)
            : note => handleStart(note)
        }
        showStartButton={!activeRecord}
        topActivities={topActivities}
        ref={startStopButtonRef}
      />

      {/* Pagination controls (if more data than fits on page 
          AND button to add record 
        */}
      {!!pageData.length && (
        <div className={classes.controls}>
          <Tooltip title="Add" aria-label="add">
            <Fab
              color="primary"
              aria-label="add"
              onClick={handleAddRecord}
              size="small"
            >
              <Add />
            </Fab>
          </Tooltip>
          {!!pageData.length && (
            <>
              &emsp; Total time for filter:&ensp;
              <TimeDuration {...minToArr(totalTime)} />
            </>
          )}
        </div>
      )}

      {/* Form to add a record after user clicked "+" button or again after
        adding failed */}
      {addRow && (
        <AddRecord
          onAdd={handleRecordAdd}
          setAddRow={setAddRow}
          dateTimeFormat={DATE_TIME_FORMAT}
        />
      )}

      {/* There is some data to display */}
      {!!pageData.length &&
        pageData.map((row, i, arr) => {
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
                dateTimeFormat={DATE_TIME_FORMAT}
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
              dateTimeFormat={DATE_TIME_FORMAT}
              noteRef={noteRef}
            />
          );
        })}

      {/* paging controls at bottom of page */}
      {!!pageData.length && data.records.length > PAGE_SIZE && (
        <>
          <Box mt={1}>
            <Divider variant="fullWidth" />
          </Box>
          <Box mt={2}>
            <Pagination
              count={Math.ceil(data.records.length / PAGE_SIZE)}
              showFirstButton
              showLastButton
              onChange={(e, p) => setPage(p)}
            />
          </Box>
        </>
      )}

      {/* Snacks to show after delete with undo button */}
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        open={!!snackMessage}
        autoHideDuration={15000}
        onClose={_ => {
          setUndoRow(null);
          setSnackMessage(null);
        }}
        message={(snackMessage || {}).message}
        action={
          <React.Fragment>
            <Button
              color="secondary"
              size="small"
              onClick={_ => handleUndoDelete(snackMessage.row)}
            >
              UNDO
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              className={classes.close}
              onClick={_ => {
                setUndoRow(null);
                setSnackMessage(null);
              }}
            >
              <Close />
            </IconButton>
          </React.Fragment>
        }
      />
    </Box>
  );
});

// apparently needed with memoized forwardRef, otherwise React dev tools shows
// this component as "Anonymous":
RecordsGrid.displayName = "RecordsGrid";

// Memoize component to minimize rendering of complex Grid
export default React.memo(RecordsGrid);
