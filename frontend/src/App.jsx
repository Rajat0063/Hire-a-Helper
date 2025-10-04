import Messages from './components/pages/Messages';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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

// --- Dashboard Content Imports ---
import FeedContent from './components/pages/FeedContent';
import TasksContent from './components/pages/TasksContent';
import MyTasksContent from './components/pages/MyTasksContent';
import RequestsContent from './components/pages/RequestsContent';
import MyRequestsContent from './components/pages/MyRequestsContent';
import AddTaskContent from './components/pages/AddTaskContent';
import SettingsContent from './components/pages/SettingsContent';

function App() {
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
            {/* ⭐️ UPDATED: This now explicitly redirects to the feed route. */}
            {/* This ensures the URL is always `/dashboard/feed` for clarity. */}
            <Route index element={<Navigate to="feed" replace />} />
            {/* Other nested dashboard pages */}
            <Route path="feed" element={<FeedContent />} />
            <Route path="my-tasks" element={<MyTasksContent />} />
            <Route path="requests" element={<RequestsContent />} />
            <Route path="my-requests" element={<MyRequestsContent />} />
            <Route path="add-task" element={<AddTaskContent />} />
            <Route path="settings" element={<SettingsContent />} />
          </Route>
          {/* Chat route outside dashboard layout for full-screen chat */}
          <Route path="/messages/:taskId/:userId" element={<Messages />} />
        </Route>

        {/* ============================================= */}
        {/* FALLBACK ROUTE                                */}
        {/* ============================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;