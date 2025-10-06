import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import socket from './utils/socket';

// --- Page Imports ---
import LandingPage from '../src/components/pages/LandingPage_Display';
import LoginPage from '../src/components/pages/LoginPage_Disaplay';
import SignupPage from '../src/components/pages/SigninPage_Display';
import VerifyOtpPage from '../src/components/pages/VerifyOtpPage';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage';
import ResetPasswordPage from './components/pages/ResetPasswordPage';

// --- Auth and Layout Imports ---

import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminRoute from './components/auth/AdminRoute';

// --- Dashboard Content Imports ---
import FeedContent from './components/pages/FeedContent';
import TasksContent from './components/pages/TasksContent';
import MyTasksContent from './components/pages/MyTasksContent';
import RequestsContent from './components/pages/RequestsContent';
import MyRequestsContent from './components/pages/MyRequestsContent';
import AddTaskContent from './components/pages/AddTaskContent';
import SettingsContent from './components/pages/SettingsContent';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();
    socket.on('force-logout', ({ userId }) => {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user._id === userId) {
          localStorage.removeItem('userInfo');
          navigate('/login', { replace: true });
        }
      }
    });
    return () => {
      socket.off('force-logout');
    };
  }, [navigate]);

  return (
    <Router>
      <Routes>
        {/* ============================================= */}
        {/* PUBLIC ROUTES                                 */}
        {/* ============================================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />


        {/* ============================================= */}
        {/* PROTECTED ROUTES                              */}
        {/* ============================================= */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="feed" replace />} />
            <Route path="feed" element={<FeedContent />} />
            <Route path="my-tasks" element={<MyTasksContent />} />
            <Route path="requests" element={<RequestsContent />} />
            <Route path="my-requests" element={<MyRequestsContent />} />
            <Route path="add-task" element={<AddTaskContent />} />
            <Route path="settings" element={<SettingsContent />} />
          </Route>
        </Route>
        {/* Admin dashboard route (protected, only visible to admins) */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />

        {/* ============================================= */}
        {/* FALLBACK ROUTE                                */}
        {/* ============================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;