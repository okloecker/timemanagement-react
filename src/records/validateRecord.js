import isValid from "date-fns/isValid";
import differenceInMinutes from "date-fns/differenceInMinutes";

/* Validation functions for formal correctness of date and startTime fields */
const validateRecord = values => {
  const errors = {};
  if (!values.startTime) {
    errors.startTime = "Required";
  } else if (!isValid(values.startTime)) {
    errors.startTime = "Invalid Start Time";
  }

  if (values.endTime !== null && !isValid(values.endTime))
    errors.endTime = "Invalid Date";

  if (
    values.startTime &&
    values.endTime &&
    differenceInMinutes(values.endTime, values.startTime) < 0
  ) {
    errors.endTime = "End Time must be after Start Time";
  }

  return errors;
};

export default validateRecord;
