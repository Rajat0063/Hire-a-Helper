
import React, { useState } from "react";
import PasswordStrengthIndicator from "../ui/PasswordStrengthIndicator";
import { Icon } from "../ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { name, email, phoneNumber, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      return setError("Please fill in all required fields.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        { name, email, phoneNumber, password }
      );
      navigate(`/verify-otp?email=${email}`);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-teal-100 relative overflow-hidden">
      {/* Animated gradient blob background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="signupBlob1" cx="50%" cy="50%" r="80%">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <ellipse cx="70%" cy="-10%" rx="40%" ry="30%" fill="url(#signupBlob1)" className="animate-blob" />
          <ellipse cx="-10%" cy="80%" rx="30%" ry="20%" fill="#5eead4" className="animate-blob animation-delay-2000" />
        </svg>
      </div>
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold text-indigo-700 mb-2 tracking-tight">Create your account</h2>
        <p className="text-zinc-500 mb-8 text-center">Sign up to get started with Hire-a-Helper</p>
        <form className="w-full space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={name}
            onChange={onChange}
            className="w-full border border-zinc-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/90"
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={email}
            onChange={onChange}
            className="w-full border border-zinc-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/90"
          />
          <input
            type="tel"
            placeholder="Phone Number (Optional)"
            name="phoneNumber"
            value={phoneNumber}
            onChange={onChange}
            className="w-full border border-zinc-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/90"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              value={password}
              onChange={onChange}
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/90 pr-12"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800"
              onClick={() => setShowPassword((v) => !v)}
            >
              <Icon
                path={showPassword
                  ? "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                  : "M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 4.06-5.94M9.9 9.9a4 4 0 0 1 5.66 5.66M1 1l22 22"}
                viewBox="0 0 24 24"
                className="w-5 h-5"
              />
            </button>
            <PasswordStrengthIndicator password={password} />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <label className="flex items-center text-sm text-zinc-600">
            <input type="checkbox" className="mr-2" required />I agree with
            <span className="text-blue-600 ml-1 cursor-pointer">Terms</span> and
            <span className="text-blue-600 ml-1 cursor-pointer">Privacy policy</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold text-base transition disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? "Sending OTP..." : "Sign up"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-600 mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
      {/* Animation styles */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 8s infinite; transform-origin: center; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}