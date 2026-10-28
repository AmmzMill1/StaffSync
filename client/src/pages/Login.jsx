import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, login } from '../store/authSlice';
import { Alert, useForm } from '../components/ui';

export default function Login() {
  const dispatch = useDispatch();
  const { user, status, error } = useSelector((s) => s.auth);
  const [form, bind] = useForm({ email: '', password: '' });
  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = (e) => { e.preventDefault(); dispatch(login(form)); };

  return (
    <div className="auth-wrap">
      <section className="auth-side">
        <div className="brand px-0">Staff<span>Sync</span></div>
        <h1>Welcome back.</h1>
        <p>Log in to check in, manage leave and see what's new.</p>
      </section>
      <section className="auth-form">
        <form onSubmit={submit}>
          <h2 className="h4 mb-3">Log in</h2>
          <Alert error={error} />
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control mb-3" required autoComplete="email" {...bind('email')} />
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="form-control mb-3" required autoComplete="current-password" {...bind('password')} />
          <button className="btn btn-primary w-100" disabled={status === 'busy'}>{status === 'busy' ? 'Logging in...' : 'Log in'}</button>
          <p className="mt-3 mb-0 small">New here? <Link to="/register">Create an account</Link></p>
        </form>
      </section>
    </div>
  );
}
