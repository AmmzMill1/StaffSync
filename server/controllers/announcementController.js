const Announcement = require('../models/Announcement');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/pagination');
const notify = require('../utils/notify');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip, meta } = paginate(req.query, 10);
  const [items, total] = await Promise.all([
    Announcement.find().populate('postedBy', 'name').sort({ pinned: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Announcement.countDocuments(),
  ]);
  res.json({ items, ...meta(total), page, limit });
});

exports.create = asyncHandler(async (req, res) => {
  const item = await Announcement.create({ ...req.body, postedBy: req.user._id });
  const everyone = await User.find({ isActive: true, _id: { $ne: req.user._id } }).distinct('_id');
  await notify(everyone, `New announcement: ${item.title}`, '/announcements');
  res.status(201).json(item);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: 'Announcement not found.' });
  res.json(item);
});

exports.remove = asyncHandler(async (req, res) => {
  const item = await Announcement.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Announcement not found.' });
  res.json({ message: 'Announcement deleted.' });
});
