// Run with: npm run seed
// Wipes the database and creates demo data so you can log in as each role.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Manager = require('./models/Manager');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Announcement = require('./models/Announcement');
const Training = require('./models/Training');
const Notification = require('./models/Notification');
const { toDay } = require('./utils/dates');

const PASSWORD = 'password123';

(async () => {
  await connectDB();
  await Promise.all([User, Employee, Manager, Attendance, Leave, Announcement, Training, Notification].map((m) => m.deleteMany({})));

  const make = async (name, email, role, department, designation, manager, n) => {
    const user = await User.create({ name, email, password: PASSWORD, role });
    await Employee.create({ user: user._id, employeeId: `EMP${String(n).padStart(4, '0')}`, department, designation, manager: manager?._id });
    return user;
  };

  const hr = await make('Hina Rao', 'hr@staffsync.test', 'hr', 'People Ops', 'HR Lead', null, 1);
  const mgr = await make('Manish Verma', 'manager@staffsync.test', 'manager', 'Engineering', 'Engineering Manager', null, 2);
  const e1 = await make('Aarav Singh', 'aarav@staffsync.test', 'employee', 'Engineering', 'Software Engineer', mgr, 3);
  const e2 = await make('Sana Khan', 'sana@staffsync.test', 'employee', 'Engineering', 'QA Engineer', mgr, 4);
  await make('Rohan Gupta', 'rohan@staffsync.test', 'employee', 'Design', 'Product Designer', null, 5);
  await Manager.create({ user: mgr._id, department: 'Engineering', team: [e1._id, e2._id] });

  // Last 5 working days of attendance for the team
  for (let i = 1; i <= 5; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if ([0, 6].includes(d.getDay())) continue;
    for (const u of [e1, e2]) {
      const inT = new Date(d); inT.setHours(u === e2 && i === 2 ? 10 : 9, 15, 0, 0);
      const outT = new Date(d); outT.setHours(18, 0, 0, 0);
      await Attendance.create({ user: u._id, date: toDay(d), checkIn: inT, checkOut: outT, status: u === e2 && i === 2 ? 'late' : 'present' });
    }
  }

  const from = new Date(); from.setDate(from.getDate() + 7);
  const to = new Date(from); to.setDate(to.getDate() + 1);
  await Leave.create({ user: e1._id, type: 'casual', from, to, days: 2, reason: 'Family function', status: 'pending' });

  await Announcement.create({ title: 'Welcome to StaffSync', body: 'Mark attendance daily, apply for leave from the Leaves page, and check here for company news.', postedBy: hr._id, pinned: true });
  await Training.create({ title: 'Secure coding basics', description: 'OWASP top 10 walkthrough.', startDate: from, endDate: to, createdBy: mgr._id, assignees: [e1._id, e2._id] });

  console.log(`Seeded. Log in with any of these (password: ${PASSWORD}):\n  hr@staffsync.test\n  manager@staffsync.test\n  aarav@staffsync.test`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
