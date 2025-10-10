import { Link } from "react-router-dom";
import AppLogo from "../../assets/logo (2).png";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-zinc-50 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {/* animated gradient blobs */}
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <g>
            <ellipse cx="15%" cy="20%" rx="30%" ry="18%" fill="url(#g1)" className="animate-blob" />
            <ellipse cx="85%" cy="40%" rx="28%" ry="20%" fill="#a78bfa" className="animate-blob animation-delay-2000" />
            <ellipse cx="50%" cy="80%" rx="45%" ry="25%" fill="#5eead4" className="animate-blob animation-delay-4000" />
          </g>
        </svg>
      </div>

      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-white/50 backdrop-blur flex items-center justify-center shadow overflow-hidden">
            <img src={AppLogo} alt="Hire-a-Helper" className="h-8 w-8 object-contain" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-800">Hire-a-Helper</h2>
        </div>
        <nav className="flex items-center space-x-3">
          <Link to="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">Sign in</Link>
          <Link to="/signup" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Get started</Link>
        </nav>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block bg-white/60 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-primary">Find help. Give help.</span>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-zinc-900">Make work simple — connect, hire, and grow</h1>

            <p className="text-lg text-zinc-600 max-w-xl">Hire-a-Helper helps you find local help or get hired for tasks you love. Post jobs, manage requests, and communicate effortlessly — all in one beautiful, safe place.</p>

            <div className="flex items-center space-x-4">
              <Link to="/signup" className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                Create an account
              </Link>
              <Link to="/dashboard/feed" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">Explore feed →</Link>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/60 backdrop-blur p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold">Post tasks</h4>
                <p className="text-sm text-zinc-600">Quickly post jobs and get offers from helpers near you.</p>
              </div>
              <div className="bg-white/60 backdrop-blur p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold">Real-time requests</h4>
                <p className="text-sm text-zinc-600">Receive instant requests and notifications when someone applies.</p>
              </div>
              <div className="bg-white/60 backdrop-blur p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold">Secure chats</h4>
                <p className="text-sm text-zinc-600">Chat and coordinate safely with verified users.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Animated mockup card */}
              <div className="relative w-full max-w-md mx-auto">
              <div className="rounded-2xl shadow-2xl overflow-hidden bg-white/80 backdrop-blur p-6 transform transition duration-700 scale-102-hover">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Latest Tasks</h3>
                    <p className="text-sm text-zinc-500">See what's been posted nearby</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">3</div>
                </div>
                <ul className="space-y-3">
                  <li className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Paint living room</p>
                        <p className="text-sm text-zinc-500">Dehradun · Oct 3</p>
                      </div>
                      <div className="text-sm text-primary">$30</div>
                    </div>
                  </li>
                  <li className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Assemble furniture</p>
                        <p className="text-sm text-zinc-500">Dehradun · Oct 2</p>
                      </div>
                      <div className="text-sm text-primary">$20</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-2xl bg-gradient-to-tr from-indigo-400 to-teal-300 opacity-80 blur-2xl animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-6 py-10 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Hire-a-Helper — Built with care.
      </footer>

      {/* Small inline styles for blob animation */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 8s infinite; transform-origin: center; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
  .scale-102-hover:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
}
