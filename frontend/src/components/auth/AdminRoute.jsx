import React from 'react';
import { Navigate } from 'react-router-dom';

// Usage: <AdminRoute><AdminDashboard /></AdminRoute>
export default function AdminRoute({ children }) {
  const userInfo = localStorage.getItem('userInfo');
  let isAdmin = false;
  try {
    if (userInfo) {
      const user = JSON.parse(userInfo);
      isAdmin = user.isAdmin;
    }
  } catch {
    isAdmin = false;
  }

  if (!userInfo) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
