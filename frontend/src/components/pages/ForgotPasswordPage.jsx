
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineArrowLeft, HiOutlineMail } from 'react-icons/hi';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`;
      const { data } = await axios.post(apiUrl, { email });
      setMessage(data.message || 'If an account with that email exists, a password reset link has been sent.');
      setEmail('');
    } catch (err) {
      if (err.response && err.response.status === 200 && err.response.data?.message) {
        setMessage(err.response.data.message);
        setError('');
      } else {
        setError(err.response?.data?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-100 overflow-hidden">
      {/* Animated SVG background */}
      <svg className="absolute -top-32 -left-32 w-[600px] h-[600px] opacity-30 animate-spin-slow" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="forgot-blur1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#forgot-blur1)" />
      </svg>
      <svg className="absolute -bottom-40 -right-40 w-[500px] h-[500px] opacity-20 animate-pulse" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="forgot-blur2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="250" cy="250" r="250" fill="url(#forgot-blur2)" />
      </svg>
      <div className="relative z-10 max-w-md w-full bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/40">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Forgot Password?</h2>
          <p className="text-gray-600 mt-2 text-base">No worries! Enter your email below and we'll send you a reset link.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <HiOutlineMail className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/80"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          {message && <p className="text-green-600 text-sm mb-4 text-center">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 disabled:bg-indigo-300 transition duration-150 shadow-lg"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-indigo-600 hover:underline flex items-center justify-center gap-1">
            <HiOutlineArrowLeft />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;