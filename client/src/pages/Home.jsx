import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Home() {
  const { user } = useSelector((s) => s.auth);
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <div className="auth-wrap">
      <section className="auth-side">
        <div className="brand px-0">Staff<span>Sync</span></div>
        <h1>HR work, in one place.</h1>
        <p>Attendance, leave, announcements and training for HR, managers and employees.</p>
        <div className="d-flex gap-2 mt-3">
          <Link to="/login" className="btn btn-primary">Log in</Link>
          <Link to="/register" className="btn btn-outline-light">Create account</Link>
        </div>
      </section>
      <section className="auth-form">
        <div style={{ maxWidth: 380 }}>
          <h2 className="h5 mb-3">What each role can do</h2>
          <p><strong>Employees</strong> mark attendance, apply for leave, and read company news.</p>
          <p><strong>Managers</strong> review their team's leave, track attendance and run training programs.</p>
          <p><strong>HR</strong> manages people, posts announcements and reads company-wide reports.</p>
        </div>
      </section>
    </div>
  );
}
