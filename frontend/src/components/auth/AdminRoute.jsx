import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const userInfo = localStorage.getItem('userInfo');
  let isAdmin = false;
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo);
      isAdmin = user.role === 'admin';
    } catch {
      isAdmin = false;
    }
  }
  if (userInfo && isAdmin) {
    return <Outlet />;
  }
  // If not admin, redirect to dashboard or login
  return <Navigate to={userInfo ? '/dashboard' : '/login'} replace />;
};

export default AdminRoute;
