const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/pagination');
const { teamUserIds } = require('../utils/team');
const { escapeRegex } = require('../utils/regex');

const nextEmployeeId = async () => `EMP${String((await Employee.countDocuments()) + 1).padStart(4, '0')}`;

const shape = (emp) => ({
  id: emp.user?._id || emp.user,
  profileId: emp._id,
  name: emp.user?.name,
  email: emp.user?.email,
  role: emp.user?.role,
  isActive: emp.user?.isActive,
  employeeId: emp.employeeId,
  department: emp.department,
  designation: emp.designation,
  phone: emp.phone,
  address: emp.address,
  emergencyContact: emp.emergencyContact,
  dateOfJoining: emp.dateOfJoining,
  manager: emp.manager,
});

// ---------- HR: manage people ----------
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip, meta } = paginate(req.query);
  const { search, role, department } = req.query;

  const userFilter = {};
  if (role) userFilter.role = role;
  if (search) userFilter.$or = [{ name: new RegExp(escapeRegex(search), 'i') }, { email: new RegExp(escapeRegex(search), 'i') }];
  const userIds = Object.keys(userFilter).length ? await User.find(userFilter).distinct('_id') : null;

  const filter = {};
  if (userIds) filter.user = { $in: userIds };
  if (department) filter.department = department;

  const [items, total] = await Promise.all([
    Employee.find(filter).populate('user', 'name email role isActive').populate('manager', 'name')
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Employee.countDocuments(filter),
  ]);
  res.json({ items: items.map(shape), ...meta(total), page, limit });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'employee', department, designation, phone, manager } = req.body;
  const user = await User.create({ name, email, password, role });
  const emp = await Employee.create({
    user: user._id, employeeId: await nextEmployeeId(), department, designation, phone, manager: manager || undefined,
  });
  if (role === 'manager') await Manager.create({ user: user._id, department });
  if (manager) await Manager.updateOne({ user: manager }, { $addToSet: { team: user._id } });
  await emp.populate('user', 'name email role isActive');
  res.status(201).json(shape(emp));
});

exports.getOne = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ user: req.params.id }).populate('user', 'name email role isActive');
  if (!emp) return res.status(404).json({ message: 'Employee not found.' });
  res.json(shape(emp));
});

exports.update = asyncHandler(async (req, res) => {
  const { name, email, role, isActive, department, designation, phone, address, manager } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Employee not found.' });

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (isActive !== undefined) user.isActive = isActive;
  const roleChanged = role && role !== user.role;
  if (roleChanged) user.role = role;
  await user.save();

  const emp = await Employee.findOne({ user: user._id });
  const oldManager = emp.manager?.toString();
  Object.assign(emp, Object.fromEntries(Object.entries({ department, designation, phone, address }).filter(([, v]) => v !== undefined)));
  if (manager !== undefined) emp.manager = manager || undefined;
  await emp.save();

  if (roleChanged && role === 'manager') await Manager.updateOne({ user: user._id }, { $setOnInsert: { department: emp.department } }, { upsert: true });
  if (manager !== undefined && oldManager !== (manager || undefined)) {
    if (oldManager) await Manager.updateOne({ user: oldManager }, { $pull: { team: user._id } });
    if (manager) await Manager.updateOne({ user: manager }, { $addToSet: { team: user._id } });
  }
  await emp.populate('user', 'name email role isActive');
  res.json(shape(emp));
});

// Soft delete keeps attendance and leave history intact.
exports.deactivate = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'You cannot deactivate your own account.' });
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ message: 'Employee not found.' });
  res.json({ message: `${user.name} has been deactivated.` });
});

exports.managers = asyncHandler(async (req, res) => {
  const managers = await User.find({ role: 'manager', isActive: true }).select('name email').lean();
  res.json(managers.map((m) => ({ id: m._id, name: m.name, email: m.email })));
});

// ---------- Any signed-in user: own profile ----------
exports.myProfile = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ user: req.user._id }).populate('user', 'name email role isActive').populate('manager', 'name');
  if (!emp) return res.status(404).json({ message: 'Profile not found.' });
  res.json(shape(emp));
});

exports.updateMyProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, emergencyContact } = req.body;
  if (name) { req.user.name = name; await req.user.save(); }
  const emp = await Employee.findOneAndUpdate(
    { user: req.user._id },
    Object.fromEntries(Object.entries({ phone, address, emergencyContact }).filter(([, v]) => v !== undefined)),
    { new: true }
  ).populate('user', 'name email role isActive');
  res.json(shape(emp));
});

// ---------- Manager: own team ----------
exports.myTeam = asyncHandler(async (req, res) => {
  const ids = await teamUserIds(req.user._id);
  const items = await Employee.find({ user: { $in: ids } }).populate('user', 'name email role isActive').lean();
  res.json(items.map(shape));
});

exports.addToTeam = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ user: req.body.userId }).populate('user', 'role');
  if (!emp || emp.user.role !== 'employee') return res.status(404).json({ message: 'Employee not found.' });
  emp.manager = req.user._id;
  await emp.save();
  await Manager.updateOne({ user: req.user._id }, { $addToSet: { team: emp.user._id } }, { upsert: true });
  res.json({ message: 'Added to your team.' });
});

exports.removeFromTeam = asyncHandler(async (req, res) => {
  await Employee.updateOne({ user: req.params.id, manager: req.user._id }, { $unset: { manager: 1 } });
  await Manager.updateOne({ user: req.user._id }, { $pull: { team: req.params.id } });
  res.json({ message: 'Removed from your team.' });
});

// Employees without a manager, so a manager can pick people to add.
exports.unassigned = asyncHandler(async (req, res) => {
  const items = await Employee.find({ manager: { $exists: false } }).populate('user', 'name email role isActive').lean();
  res.json(items.filter((e) => e.user?.role === 'employee' && e.user.isActive).map(shape));
});
