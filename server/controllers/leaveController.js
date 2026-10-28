const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/pagination');
const notify = require('../utils/notify');
const { daysBetween } = require('../utils/dates');
const { teamUserIds, isOnTeam } = require('../utils/team');

exports.apply = asyncHandler(async (req, res) => {
  const { type, from, to, reason } = req.body;
  if (new Date(to) < new Date(from)) return res.status(400).json({ message: 'End date cannot be before the start date.' });

  const overlap = await Leave.exists({
    user: req.user._id,
    status: { $in: ['pending', 'approved'] },
    from: { $lte: new Date(to) },
    to: { $gte: new Date(from) },
  });
  if (overlap) return res.status(409).json({ message: 'You already have a leave request in those dates.' });

  const leave = await Leave.create({ user: req.user._id, type, from, to, reason, days: daysBetween(from, to) });

  // Employees go to their manager. Everyone else (and unassigned employees) goes to HR.
  const emp = await Employee.findOne({ user: req.user._id });
  const reviewers = req.user.role === 'employee' && emp?.manager ? [emp.manager] : await User.find({ role: 'hr', isActive: true }).distinct('_id');
  await notify(reviewers, `${req.user.name} requested ${leave.days} day(s) of ${type} leave.`, '/leaves');
  res.status(201).json(leave);
});

exports.mine = asyncHandler(async (req, res) => {
  const { page, limit, skip, meta } = paginate(req.query);
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Leave.find(filter).populate('reviewedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Leave.countDocuments(filter),
  ]);
  res.json({ items, ...meta(total), page, limit });
});

exports.cancel = asyncHandler(async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, user: req.user._id });
  if (!leave) return res.status(404).json({ message: 'Leave request not found.' });
  if (leave.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
  leave.status = 'cancelled';
  await leave.save();
  res.json(leave);
});

// Manager: team requests. HR: all requests.
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip, meta } = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.user.role === 'manager') filter.user = { $in: await teamUserIds(req.user._id) };
  const [items, total] = await Promise.all([
    Leave.find(filter).populate('user', 'name email role').populate('reviewedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Leave.countDocuments(filter),
  ]);
  res.json({ items, ...meta(total), page, limit });
});

exports.review = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body; // 'approved' | 'rejected'
  const leave = await Leave.findById(req.params.id).populate('user', 'name role');
  if (!leave) return res.status(404).json({ message: 'Leave request not found.' });
  if (leave.status !== 'pending') return res.status(400).json({ message: `This request is already ${leave.status}.` });
  if (leave.user._id.equals(req.user._id)) return res.status(403).json({ message: 'You cannot review your own leave request.' });

  // Managers can only review their own team. HR can review anyone.
  if (req.user.role === 'manager' && !(await isOnTeam(req.user._id, leave.user._id))) {
    return res.status(403).json({ message: 'This person is not on your team.' });
  }

  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewNote = reviewNote;
  await leave.save();
  await notify(leave.user._id, `Your ${leave.type} leave was ${status}${reviewNote ? `: ${reviewNote}` : '.'}`, '/leaves');
  res.json(leave);
});
