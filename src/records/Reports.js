import React from "react";
import { minToHHMM } from "helpers/time";

const Reports = ({ data }) => (
  <div className="">
    {data.map((row, i, arr) => (
      <div key={row.day}>
        {`${row.day} ; ; ${minToHHMM(
          row.infos.minutes
        )} ; ; ${row.infos.notes.join(" | ")}`}
      </div>
    ))}
  </div>
);

export { Reports };
