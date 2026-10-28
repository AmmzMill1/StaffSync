const router = require('express').Router();
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const auth = require('../controllers/authController');
const emp = require('../controllers/employeeController');
const att = require('../controllers/attendanceController');
const leave = require('../controllers/leaveController');
const ann = require('../controllers/announcementController');
const train = require('../controllers/trainingController');
const notif = require('../controllers/notificationController');
const report = require('../controllers/reportController');

const mongoId = (field = 'id') => param(field).isMongoId().withMessage('Invalid id.');
const hr = authorize('hr');
const hrOrManager = authorize('hr', 'manager');

// ----- Auth -----
router.post('/auth/register', [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  validate,
], auth.register);
router.post('/auth/login', [
  body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  validate,
], auth.login);
router.get('/auth/me', protect, auth.me);
router.put('/auth/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
  validate,
], auth.changePassword);

// Everything below needs a signed-in user.
router.use(protect);

// ----- Profile (any role) -----
router.get('/profile', emp.myProfile);
router.put('/profile', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  validate,
], emp.updateMyProfile);

// ----- Employees (HR) -----
router.get('/employees', hr, emp.list);
router.get('/employees/managers', hr, emp.managers);
router.post('/employees', hr, [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').optional().isIn(['hr', 'manager', 'employee']).withMessage('Role must be hr, manager or employee.'),
  validate,
], emp.create);
router.get('/employees/:id', hr, mongoId(), validate, emp.getOne);
router.put('/employees/:id', hr, mongoId(), validate, emp.update);
router.delete('/employees/:id', hr, mongoId(), validate, emp.deactivate);

// ----- Team (manager) -----
router.get('/team', authorize('manager'), emp.myTeam);
router.get('/team/unassigned', authorize('manager'), emp.unassigned);
router.post('/team', authorize('manager'), [body('userId').isMongoId().withMessage('Pick an employee.'), validate], emp.addToTeam);
router.delete('/team/:id', authorize('manager'), mongoId(), validate, emp.removeFromTeam);

// ----- Attendance -----
router.post('/attendance/check-in', att.checkIn);
router.post('/attendance/check-out', att.checkOut);
router.get('/attendance/today', att.today);
router.get('/attendance/me', att.mine);
router.get('/attendance', hrOrManager, att.list);
router.put('/attendance/:id', hr, mongoId(), validate, att.adjust);

// ----- Leaves -----
router.post('/leaves', [
  body('type').isIn(['casual', 'sick', 'earned', 'unpaid']).withMessage('Choose a leave type.'),
  body('from').isISO8601().withMessage('Enter a valid start date.'),
  body('to').isISO8601().withMessage('Enter a valid end date.'),
  body('reason').trim().notEmpty().withMessage('Add a reason for the leave.'),
  validate,
], leave.apply);
router.get('/leaves/me', leave.mine);
router.get('/leaves', hrOrManager, leave.list);
router.patch('/leaves/:id/cancel', mongoId(), validate, leave.cancel);
router.patch('/leaves/:id/review', hrOrManager, mongoId(), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected.'),
  validate,
], leave.review);

// ----- Announcements -----
router.get('/announcements', ann.list);
router.post('/announcements', hr, [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('body').trim().notEmpty().withMessage('Message is required.'),
  validate,
], ann.create);
router.put('/announcements/:id', hr, mongoId(), validate, ann.update);
router.delete('/announcements/:id', hr, mongoId(), validate, ann.remove);

// ----- Trainings -----
router.get('/trainings', train.list);
router.post('/trainings', hrOrManager, [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('startDate').isISO8601().withMessage('Enter a valid start date.'),
  body('endDate').isISO8601().withMessage('Enter a valid end date.'),
  validate,
], train.create);
router.put('/trainings/:id', hrOrManager, mongoId(), validate, train.update);
router.delete('/trainings/:id', hrOrManager, mongoId(), validate, train.remove);

// ----- Notifications -----
router.get('/notifications', notif.mine);
router.patch('/notifications/read-all', notif.markAllRead);
router.patch('/notifications/:id/read', mongoId(), validate, notif.markRead);

// ----- Reports -----
router.get('/reports/summary', hr, report.summary);
router.get('/reports/team', authorize('manager'), report.team);
router.get('/reports/me', report.me);

module.exports = router;
