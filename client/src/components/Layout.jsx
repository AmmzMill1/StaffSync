import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import Notifications from './Notifications';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'speedometer2' },
  { to: '/attendance', label: 'Attendance', icon: 'calendar-check' },
  { to: '/leaves', label: 'Leaves', icon: 'calendar-x' },
  { to: '/trainings', label: 'Training', icon: 'mortarboard' },
  { to: '/announcements', label: 'Announcements', icon: 'megaphone' },
  { to: '/profile', label: 'My profile', icon: 'person-circle' },
];

export default function Layout() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const out = () => { dispatch(logout()); navigate('/login'); };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Staff<span>Sync</span></div>
        <nav className="nav flex-column">
  {NAV.map((n) => (
    <NavLink key={n.to} to={n.to} className="nav-link">
      <i className={`bi bi-${n.icon}`} />
      {n.label}
    </NavLink>
  ))}

  {user.role === 'manager' && (
    <>
      <div className="nav-group">Manager</div>
      <NavLink to="/team" className="nav-link">
        <i className="bi bi-people" />
        My team
      </NavLink>
    </>
  )}

  {user.role === 'hr' && (
    <>
      <div className="nav-group">HR</div>
      <NavLink to="/employees" className="nav-link">
        <i className="bi bi-person-vcard" />
        Employees
      </NavLink>
    </>
  )}
</nav>
        <div className="sidebar-foot small">
          <div className="text-white fw-semibold">{user.name}</div>
          <div className="mb-2 text-capitalize">{user.role}</div>
          <button className="btn btn-sm btn-outline-light w-100" onClick={out}>Log out</button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar"><Notifications /></div>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
