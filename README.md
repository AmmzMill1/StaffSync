# StaffSync

A MERN-stack HR management system with three roles: **HR**, **manager** and **employee**.

| Role | Can do |
| --- | --- |
| Employee | Register and log in, edit own profile, check in/out, apply for and cancel leave, read announcements, see assigned training |
| Manager | Everything an employee can, plus manage a team, approve or reject team leave, view team attendance and monthly figures, create training for the team |
| HR | Everything a manager can, plus add, edit and deactivate people, assign managers and roles, review any leave, post announcements, view company-wide reports |

## Tech

- **Server:** Node, Express, MongoDB with Mongoose, JWT, bcryptjs, express-validator, cors, dotenv
- **Client:** React 18, Vite, React Router, Redux Toolkit, Axios, Bootstrap 5

## Run it locally

You need Node 18+ and a MongoDB instance (local install or a free MongoDB Atlas cluster).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm run seed                # optional: demo data
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Demo logins after `npm run seed` (password `password123`):

- `hr@staffsync.test`
- `manager@staffsync.test`
- `aarav@staffsync.test` (reports to the manager)

## Folder structure

```
staffsync/
  server/
    config/db.js            MongoDB connection
    models/                 User, Employee, Manager, Attendance, Leave, Announcement, Training, Notification
    middleware/             auth (JWT + role check), validation, error handling
    controllers/            business logic per module
    routes/index.js         all API routes and their input validation
    utils/                  pagination, team lookup, notifications, helpers
    tests/api.test.js       npm test
    seed.js                 demo data
    app.js / server.js
  client/
    src/store/              Redux Toolkit auth slice
    src/components/         Layout, ProtectedRoute, Notifications, shared UI
    src/pages/              one file per screen (lazy loaded)
```

## API overview

All routes are under `/api`. Everything except register and login needs `Authorization: Bearer <token>`.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/password` |
| Profile | `GET/PUT /profile` |
| Employees (HR) | `GET/POST /employees`, `GET/PUT/DELETE /employees/:id`, `GET /employees/managers` |
| Team (manager) | `GET/POST /team`, `DELETE /team/:id`, `GET /team/unassigned` |
| Attendance | `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance/today`, `GET /attendance/me`, `GET /attendance` (HR, manager), `PUT /attendance/:id` (HR) |
| Leaves | `POST /leaves`, `GET /leaves/me`, `GET /leaves` (HR, manager), `PATCH /leaves/:id/cancel`, `PATCH /leaves/:id/review` |
| Announcements | `GET /announcements`, `POST/PUT/DELETE` (HR) |
| Training | `GET /trainings`, `POST/PUT/DELETE` (HR, manager) |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Reports | `GET /reports/summary` (HR), `GET /reports/team` (manager), `GET /reports/me` |

List endpoints accept `?page=` and `?limit=`.

## Rules worth knowing

- Self-registration always creates an **employee**. HR promotes people to manager or HR.
- Employee leave goes to their manager. Leave from managers, HR, or employees with no manager goes to HR.
- Nobody can review their own leave request.
- Managers can only review leave and enroll training attendees from their own team.
- Deactivating a person blocks login but keeps their attendance and leave history.
- Check-ins after 10:00 server time count as late. Checking out after under 4 hours marks a half-day.

## Next steps to make it yours

1. Add leave balances per leave type (a `LeaveBalance` model) and check it in `leaveController.apply`.
2. Add API tests that use a test database (`mongodb-memory-server`) for the leave approval flow.
3. Deploy: API on Render or Railway, MongoDB on Atlas, client on Vercel (set `VITE_API_URL` and `CLIENT_ORIGIN`).
