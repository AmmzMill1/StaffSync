import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, register } from '../store/authSlice';
import { Alert, useForm } from '../components/ui';

export default function Register() {
  const dispatch = useDispatch();
  const { user, status, error } = useSelector((s) => s.auth);
  const [form, bind] = useForm({ name: '', email: '', password: '', department: '', designation: '' });
  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = (e) => { e.preventDefault(); dispatch(register(form)); };

  return (
    <div className="auth-wrap">
      <section className="auth-side">
        <div className="brand px-0">Staff<span>Sync</span></div>
        <h1>Create your account.</h1>
        <p>New accounts start as employees. HR can change your role later.</p>
      </section>
      <section className="auth-form">
        <form onSubmit={submit}>
          <h2 className="h4 mb-3">Create account</h2>
          <Alert error={error} />
          <label className="form-label" htmlFor="name">Full name</label>
          <input id="name" className="form-control mb-3" required {...bind('name')} />
          <label className="form-label" htmlFor="email">Work email</label>
          <input id="email" type="email" className="form-control mb-3" required {...bind('email')} />
          <label className="form-label" htmlFor="password">Password (6+ characters)</label>
          <input id="password" type="password" minLength={6} className="form-control mb-3" required {...bind('password')} />
          <div className="row g-2 mb-3">
            <div className="col"><label className="form-label" htmlFor="department">Department</label><input id="department" className="form-control" {...bind('department')} /></div>
            <div className="col"><label className="form-label" htmlFor="designation">Job title</label><input id="designation" className="form-control" {...bind('designation')} /></div>
          </div>
          <button className="btn btn-primary w-100" disabled={status === 'busy'}>{status === 'busy' ? 'Creating...' : 'Create account'}</button>
          <p className="mt-3 mb-0 small">Already registered? <Link to="/login">Log in</Link></p>
        </form>
      </section>
    </div>
  );
}
