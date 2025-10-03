
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineLockClosed, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        setIsLoading(true);
        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`;
            const { data } = await axios.post(apiUrl, { password });
            setSuccess(data.message);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-100 overflow-hidden">
            {/* Animated SVG background */}
            <svg className="absolute -top-32 -left-32 w-[600px] h-[600px] opacity-30 animate-spin-slow" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="reset-blur1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle cx="300" cy="300" r="300" fill="url(#reset-blur1)" />
            </svg>
            <svg className="absolute -bottom-40 -right-40 w-[500px] h-[500px] opacity-20 animate-pulse" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="reset-blur2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle cx="250" cy="250" r="250" fill="url(#reset-blur2)" />
            </svg>
            <div className="relative z-10 max-w-md w-full bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/40">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Set a New Password</h2>
                    <p className="text-gray-600 mt-2 text-base">Please enter and confirm your new password below.</p>
                </div>
                {!success ? (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/80"
                                    placeholder="Enter your new password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                                </span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/80"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="flex items-center text-red-600 text-sm mb-4">
                                <HiOutlineXCircle className="h-5 w-5 mr-2" />
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 disabled:bg-indigo-300 shadow-lg"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <HiOutlineCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800">Success!</h3>
                        <p className="text-gray-600 mt-2">{success}</p>
                        <p className="text-gray-500 text-sm mt-4">Redirecting you to the login page...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;