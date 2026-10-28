exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong on the server.';

  if (err.name === 'CastError') { status = 400; message = 'Invalid id.'; }
  if (err.code === 11000) { status = 409; message = `That ${Object.keys(err.keyValue || {})[0] || 'value'} is already in use.`; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors)[0].message; }

  if (status === 500) console.error(err);
  res.status(status).json({ message });
};
