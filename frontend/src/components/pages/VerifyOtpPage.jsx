import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function VerifyOtpPage() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from the URL query parameters
    const email = new URLSearchParams(location.search).get('email');

    if (!email) {
        // Redirect to signup if no email is present
        navigate('/signup');
        return null;
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!otp || otp.length !== 6) {
            return setError('Please enter a valid 6-digit OTP.');
        }

        setLoading(true);
        try {
            const { data } = await axios.post(
                'http://localhost:5001/api/auth/verify-otp',
                { email, otp }
            );

            // Verification successful, now we log the user in
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');

        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    Verify Your Account
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    An OTP has been sent to <strong>{email}</strong>. Please enter it below.
                </p>
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-center tracking-widest text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:bg-indigo-300"
                    >
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}