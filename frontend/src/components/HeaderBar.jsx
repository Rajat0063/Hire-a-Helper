import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, Search, Sun, Moon, Monitor, Bell, ChevronDown,
  User, Settings, CreditCard, LogOut, Info, MapPin, IndianRupee,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { Avatar } from "./DashboardLayout";

// === HeaderBar ===
// Sticky/fixed dashboard header — global search (redirects to Feed),
// 3-state theme switcher, realtime notifications, profile dropdown.
// On small screens dropdowns are anchored to viewport edges (fixed) so the
// notification panel sits visibly centered instead of being cropped.
export default function HeaderBar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolved } = useTheme();
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [tips, setTips] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [stats, setStats] = useState({ myTasks: 0, helped: 0, completion: 0 });
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // ~ recent search suggestions from the user's own log ~
  const [recentSearches, setRecentSearches] = useState([]);

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  useEffect(() => {
    api.get("/users/notifications")
      .then(({ data }) => {
        setNotifs(data.notifications || []);
        setUnread((data.notifications || []).filter((n) => !n.read).length);
      }).catch(() => {});
    api.get("/users/overview")
      .then(({ data }) => {
        const c = data.counts || {};
        setStats({ myTasks: c.myTasks || 0, helped: c.helped || 0, completion: c.completionPct || 0 });
      }).catch(() => {});
    api.get("/search/recent").then(({ data }) => setRecentSearches(data.searches || [])).catch(() => {});

    const s = getSocket(); if (!s) return;
    const onNew = (n) => { setNotifs((p) => [n, ...p].slice(0, 50)); setUnread((u) => u + 1); };
    // ~ Realtime message pings also raise the bell counter so users never
    //   miss a chat while browsing other pages ~
    const onMsg = () => {
      api.get("/users/notifications").then(({ data }) => {
        setNotifs(data.notifications || []);
        setUnread((data.notifications || []).filter((n) => !n.read).length);
      }).catch(() => {});
    };
    s.on("notification:new", onNew);
    s.on("message:new", onMsg);
    return () => { s.off("notification:new", onNew); s.off("message:new", onMsg); };
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    api.patch("/users/notifications/read").catch(() => {});
    setUnread(0);
  }, [notifOpen]);

  const runSearch = (term) => {
    const t = (term ?? q).trim();
    api.post("/search/log", { query: t }).catch(() => {});
    if (t) setRecentSearches((p) => [{ _id: Math.random(), query: t, createdAt: new Date() }, ...p].slice(0, 20));
    nav(`/dashboard/feed${t ? `?q=${encodeURIComponent(t)}` : ""}`);
    setSearchOpen(false);
  };

  useEffect(() => {
    const t = q.trim();
    if (t.length < 1) { setResults([]); setSearchOpen(false); return; }
    const id = setTimeout(() => {
      api.get("/tasks", { params: { q: t } })
        .then(({ data }) => { setResults((data.tasks || []).slice(0, 6)); setSearchOpen(true); })
        .catch(() => {});
    }, 220);
    return () => clearTimeout(id);
  }, [q]);

  const submitSearch = (e) => { e.preventDefault(); runSearch(); };

  // close all dropdowns on outside click
  const rootRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (!rootRef.current?.contains(e.target)) { setNotifOpen(false); setProfileOpen(false); setThemeOpen(false); setSearchOpen(false); setTips(false); } };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header ref={rootRef} className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur
                       border-b border-slate-100 dark:border-slate-800 flex items-center
                       justify-between gap-3 px-4 lg:px-8">
      <button className="lg:hidden text-slate-500" onClick={onMenu}><Menu size={22} /></button>

      <form onSubmit={submitSearch} className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          value={q} onChange={(e) => { setQ(e.target.value); setTips(false); }}
          onFocus={() => q.trim() && setSearchOpen(true)}
          placeholder="Search tasks, locations, categories…"
          className="input pl-10 pr-10 h-10"
        />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          onMouseDown={(e) => { e.preventDefault(); setTips((s) => !s); }}>
          <Info size={16} />
        </button>
        {tips && (
          <div className="absolute mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-soft p-4 text-sm z-50">
            {recentSearches.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold text-slate-500 mb-2">Recent searches</div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.slice(0, 6).map((r) => (
                    <button key={r._id} type="button"
                      onMouseDown={(e) => { e.preventDefault(); setQ(r.query); runSearch(r.query); }}
                      className="chip bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-900/30">
                      {r.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="font-semibold mb-1 text-slate-700 dark:text-slate-200">Search tips</div>
            <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
              <li>Title (e.g. "painting"), location (e.g. "Seattle"), or category</li>
              <li>Press Enter — results open on the Feed</li>
            </ul>
          </div>
        )}
        {searchOpen && !tips && q.trim() && (
          <div className="absolute mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden text-sm z-50">
            <div className="px-4 py-2 text-xs font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">Live task results</div>
            {results.length === 0 ? (
              <div className="p-4 text-slate-500">No matching tasks found.</div>
            ) : results.map((t) => (
              <button key={t._id} type="button" onMouseDown={(e) => { e.preventDefault(); runSearch(q); nav(`/dashboard/feed?taskId=${t._id}`); setSearchOpen(false); }}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                {(t.image || t.picture) ? <img src={t.image || t.picture} alt="" className="h-11 w-11 rounded-xl object-cover" /> : <div className="h-11 w-11 rounded-xl bg-brand-50 dark:bg-brand-900/30" />}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 truncate"><MapPin size={11} /> {t.location} · {t.category}</div>
                </div>
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center"><IndianRupee size={12} />{Number(t.paymentAmount || 0).toFixed(0)}</div>
              </button>
            ))}
            <button type="button" onMouseDown={(e) => { e.preventDefault(); runSearch(q); }} className="w-full px-4 py-3 text-brand-700 dark:text-brand-300 font-semibold hover:bg-brand-50 dark:hover:bg-brand-900/20">
              View all results for “{q}”
            </button>
          </div>
        )}
      </form>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme switcher */}
        <div className="relative">
          <button onClick={() => { setThemeOpen((v) => !v); setNotifOpen(false); setProfileOpen(false); }}
            className="h-10 w-10 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            {resolved === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {themeOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-soft z-50 p-1 text-sm">
              <ThemeRow icon={Sun} label="Light" active={theme === "light"} onClick={() => { setTheme("light"); setThemeOpen(false); }} />
              <ThemeRow icon={Moon} label="Dark" active={theme === "dark"} onClick={() => { setTheme("dark"); setThemeOpen(false); }} />
              <ThemeRow icon={Monitor} label="System" active={theme === "system"} onClick={() => { setTheme("system"); setThemeOpen(false); }} />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); setThemeOpen(false); }}
            className="h-10 w-10 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative">
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-1 grid place-items-center text-[10px] rounded-full bg-rose-500 text-white font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            // ! On mobile: anchored to viewport (fixed + centered). On lg+: anchored to button (absolute).
            <div className="fixed left-1/2 -translate-x-1/2 top-[68px] w-[92vw] max-w-sm
                            lg:absolute lg:left-auto lg:right-0 lg:translate-x-0 lg:top-auto lg:mt-2 lg:w-80
                            max-h-[70vh] overflow-auto bg-white dark:bg-slate-900
                            border border-slate-100 dark:border-slate-800 rounded-xl shadow-soft z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
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

        {/* Profile */}
        <div className="relative">
          <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); setThemeOpen(false); }}
            className="h-10 pl-1 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2">
            <Avatar src={user?.profilePicture} initials={initials} size={32} />
            <div className="hidden md:block text-left leading-tight">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.firstName}</div>
              <div className="text-[11px] text-slate-500 capitalize">{user?.role}</div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {profileOpen && (
            <div className="fixed left-1/2 -translate-x-1/2 top-[68px] w-[92vw] max-w-sm
                            lg:absolute lg:left-auto lg:right-0 lg:translate-x-0 lg:top-auto lg:mt-2 lg:w-80
                            bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800
                            rounded-2xl shadow-soft z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Avatar src={user?.profilePicture} initials={initials} size={44} />
                <div className="min-w-0">
                  <div className="font-bold truncate text-slate-800 dark:text-slate-100">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 text-center p-4 border-b border-slate-100 dark:border-slate-800">
                <Stat label="Tasks" value={stats.myTasks} />
                <Stat label="Helped" value={stats.helped} />
                <Stat label="Completion" value={`${stats.completion}%`} />
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

function ThemeRow({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
        ${active ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                 : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
      <Icon size={16} /> {label}
    </button>
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
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
        danger ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
               : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}>
      <Icon size={16} /> {children}
    </button>
  );
}
