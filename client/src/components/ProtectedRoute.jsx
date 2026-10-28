import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loading } from './ui';

// <ProtectedRoute roles={['hr']}> blocks everyone else. Without roles, any signed-in user may enter.
export default function ProtectedRoute({ roles, children }) {
  const { user, status } = useSelector((s) => s.auth);
  if (status === 'loading') return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
