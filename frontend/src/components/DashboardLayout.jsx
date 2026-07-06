import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Home, ListChecks, Inbox, Send, PlusCircle, Settings,
  LogOut, X, Shield, ShieldCheck, MessageSquare, MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getSocket } from "../services/socket";
import HeaderBar from "./HeaderBar";
import AssistantWidget from "./AssistantWidget";
import FeedbackWidget from "./FeedbackWidget";

// === Sidebar links ===
// `badge` is computed at render time using live state. The Requests row
// shows a numeric pill with the count of pending received requests.
const baseLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/feed", label: "Feed", icon: Home },
  { to: "/dashboard/mine", label: "My Tasks", icon: ListChecks },
  { to: "/dashboard/requests", label: "Requests", icon: Inbox, key: "requests" },
  { to: "/dashboard/my-requests", label: "My Requests", icon: Send },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/nearby", label: "Nearby Tasks", icon: MapPin },
  { to: "/dashboard/add-task", label: "Add Task", icon: PlusCircle },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [pendingRequests, setPendingRequests] = useState(0);

  // Disable browser back from dashboard pages.
  useEffect(() => {
    const trap = () => window.history.pushState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", trap);
    return () => window.removeEventListener("popstate", trap);
  }, []);

  // ~ Live pending-request count for the sidebar badge ~
  const loadPending = () => {
    api.get("/requests/received").then(({ data }) => {
      setPendingRequests((data.requests || []).filter((r) => r.status === "pending").length);
    }).catch(() => {});
  };
  useEffect(() => {
    loadPending();
    const s = getSocket(); if (!s) return;
    const r = () => loadPending();
    s.on("request:new", r); s.on("request:status", r);
    return () => { s.off("request:new", r); s.off("request:status", r); };
  }, []);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  const badges = { requests: pendingRequests };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <aside
        className={`fixed lg:sticky lg:top-0 z-40 inset-y-0 left-0 w-72 bg-white dark:bg-slate-900
                    border-r border-slate-100 dark:border-slate-800 transform
                    ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
                    transition-transform h-screen flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-lg">Hire-a-Helper</span>
          </div>
          <button className="lg:hidden text-slate-500" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {baseLinks.map((l) => {
            const badge = l.key ? badges[l.key] : 0;
            return (
              <NavLink
                key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`
                }
              >
                <span className="flex items-center gap-3"><l.icon size={18} /> {l.label}</span>
                {badge > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                         : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`
            }>
              <Shield size={18} /> Admin
            </NavLink>
          )}
        </nav>

        <div className="border-t border-slate-100 dark:border-slate-800 p-3 flex items-center gap-3 shrink-0">
          <Avatar src={user?.profilePicture} initials={initials} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs truncate text-slate-500">{user?.email}</div>
          </div>
          <button onClick={() => { logout(); nav("/login"); }}
            className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
            title="Sign out"><LogOut size={18} /></button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar onMenu={() => setOpen(true)} />
        <main className="p-4 lg:p-8 flex-1">{children}</main>
      </div>

      {/* Floating helpers — visible on every dashboard page */}
      <AssistantWidget />
      <FeedbackWidget />
    </div>
  );
}

export function Avatar({ src, initials, size = 36 }) {
  const dim = { width: size, height: size };
  if (src) {
    return (
      <img src={src} alt="avatar" style={dim}
        className="rounded-full object-cover border border-slate-200 dark:border-slate-700" />
    );
  }
  return (
    <div style={dim}
      className="rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-bold text-sm">
      {initials}
    </div>
  );
}
