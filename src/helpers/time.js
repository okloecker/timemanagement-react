/**
 * Converts numeric minutes to HH:MM string (or HHH:MM etc if applicable)
 * Example: minToHHMM(24*60+89) => "25:29"
 */
const minToHHMM = (minutes, fallback) => {
  const minsNum = Number.parseFloat(minutes);
  if (!Number.isSafeInteger(minsNum)) return fallback || "00:00";
  const m = minsNum % 60;
  const h = (minsNum - m) / 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

module.exports = {
  minToHHMM
};
