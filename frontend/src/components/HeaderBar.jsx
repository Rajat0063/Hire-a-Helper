import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Sun, Moon, Bell, ChevronDown, User, Settings, CreditCard, LogOut, Info, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { Avatar } from "./DashboardLayout";

// === HeaderBar ===
// Sticky/fixed dashboard header with global search (redirects to Feed),
// dark-mode toggle, notifications popover and the user dropdown.
export default function HeaderBar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [showTips, setShowTips] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  // ~ load notifications on open ~
  useEffect(() => {
    if (!notifOpen) return;
    api.get("/users/notifications")
      .then(({ data }) => setNotifs(data.notifications || []))
      .catch(() => {});
    api.patch("/users/notifications/read").catch(() => {});
  }, [notifOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    api.post("/users/bump", { kind: "search" }).catch(() => {});
    nav(`/dashboard/feed${term ? `?q=${encodeURIComponent(term)}` : ""}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur
                       border-b border-slate-100 dark:border-slate-800 flex items-center
                       justify-between gap-3 px-4 lg:px-8">
      <button className="lg:hidden text-slate-500" onClick={onMenu}><Menu size={22} /></button>

      {/* ~ search ~ */}
      <form onSubmit={submitSearch} className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          onFocus={() => setShowTips(true)}
          onBlur={() => setTimeout(() => setShowTips(false), 150)}
          placeholder="Search tasks, locations, categories…"
          className="input pl-10 pr-10 h-10"
        />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          onMouseDown={(e) => { e.preventDefault(); setShowTips((s) => !s); }}>
          <Info size={16} />
        </button>
        {showTips && (
          <div className="absolute mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-soft p-4 text-sm z-50">
            <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Search tips:</div>
            <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
              <li>Search by task title (e.g. "painting")</li>
              <li>Search by location (e.g. "Seattle")</li>
              <li>Search by category (e.g. "tech", "moving")</li>
              <li>Search by keywords in descriptions</li>
            </ul>
          </div>
        )}
      </form>

      {/* ~ right side actions ~ */}
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="h-10 w-10 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* notifications */}
        <div className="relative">
          <button onClick={() => setNotifOpen((v) => !v)}
            className="h-10 w-10 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative">
            <Bell size={18} />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-soft z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 font-semibold flex items-center gap-2">
                <Bell size={14} /> Notifications
              </div>
              {notifs.length === 0 ? (
                <div className="p-6 text-sm text-slate-500 text-center">You're all caught up.</div>
              ) : notifs.map((n) => (
                <div key={n._id} className="p-3 text-sm border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                  <div className="text-slate-700 dark:text-slate-200">{n.body}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* profile dropdown (matches screenshot) */}
        <div className="relative">
          <button onClick={() => setProfileOpen((v) => !v)}
            className="h-10 pl-1 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
            <Avatar src={user?.profilePicture} initials={initials} size={32} />
            <div className="hidden md:block text-left leading-tight">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user?.firstName}
              </div>
              <div className="text-[11px] text-slate-500 capitalize">{user?.role}</div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Avatar src={user?.profilePicture} initials={initials} size={44} />
                <div className="min-w-0">
                  <div className="font-bold truncate text-slate-800 dark:text-slate-100">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 text-center p-4 border-b border-slate-100 dark:border-slate-800">
                <Stat label="Tasks" value="0" />
                <Stat label="Helped" value="0" />
                <Stat label="Completion" value="0%" />
              </div>
              <div className="px-2 py-2 text-sm">
                <DropItem icon={User} onClick={() => { setProfileOpen(false); nav("/dashboard"); }}>Overview</DropItem>
                <DropItem icon={Settings} onClick={() => { setProfileOpen(false); nav("/dashboard/settings"); }}>Settings</DropItem>
                <DropItem icon={CreditCard} onClick={() => setProfileOpen(false)}>Payments</DropItem>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-2">
                <DropItem icon={LogOut} danger onClick={() => { logout(); nav("/login"); }}>Sign Out</DropItem>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function DropItem({ icon: Icon, children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
        danger ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
               : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      <Icon size={16} /> {children}
    </button>
  );
}
