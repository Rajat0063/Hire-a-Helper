import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineLockClosed, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const ResetPasswordPage = () => {
    // The 'token' is extracted from the URL (e.g., /reset-password/THIS_PART)
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

        // Basic validation: check if passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Basic password strength check
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`;
            const { data } = await axios.post(apiUrl, { password });

            setSuccess(data.message);
            // After a few seconds, redirect to the login page
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Set a New Password</h2>
                    <p className="text-gray-600 mt-2">
                        Please enter and confirm your new password below.
                    </p>
                </div>

                {/* The form is only shown if the password has not been successfully reset */}
                {!success ? (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter your new password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                                </span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-indigo-300"
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