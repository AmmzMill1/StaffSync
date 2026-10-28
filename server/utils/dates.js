// Attendance dates are stored as YYYY-MM-DD strings so "one record per day" is easy to enforce.
const toDay = (d = new Date()) => new Date(d).toISOString().slice(0, 10);

// Inclusive number of calendar days between two dates.
const daysBetween = (from, to) => {
  const ms = new Date(to).setUTCHours(0, 0, 0, 0) - new Date(from).setUTCHours(0, 0, 0, 0);
  return Math.floor(ms / 86400000) + 1;
};

module.exports = { toDay, daysBetween };
