const Training = require('../models/Training');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/pagination');
const notify = require('../utils/notify');
const { teamUserIds } = require('../utils/team');

// Employees see what they're assigned to. Managers see what they created. HR sees everything.
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip, meta } = paginate(req.query);
  const filter = {};
  if (req.user.role === 'employee') filter.assignees = req.user._id;
  if (req.user.role === 'manager') filter.createdBy = req.user._id;
  const [items, total] = await Promise.all([
    Training.find(filter).populate('createdBy', 'name').populate('assignees', 'name').sort({ startDate: -1 }).skip(skip).limit(limit).lean(),
    Training.countDocuments(filter),
  ]);
  res.json({ items, ...meta(total), page, limit });
});

// Managers can only assign people on their team.
async function allowedAssignees(user, ids = []) {
  if (user.role !== 'manager') return ids;
  const team = (await teamUserIds(user._id)).map(String);
  return ids.filter((id) => team.includes(String(id)));
}

exports.create = asyncHandler(async (req, res) => {
  const assignees = await allowedAssignees(req.user, req.body.assignees);
  const training = await Training.create({ ...req.body, assignees, createdBy: req.user._id });
  await notify(assignees, `You were enrolled in training: ${training.title}`, '/trainings');
  res.status(201).json(training);
});

exports.update = asyncHandler(async (req, res) => {
  const training = await Training.findById(req.params.id);
  if (!training) return res.status(404).json({ message: 'Training not found.' });
  if (req.user.role === 'manager' && !training.createdBy.equals(req.user._id)) {
    return res.status(403).json({ message: 'You can only edit trainings you created.' });
  }
  if (req.body.assignees) req.body.assignees = await allowedAssignees(req.user, req.body.assignees);
  Object.assign(training, req.body);
  await training.save();
  res.json(training);
});

exports.remove = asyncHandler(async (req, res) => {
  const training = await Training.findById(req.params.id);
  if (!training) return res.status(404).json({ message: 'Training not found.' });
  if (req.user.role === 'manager' && !training.createdBy.equals(req.user._id)) {
    return res.status(403).json({ message: 'You can only delete trainings you created.' });
  }
  await training.deleteOne();
  res.json({ message: 'Training deleted.' });
});
