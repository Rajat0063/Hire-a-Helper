import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Overview from "./pages/dashboard/Overview";
import Feed from "./pages/dashboard/Feed";
import MyTasks from "./pages/dashboard/MyTasks";
import Requests from "./pages/dashboard/Requests";
import MyRequests from "./pages/dashboard/MyRequests";
import AddTask from "./pages/dashboard/AddTask";
import SettingsPage from "./pages/dashboard/Settings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DashboardLayout from "./components/DashboardLayout";
import { Protected } from "./components/Protected";

const Dash = ({ children }) => (
  <Protected><DashboardLayout>{children}</DashboardLayout></Protected>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* === Dashboard (per-user) === */}
      <Route path="/dashboard" element={<Dash><Overview /></Dash>} />
      <Route path="/dashboard/feed" element={<Dash><Feed /></Dash>} />
      <Route path="/dashboard/mine" element={<Dash><MyTasks /></Dash>} />
      <Route path="/dashboard/requests" element={<Dash><Requests /></Dash>} />
      <Route path="/dashboard/my-requests" element={<Dash><MyRequests /></Dash>} />
      <Route path="/dashboard/add-task" element={<Dash><AddTask /></Dash>} />
      <Route path="/dashboard/settings" element={<Dash><SettingsPage /></Dash>} />

      {/* === Admin === */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
