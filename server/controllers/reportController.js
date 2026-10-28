const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const asyncHandler = require('../utils/asyncHandler');
const { toDay } = require('../utils/dates');
const { teamUserIds } = require('../utils/team');

// HR dashboard numbers and charts.
exports.summary = asyncHandler(async (req, res) => {
  const today = toDay();
  const month = today.slice(0, 7);
  const [headcount, byRole, byDepartment, presentToday, pendingLeaves, leavesByType, monthAttendance] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
    Employee.aggregate([{ $group: { _id: { $ifNull: ['$department', 'Unassigned'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Attendance.countDocuments({ date: today }),
    Leave.countDocuments({ status: 'pending' }),
    Leave.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$type', days: { $sum: '$days' } } }]),
    Attendance.aggregate([{ $match: { date: new RegExp(`^${month}`) } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({ headcount, presentToday, pendingLeaves, byRole, byDepartment, leavesByType, monthAttendance });
});

// Manager: per-person attendance and leave summary for the current month.
exports.team = asyncHandler(async (req, res) => {
  const ids = await teamUserIds(req.user._id);
  const month = toDay().slice(0, 7);
  const [users, attendance, leaves] = await Promise.all([
    User.find({ _id: { $in: ids } }).select('name email').lean(),
    Attendance.aggregate([
      { $match: { user: { $in: ids }, date: new RegExp(`^${month}`) } },
      { $group: { _id: '$user', present: { $sum: 1 }, late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } } } },
    ]),
    Leave.aggregate([
      { $match: { user: { $in: ids }, status: 'approved' } },
      { $group: { _id: '$user', days: { $sum: '$days' } } },
    ]),
  ]);
  const a = Object.fromEntries(attendance.map((x) => [String(x._id), x]));
  const l = Object.fromEntries(leaves.map((x) => [String(x._id), x.days]));
  res.json({
    month,
    members: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      daysPresent: a[String(u._id)]?.present || 0,
      daysLate: a[String(u._id)]?.late || 0,
      leaveDaysTaken: l[String(u._id)] || 0,
    })),
    pendingLeaves: await Leave.countDocuments({ user: { $in: ids }, status: 'pending' }),
    presentToday: await Attendance.countDocuments({ user: { $in: ids }, date: toDay() }),
  });
});

// Employee: their own dashboard numbers.
exports.me = asyncHandler(async (req, res) => {
  const month = toDay().slice(0, 7);
  const [present, late, pending, approvedDays] = await Promise.all([
    Attendance.countDocuments({ user: req.user._id, date: new RegExp(`^${month}`) }),
    Attendance.countDocuments({ user: req.user._id, date: new RegExp(`^${month}`), status: 'late' }),
    Leave.countDocuments({ user: req.user._id, status: 'pending' }),
    Leave.aggregate([{ $match: { user: req.user._id, status: 'approved' } }, { $group: { _id: null, days: { $sum: '$days' } } }]),
  ]);
  res.json({ month, daysPresent: present, daysLate: late, pendingLeaves: pending, leaveDaysTaken: approvedDays[0]?.days || 0 });
});
