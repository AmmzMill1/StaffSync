// Reads ?page and ?limit and returns skip/limit plus a helper to build the response meta.
module.exports = function paginate(query, defaultLimit = 10) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    meta: (total) => ({ page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) }),
  };
};
