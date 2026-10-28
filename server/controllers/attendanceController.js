const Attendance = require('../models/Attendance');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/pagination');
const { toDay } = require('../utils/dates');
const { teamUserIds } = require('../utils/team');
const { monthPrefix } = require('../utils/regex');

const LATE_AFTER_HOUR = 10; // check-ins after 10:00 server time count as late

exports.checkIn = asyncHandler(async (req, res) => {
  const now = new Date();
  const existing = await Attendance.findOne({ user: req.user._id, date: toDay(now) });
  if (existing) return res.status(409).json({ message: 'You have already checked in today.' });
  const record = await Attendance.create({
    user: req.user._id,
    date: toDay(now),
    checkIn: now,
    status: now.getHours() >= LATE_AFTER_HOUR ? 'late' : 'present',
  });
  res.status(201).json(record);
});

exports.checkOut = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({ user: req.user._id, date: toDay() });
  if (!record) return res.status(400).json({ message: 'Check in first.' });
  if (record.checkOut) return res.status(409).json({ message: 'You have already checked out today.' });
  record.checkOut = new Date();
  const hours = (record.checkOut - record.checkIn) / 36e5;
  if (hours < 4) record.status = 'half-day';
  await record.save();
  res.json(record);
});

exports.today = asyncHandler(async (req, res) => {
  res.json(await Attendance.findOne({ user: req.user._id, date: toDay() }));
});

exports.mine = asyncHandler(async (req, res) => {
  const { page, limit, skip, meta } = paginate(req.query, 15);
  const filter = { user: req.user._id };
  if (monthPrefix(req.query.month)) filter.date = monthPrefix(req.query.month); // e.g. 2026-10
  const [items, total] = await Promise.all([
    Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Attendance.countDocuments(filter),
  ]);
  res.json({ items, ...meta(total), page, limit });
});

// Manager: their team. HR: everyone.
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip, meta } = paginate(req.query, 15);
  const filter = {};
  if (req.query.date) filter.date = req.query.date;
  if (monthPrefix(req.query.month)) filter.date = monthPrefix(req.query.month);
  if (req.user.role === 'manager') filter.user = { $in: await teamUserIds(req.user._id) };
  else if (req.query.user) filter.user = req.query.user;

  const [items, total] = await Promise.all([
    Attendance.find(filter).populate('user', 'name email').sort({ date: -1, checkIn: -1 }).skip(skip).limit(limit).lean(),
    Attendance.countDocuments(filter),
  ]);
  res.json({ items, ...meta(total), page, limit });
});

// HR: correct a record (for example a forgotten check-out).
exports.adjust = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!record) return res.status(404).json({ message: 'Attendance record not found.' });
  res.json(record);
});
