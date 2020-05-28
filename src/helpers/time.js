/**
 * Converts numeric minutes to object with keys "h" (hours) and "m" (minutes).
 * If minutes is not a number, returns "notTime: true" in object.
 */
const minToArr = minutes => {
  const minsNum = Number.parseFloat(minutes);
  if (!Number.isSafeInteger(minsNum)) return { notTime: true };
  const m = minsNum % 60;
  const h = (minsNum - m) / 60;
  return { h, m };
};

/**
 * Converts numeric minutes to HH:MM string (or HHH:MM etc if applicable)
 * Example: minToHHMM(24*60+89) => "25:29"
 */
const minToHHMM = (minutes, fallback) => {
  const { h, m, notTime } = minToArr(minutes);
  return notTime
    ? fallback || "00:00"
    : `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

module.exports = {
  minToHHMM,
  minToArr
};
