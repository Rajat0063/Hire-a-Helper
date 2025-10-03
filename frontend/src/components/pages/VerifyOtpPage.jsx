
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
    const email = new URLSearchParams(location.search).get('email');
    if (!email) {
        navigate('/signup');
        return null;
    }
    const handleOtpChange = (e, idx) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (!val) {
            const newOtp = [...otp];
            newOtp[idx] = '';
            setOtp(newOtp);
            return;
        }
        const newOtp = [...otp];
        newOtp[idx] = val[val.length - 1];
        setOtp(newOtp);
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
                `${import.meta.env.VITE_API_URL}/api/auth/verify-otp`,
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
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-100 overflow-hidden">
            {/* Animated SVG background */}
            <svg className="absolute -top-32 -left-32 w-[600px] h-[600px] opacity-30 animate-spin-slow" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="otp-blur1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle cx="300" cy="300" r="300" fill="url(#otp-blur1)" />
            </svg>
            <svg className="absolute -bottom-40 -right-40 w-[500px] h-[500px] opacity-20 animate-pulse" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="otp-blur2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <circle cx="250" cy="250" r="250" fill="url(#otp-blur2)" />
            </svg>
            <div className="relative z-10 max-w-md w-full bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/40">
                <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-2 tracking-tight">Verify Your Account</h2>
                <p className="text-center text-gray-600 mb-6">An OTP has been sent to <strong>{email}</strong>. Please enter it below.</p>
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
                                className="w-12 h-12 border border-gray-300 rounded-lg text-center text-2xl font-mono focus:ring-2 focus:ring-indigo-400 outline-none transition bg-white/80"
                                autoFocus={idx === 0}
                            />
                        ))}
                    </div>
                    {error && <p className="text-sm text-red-600 mb-4 text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:bg-indigo-300 shadow-lg"
                    >
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}