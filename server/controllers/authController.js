const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// Self-registration always creates an employee. HR creates managers and other HR users.
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, department, designation } = req.body;
  const user = await User.create({ name, email, password, role: 'employee' });
  await Employee.create({
    user: user._id,
    employeeId: `EMP${String(await Employee.countDocuments() + 1).padStart(4, '0')}`,
    department,
    designation,
  });
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated. Contact HR.' });
  res.json({ token: signToken(user._id), user: publicUser(user) });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Password updated.' });
});
