
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("userInfo")) {
      navigate("/dashboard/feed");
    }
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`;
      const { data } = await axios.post(apiUrl, { email, password });
      localStorage.setItem("userInfo", JSON.stringify(data));
      navigate("/dashboard/feed");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please check your credentials."
      );
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
            <radialGradient id="loginBlob1" cx="50%" cy="50%" r="80%">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <ellipse cx="70%" cy="-10%" rx="40%" ry="30%" fill="url(#loginBlob1)" className="animate-blob" />
          <ellipse cx="-10%" cy="80%" rx="30%" ry="20%" fill="#5eead4" className="animate-blob animation-delay-2000" />
        </svg>
      </div>
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold text-indigo-700 mb-2 tracking-tight">Sign in to Hire-a-Helper</h2>
        <p className="text-zinc-500 mb-8 text-center">Welcome back! Enter your details to log in.</p>
        <form className="w-full space-y-5" onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-zinc-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white/90"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-zinc-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white/90"
          />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-zinc-600 cursor-pointer">
              <input type="checkbox" className="mr-2 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
              Forgot Password?
            </Link>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold text-base transition disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-600 mt-8">
          Dont have an account yet?{" "}
          <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
            Sign up
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