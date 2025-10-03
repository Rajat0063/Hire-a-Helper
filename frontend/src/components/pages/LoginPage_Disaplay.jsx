import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import hireHelperImg from "../../assets/Hire_A_Healper_img.png"; // Ensure this path is correct

// Renamed component to LoginPage for clarity
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // This hook checks if a user is already logged in.
  // If 'userInfo' exists in localStorage, it redirects them to the dashboard
  // so they don't have to log in again.
  useEffect(() => {
    if (localStorage.getItem("userInfo")) {
      navigate("/dashboard/feed");
    }
  }, [navigate]);

  // This function handles the form submission
  const onSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form refresh
    setError("");
    setLoading(true);

    try {
      // Use the environment variable for the API endpoint
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`;

      const { data } = await axios.post(apiUrl, { email, password });

      // After a successful login, save the user data from the API response
      // to localStorage. This is the data our dashboard will use.
      localStorage.setItem("userInfo", JSON.stringify(data));
      
      // Redirect the user to the main dashboard feed
      navigate("/dashboard/feed");

    } catch (err) {
      // If the API returns an error, display it to the user
      setError(
        err.response?.data?.message || "Login failed. Please check your credentials."
      );
    } finally {
      // Ensure the loading state is turned off, whether the login succeeds or fails
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-lg grid md:grid-cols-2 overflow-hidden">
        <div className="hidden md:flex items-center justify-center bg-gray-50 p-6">
          <img
            src={hireHelperImg}
            alt="A diverse group of helpers"
            className="rounded-xl w-full h-auto object-cover max-w-lg"
          />
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">
          <h2 className="text-3xl font-bold text-indigo-600 mb-4">Hire-a-Helper</h2>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back!</h3>
          <p className="text-gray-500 text-sm mb-8">Enter your details to log in.</p>

          <form className="space-y-5" onSubmit={onSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input type="checkbox" className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold text-base transition disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Dont have an account yet?{" "}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}