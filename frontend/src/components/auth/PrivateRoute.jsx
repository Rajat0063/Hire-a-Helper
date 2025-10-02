import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// This is a sample auth check.
// In your real app, you would have more robust logic,
// like verifying a token with a backend.
const useAuth = () => {
  const token = localStorage.getItem('user_token'); // Or however you store your token
  if (token) {
    return true; // User is authenticated
  }
  return false; // User is not authenticated
};

const PrivateRoute = () => {
  const isAuthenticated = useAuth();

  // If authenticated, render the child route (e.g., Dashboard).
  // Otherwise, redirect to the /login page.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;