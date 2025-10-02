import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import hireHelperImg from "../../assets/Hire_A_Healper_img.png";

export default function SignupPage() {
  // State to hold the form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  // State for handling errors and loading status
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Hook to navigate programmatically
  const navigate = useNavigate();

  // Destructure for easier access
  const { name, email, phoneNumber, password } = formData;

  // Function to update state when user types
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to handle form submission
  const onSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(""); // Clear previous errors

    // Basic validation
    if (!name || !email || !password) {
      return setError("Please fill in all required fields.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setLoading(true);
    try {
      // API call to the backend registration endpoint
      const response = await axios.post(
        "http://localhost:5001/api/auth/register",
        {
          name,
          email,
          phoneNumber,
          password,
        }
      );

      console.log("OTP Sent:", response.data.message);

      // --- THIS IS THE KEY CHANGE ---
      // On success, redirect to the OTP verification page.
      // We pass the email in the URL so the next page knows who is verifying.
      navigate(`/verify-otp?email=${email}`);

    } catch (err) {
      // Display error message from backend or a generic one
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-lg grid md:grid-cols-2 overflow-hidden">
        <div className="flex items-center justify-center bg-gray-50 p-6">
          <img
            src={hireHelperImg}
            alt="Hire Helper"
            className="rounded-xl w-full h-auto object-cover max-w-lg"
          />
        </div>

        <div className="flex flex-col justify-center p-8">
          <div className="flex items-center space-x-2 mb-6">
            <h2 className="text-2xl font-bold text-indigo-600">Hire-a-Helper</h2>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign up</h3>
          <p className="text-gray-500 text-sm mb-6">
            Enter your details to sign up
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="Name"
              name="name"
              value={name}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={email}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="tel"
              placeholder="Phone Number (Optional)"
              name="phoneNumber"
              value={phoneNumber}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={password}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <label className="flex items-center text-sm text-gray-600">
              <input type="checkbox" className="mr-2" required />I agree with{" "}
              <span className="text-blue-600 ml-1 cursor-pointer">Terms</span> and{" "}
              <span className="text-blue-600 ml-1 cursor-pointer">
                Privacy policy
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:bg-indigo-300"
            >
              {loading ? "Sending OTP..." : "Sign up"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}