import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check for the user info in local storage
  const userInfo = localStorage.getItem('userInfo');

  // If user info exists (meaning they are logged in), show the page they requested.
  // The <Outlet /> component renders the actual dashboard page.
  if (userInfo) {
    return <Outlet />;
  }

  // If no user info, redirect them to the login page.
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;