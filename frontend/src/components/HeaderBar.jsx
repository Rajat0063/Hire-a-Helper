import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, Search, Sun, Moon, Monitor, Bell, ChevronDown,
  User, Settings, CreditCard, LogOut, Info, MapPin, IndianRupee,
  MessageSquare, ClipboardList, CheckCircle2, CheckSquare, Star,
  CheckCheck, Trash2, Volume2, VolumeX, X, ExternalLink, Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { Avatar } from "./Avatar";

// Sound synthesizer using Web Audio API (no external audio assets required)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22); // D6

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.32);
    osc2.stop(now + 0.32);
  } catch {}
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getNotificationMeta(n) {
  const type = n?.type || "system";
  switch (type) {
    case "message":
      return {
        icon: MessageSquare,
        bg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300",
        label: "Message",
        defaultLink: n.link || "/dashboard/messages",
      };
    case "request":
      return {
        icon: ClipboardList,
        bg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",
        label: "Request",
        defaultLink: n.link || "/dashboard/requests",
      };
    case "payment":
      return {
        icon: IndianRupee,
        bg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300",
        label: "Payment",
        defaultLink: n.link || "/dashboard/payments",
      };
    case "task":
      return {
        icon: CheckSquare,
        bg: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300",
        label: "Task",
        defaultLink: n.link || "/dashboard/requests",
      };
    case "feedback":
    case "review":
      return {
        icon: Star,
        bg: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300",
        label: "Review",
        defaultLink: n.link || "/dashboard",
      };
    default:
      return {
        icon: Bell,
        bg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
        label: "Alert",
        defaultLink: n.link || "/dashboard",
      };
  }
}

// === HeaderBar ===
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
  const [activeTab, setActiveTab] = useState("all");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem("hh_notif_sound") !== "false";
    } catch {
      return true;
    }
  });

  // Floating live in-app notification popup
  const [liveBanner, setLiveBanner] = useState(null);
  const bannerTimerRef = useRef(null);

  // ~ recent search suggestions from the user's own log ~
  const [recentSearches, setRecentSearches] = useState([]);

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hh_notif_sound", String(next));
      } catch {}
      if (next) playNotificationChime();
      return next;
    });
  };

  const showIncomingBanner = (notif) => {
    if (soundEnabled) playNotificationChime();
    setLiveBanner(notif);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setLiveBanner(null);
    }, 6500);
  };

  const loadNotifications = () => {
    api.get("/users/notifications")
      .then(({ data }) => {
        setNotifs(data.notifications || []);
        const unreadCount = data.unreadCount ?? (data.notifications || []).filter((n) => !n.read).length;
        setUnread(unreadCount);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    api.get("/users/overview")
      .then(({ data }) => {
        const c = data.counts || {};
        setStats({ myTasks: c.myTasks || 0, helped: c.helped || 0, completion: c.completionPct || 0 });
      })
      .catch(() => {});
    api.get("/search/recent").then(({ data }) => setRecentSearches(data.searches || [])).catch(() => {});

    const s = getSocket();
    if (!s) return;
    const onNew = (n) => {
      setNotifs((p) => [n, ...p.filter((x) => String(x._id) !== String(n._id))].slice(0, 50));
      setUnread((u) => u + 1);
      showIncomingBanner(n);
    };
    const onMsg = () => {
      loadNotifications();
    };
    s.on("notification:new", onNew);
    s.on("message:new", onMsg);
    return () => {
      s.off("notification:new", onNew);
      s.off("message:new", onMsg);
    };
  }, [soundEnabled]);

  const markAllRead = async () => {
    try {
      await api.patch("/users/notifications/read");
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const toggleSingleRead = async (e, notif) => {
    e.stopPropagation();
    try {
      const nextRead = !notif.read;
      setNotifs((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: nextRead } : n))
      );
      setUnread((u) => Math.max(0, nextRead ? u - 1 : u + 1));
      await api.patch(`/users/notifications/${notif._id}/read`, { read: nextRead });
    } catch {}
  };

  const deleteSingleNotif = async (e, notifId) => {
    e.stopPropagation();
    try {
      setNotifs((prev) => prev.filter((n) => n._id !== notifId));
      await api.delete(`/users/notifications/${notifId}`);
      loadNotifications();
    } catch {}
  };

  const clearAllNotifs = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      setNotifs([]);
      setUnread(0);
      await api.delete("/users/notifications/clear-all");
    } catch {}
  };

  const handleNotificationClick = (n) => {
    if (!n.read) {
      api.patch(`/users/notifications/${n._id}/read`, { read: true }).catch(() => {});
      setNotifs((prev) => prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setNotifOpen(false);
    const meta = getNotificationMeta(n);
    const destination = n.link || meta.defaultLink;
    if (destination) nav(destination);
  };

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
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setNotifOpen(false);
        setProfileOpen(false);
        setThemeOpen(false);
        setSearchOpen(false);
        setTips(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Filter notifications by category tab
  const filteredNotifs = notifs.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "requests") return n.type === "request" || n.category === "requests";
    if (activeTab === "messages") return n.type === "message" || n.category === "messages";
    if (activeTab === "payments") return n.type === "payment" || n.category === "payments";
    if (activeTab === "system") return ["system", "feedback", "review"].includes(n.type);
    return true;
  });

  return (
    <>
      {/* Floating In-App Live Notification Toast Banner */}
      {liveBanner && (
        <div className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md w-[92vw] bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center ${getNotificationMeta(liveBanner).bg}`}>
            {(() => {
              const Icon = getNotificationMeta(liveBanner).icon;
              return <Icon size={18} />;
            })()}
          </div>
          <div className="flex-1 min-w-0" onClick={() => { handleNotificationClick(liveBanner); setLiveBanner(null); }}>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-1">
              <span className="truncate">{liveBanner.title || getNotificationMeta(liveBanner).label}</span>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold uppercase">New</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 cursor-pointer hover:underline">
              {liveBanner.body}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { handleNotificationClick(liveBanner); setLiveBanner(null); }}
              className="p-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              title="Open"
            >
              <ExternalLink size={14} />
            </button>
            <button
              onClick={() => setLiveBanner(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

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
              className="h-10 w-10 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Change theme">
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

          {/* Advanced Notifications Popover */}
          <div className="relative">
            <button onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); setThemeOpen(false); }}
              className="h-10 w-10 grid place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative"
              title="Notifications">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 grid place-items-center text-[10px] rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="fixed left-1/2 -translate-x-1/2 top-[68px] w-[94vw] max-w-md
                              lg:absolute lg:left-auto lg:right-0 lg:translate-x-0 lg:top-auto lg:mt-2 lg:w-96
                              max-h-[82vh] flex flex-col bg-white dark:bg-slate-900
                              border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900/70">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                    <Bell size={16} className="text-brand-600 dark:text-brand-400" />
                    <span>Notifications</span>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        {unread} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Audio sound toggle */}
                    <button
                      type="button"
                      onClick={toggleSound}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                      title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
                    >
                      {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>
                    {/* Mark all as read */}
                    {unread > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                        title="Mark all as read"
                      >
                        <CheckCheck size={15} />
                      </button>
                    )}
                    {/* Clear all */}
                    {notifs.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifs}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                        title="Clear all"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs scrollbar-none">
                  {[
                    { id: "all", label: "All" },
                    { id: "unread", label: `Unread (${unread})` },
                    { id: "requests", label: "Requests" },
                    { id: "messages", label: "Messages" },
                    { id: "payments", label: "Payments" },
                    { id: "system", label: "System" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                        activeTab === tab.id
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 font-semibold"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[58vh]">
                  {filteredNotifs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                      <Bell size={28} className="mx-auto mb-2 opacity-40" />
                      <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {activeTab === "unread" ? "No unread notifications" : "You're all caught up"}
                      </div>
                      <div className="text-xs mt-1">We'll alert you when tasks, messages, or payments arrive.</div>
                    </div>
                  ) : (
                    filteredNotifs.map((n) => {
                      const meta = getNotificationMeta(n);
                      const Icon = meta.icon;
                      return (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 text-sm flex items-start gap-3 cursor-pointer transition group hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                            !n.read ? "bg-brand-50/30 dark:bg-brand-950/20" : ""
                          }`}
                        >
                          <div className={`h-9 w-9 shrink-0 rounded-xl grid place-items-center mt-0.5 ${meta.bg}`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">
                                {n.title || meta.label}
                              </span>
                              <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
                              {n.body}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 self-center opacity-80 group-hover:opacity-100">
                            {!n.read && (
                              <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" title="Unread" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => toggleSingleRead(e, n)}
                              className="p-1 rounded-md text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 opacity-0 group-hover:opacity-100 transition"
                              title={n.read ? "Mark as unread" : "Mark as read"}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => deleteSingleNotif(e, n._id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
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
                  <DropItem icon={CreditCard} onClick={() => { setProfileOpen(false); nav("/dashboard/payments"); }}>Payments & Earnings</DropItem>
                  <DropItem icon={Settings} onClick={() => { setProfileOpen(false); nav("/dashboard/settings"); }}>Settings</DropItem>
                  {user?.role === "admin" && (
                    <DropItem icon={Activity} onClick={() => { setProfileOpen(false); nav("/admin"); }}>Admin Dashboard</DropItem>
                  )}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-2">
                  <DropItem icon={LogOut} danger onClick={() => { logout(); nav("/login"); }}>Sign Out</DropItem>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
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
