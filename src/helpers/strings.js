// returns a shortened string that contains the ellipsis in the middle
// i.e. the beginning and end of string are returned: "one very very long string" becomes "one very...string"
const elliptic = (string, len = 10) =>
  string && string.length > len
    ? `${string.substring(0, len / 2)}…${string.substring(
        string.length - len / 2,
        string.length
      )}`
    : string;

// string ellipsis that occurs only on word breaks with at least "len"
// characters plus any characters until the next word boundary
// i.e. "Mostly cloudy with a light chance of wintry rain" becomes "Mostly cloudy with …"
const wordEllipsis = (s, len = s.len) => {
  const re = new RegExp("^(.{" + len + "}[^s]*).*");
  const newStr = s.replace(re, "$1");
  return s.length > len + 3 ? `${newStr} …` : s;
};

module.exports = {
  elliptic,
  wordEllipsis
};
