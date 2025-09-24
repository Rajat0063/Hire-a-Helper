import { Link } from "react-router-dom";
import hireHelperImg from "../../assets/Hire_A_Healper_img.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
        
        <div className="flex justify-center">
          <img
            src={hireHelperImg}
            alt="Hire Helper"
            className="rounded-2xl shadow-lg w-full max-w-md"
          />
        </div>

        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-4">
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-semibold">
              Hire-a-Helper
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
            Walk through the <br /> world with us
          </h1>

          <p className="text-gray-600 leading-relaxed mb-6">
            <strong>Hire Helper</strong> – Build Your Career with Us
Hire Helper connects you with the right opportunities to grow. Learn by doing, work on real projects, and get guidance that helps you face tomorrow’s challenges with confidence. Start your journey with Hire Helper and take a step toward a successful career.
          </p>

          <Link to="/signup">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-lg font-medium transition duration-300">
              Get started
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
