import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './store/authSlice';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Loading } from './components/ui';

// Pages load on demand so the first visit downloads less code.
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Trainings = lazy(() => import('./pages/Trainings'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Profile = lazy(() => import('./pages/Profile'));
const Team = lazy(() => import('./pages/Team'));
const Employees = lazy(() => import('./pages/Employees'));

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    if (localStorage.getItem('staffsync_token')) dispatch(loadUser());
  }, [dispatch]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/trainings" element={<Trainings />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<ProtectedRoute roles={['manager']}><Team /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute roles={['hr']}><Employees /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
