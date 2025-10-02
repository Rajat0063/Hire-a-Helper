import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';


export default function VerifyOtpPage() {
    const inputRefs = useRef([]);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
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

    const handleOtpChange = (e, idx) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (!val) {
            // If empty, just clear this box
            const newOtp = [...otp];
            newOtp[idx] = '';
            setOtp(newOtp);
            return;
        }
        const newOtp = [...otp];
        newOtp[idx] = val[val.length - 1]; // Only last digit
        setOtp(newOtp);
        // Move to next input if not last
        if (val && idx < 5) {
            inputRefs.current[idx + 1]?.focus();
        }
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            return setError('Please enter a valid 6-digit OTP.');
        }
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/verify-otp`,
                { email, otp: otpValue }
            );
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
                    <div className="mb-4 flex justify-center gap-2">
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                value={digit}
                                onChange={e => handleOtpChange(e, idx)}
                                onKeyDown={e => handleKeyDown(e, idx)}
                                ref={el => (inputRefs.current[idx] = el)}
                                className="w-12 h-12 border border-gray-300 rounded-lg text-center text-2xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                autoFocus={idx === 0}
                            />
                        ))}
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