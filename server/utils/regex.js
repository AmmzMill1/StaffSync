// User input must never be used as a raw regular expression.
exports.escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Accepts only YYYY-MM, otherwise returns null.
exports.monthPrefix = (m) => (/^\d{4}-\d{2}$/.test(m || '') ? new RegExp(`^${m}`) : null);
