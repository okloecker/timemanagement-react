import React from "react";
import { IconButton, MenuItem, Select } from "@material-ui/core";
import FirstPageIcon from "@material-ui/icons/FirstPage";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import LastPageIcon from "@material-ui/icons/LastPage";

const PagingControls = ({
  page,
  lastPage,
  firstIdx,
  lastIdx,
  dataCount,
  setPage
}) => {
  return (
    <>
      <IconButton
        aria-label="previous"
        size="small"
        disabled={page === 1}
        onClick={() => setPage(1)}
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        aria-label="previous"
        size="small"
        disabled={page === 1}
        onClick={() => setPage(Math.max(1, page - 1))}
      >
        <KeyboardArrowLeft />
      </IconButton>
      &emsp;
      <Select
        labelId="page-select-label"
        id="page-select"
        value={page}
        onChange={e => setPage(e.target.value)}
      >
        {Array.from(new Array(lastPage), (val, index) => index + 1).map(n => (
          <MenuItem key={n} value={n}>
            {n}
          </MenuItem>
        ))}
      </Select>
      &emsp;
      {`${firstIdx + 1}-${lastIdx} of ${dataCount}`}
      <IconButton
        aria-label="previous"
        size="small"
        disabled={page === lastPage}
        onClick={() => setPage(Math.min(lastPage, page + 1))}
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        aria-label="previous"
        size="small"
        disabled={page === lastPage}
        onClick={() => setPage(lastPage)}
      >
        <LastPageIcon />
      </IconButton>
    </>
  );
};

export default PagingControls;
