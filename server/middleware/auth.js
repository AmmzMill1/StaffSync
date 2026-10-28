const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the Bearer token and attaches the user to req.user.
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not signed in. Please log in.' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) return res.status(401).json({ message: 'This account is no longer active.' });
  req.user = user;
  next();
});

// Role-based access control: authorize('hr', 'manager')
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to do this.' });
  }
  next();
};
