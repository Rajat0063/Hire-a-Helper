import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList, Send, Inbox, TrendingUp, Search, MessageSquare, LogIn, Eye,
  Mail, Phone, MapPin, Check, Shield, Star, Award, Calendar, CheckCircle2,
  Users, ArrowRight, MessageCircle, Clock,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// === Overview ===
// Pulls /api/users/overview for counts + conversations + helpers + reviews
// so every signed-in user sees their own unique data and real conversations.
export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState({ list: [], average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [helperTab, setHelperTab] = useState("helpers"); // 'helpers' | 'helped'

  useEffect(() => {
    setLoading(true);
    api.get("/users/overview")
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const uid = user?.id || user?._id;
    if (!uid) return;
    api.get(`/reviews/user/${uid}`)
      .then(({ data }) => setReviews({ list: data.reviews || [], average: data.average || 0, count: data.count || 0 }))
      .catch(() => {});
  }, [user?.id, user?._id]);

  const c = data?.counts || {};
  const u = data?.user || user || {};
  const conversations = data?.conversations || [];
  const helpers = data?.helpers || [];
  const tasksHelped = data?.tasksHelped || [];
  const initials = `${u?.firstName?.[0] || ""}${u?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const joined = u?.createdAt ? new Date(u.createdAt).toLocaleDateString([], { month: "long", year: "numeric" }) : "—";

  const achievements = buildAchievements(c, reviews || { list: [], average: 0, count: 0 });

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Welcome back, {u?.firstName || "there"}!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Here's your personal dashboard overview and statistics.</p>
      </div>

      {/* ====== Professional profile card ====== */}
      <section className="card overflow-hidden">
        <div className="relative h-36 sm:h-48 md:h-52 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700">
          {u.coverImage ? (
            <img src={u.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-brand-700/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/90 via-slate-950/0 to-transparent" />
        </div>

        <div className="px-4 sm:px-8 pb-6 -mt-12 sm:-mt-16">
          <div className="flex flex-col gap-5 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-950/95 p-4 sm:p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <div className="flex-none -mt-8 sm:mt-0">
                {u.profilePicture ? (
                  <img src={u.profilePicture} alt="" className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-2xl sm:rounded-[28px] object-cover border-4 border-white dark:border-slate-950 shadow-xl" />
                ) : (
                  <div className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-2xl sm:rounded-[28px] bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-extrabold text-2xl sm:text-3xl border-4 border-white dark:border-slate-950 shadow-xl">
                    {initials}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white truncate">{u.firstName} {u.lastName}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 items-center text-xs sm:text-sm">
                      {u.phoneVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs font-semibold">
                          <CheckCircle2 size={13} /> Verified
                        </span>
                      )}
                      <Link to="/dashboard/my-requests" className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition">
                        <Award size={13} className="text-emerald-600 dark:text-emerald-400" /> Helped {c.helped ?? 0}
                      </Link>
                      <Link to="/dashboard/requests" className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-200 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition">
                        <Users size={13} className="text-teal-600 dark:text-teal-400" /> Helpers {c.helpersCount ?? helpers.length}
                      </Link>
                      <Link to="/dashboard/my-tasks" className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200 text-xs font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/50 transition">
                        <ClipboardList size={13} className="text-brand-600 dark:text-brand-400" /> Posted {c.myTasks ?? 0}
                      </Link>
                      {reviews.count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-xs font-semibold">
                          <Star size={13} className="fill-current" /> {reviews.average} · {reviews.count} review{reviews.count !== 1 && "s"}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to="/dashboard/settings" className="btn-primary text-xs sm:text-sm py-2 px-4 whitespace-nowrap self-start sm:self-auto">
                    Edit profile
                  </Link>
                </div>

                {u.bio && <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">{u.bio}</p>}

                <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <div className="inline-flex items-center gap-2 rounded-xl sm:rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/80 truncate">
                    <Mail size={14} className="shrink-0 text-slate-400" /> <span className="truncate">{u.email}</span>
                  </div>
                  {u.phone && (
                    <div className="inline-flex items-center gap-2 rounded-xl sm:rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/80 truncate">
                      <Phone size={14} className="shrink-0 text-slate-400" /> <span className="truncate">{u.phone}</span>
                    </div>
                  )}
                  {u.address && (
                    <div className="inline-flex items-center gap-2 rounded-xl sm:rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/80 truncate">
                      <MapPin size={14} className="shrink-0 text-slate-400" /> <span className="truncate">{u.address}</span>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 rounded-xl sm:rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/80 truncate">
                    <Calendar size={14} className="shrink-0 text-slate-400" /> <span>Joined {joined}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Big stats ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <GradientStat title="Your Tasks" value={c.myTasks ?? 0} to="/dashboard/my-tasks"
          sub="Tasks you posted" icon={ClipboardList} gradient="from-brand-500 to-brand-700" />
        <GradientStat title="Requests Sent" value={c.sentRequests ?? 0} to="/dashboard/my-requests"
          sub="Requests you sent to task owners" icon={Send} gradient="from-emerald-400 to-teal-600" />
        <GradientStat title="Incoming Requests" value={c.receivedRequests ?? 0} to="/dashboard/requests"
          sub="Requests for your tasks" icon={Inbox} gradient="from-amber-400 to-orange-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MiniStat icon={TrendingUp} value={c.totalActions ?? 0} label="Total Actions" />
        <MiniStat icon={Search} value={c.searches ?? 0} label="Searches" />
        <MiniStat icon={MessageSquare} value={c.messages ?? 0} label="Messages" to="/dashboard/messages" />
        <MiniStat icon={LogIn} value={c.logins ?? 0} label="Logins" />
      </div>

      {/* ====== Direct Messages / Active Conversations Feature ====== */}
      <section className="card p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 grid place-items-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Recent Messages & Chats</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct conversations with task owners and helpers</p>
            </div>
          </div>
          <Link to="/dashboard/messages" className="btn-ghost text-xs sm:text-sm py-1.5 px-3 inline-flex items-center gap-1 font-semibold">
            Open All Chats <ArrowRight size={13} />
          </Link>
        </div>

        {conversations.length === 0 ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center space-y-2.5">
            <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 grid place-items-center mx-auto">
              <MessageCircle size={20} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">No active messages yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Conversations are opened when a request is accepted on a task. Browse tasks or post one to start chatting with community members!
            </p>
            <div className="pt-1 flex justify-center gap-2">
              <Link to="/dashboard/feed" className="btn-primary text-xs py-1.5 px-3.5">Browse Feed</Link>
              <Link to="/dashboard/add-task" className="btn-ghost text-xs py-1.5 px-3.5">Post Task</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {conversations.map((conv) => {
              const other = conv.otherUser;
              const name = other ? `${other.firstName} ${other.lastName}` : "Community Member";
              const initials = other ? `${other.firstName?.[0] || ""}${other.lastName?.[0] || ""}`.toUpperCase() : "U";
              return (
                <Link
                  key={conv._id}
                  to={`/dashboard/messages?c=${conv._id}`}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-soft transition flex items-start gap-3 group"
                >
                  {other?.profilePicture ? (
                    <img src={other.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 grid place-items-center font-bold text-sm shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                        {name}
                      </span>
                      {conv.lastAt && (
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(conv.lastAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    {conv.task?.title && (
                      <div className="text-[11px] text-brand-600 dark:text-brand-400 truncate mt-0.5">
                        Task: {conv.task.title}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                      {conv.lastMessage || "Click to open conversation and chat..."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ====== Who Helped & Your Helpers Section ====== */}
      <section className="card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 grid place-items-center">
              <Users size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Community Helpers & Tasks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">People who helped you and tasks you've worked on</p>
            </div>
          </div>
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setHelperTab("helpers")}
              className={`px-3 py-1.5 rounded-md transition ${
                helperTab === "helpers"
                  ? "bg-white dark:bg-slate-900 text-brand-700 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Helpers on Your Tasks ({helpers.length})
            </button>
            <button
              onClick={() => setHelperTab("helped")}
              className={`px-3 py-1.5 rounded-md transition ${
                helperTab === "helped"
                  ? "bg-white dark:bg-slate-900 text-brand-700 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Tasks You Helped ({tasksHelped.length})
            </button>
          </div>
        </div>

        {helperTab === "helpers" ? (
          helpers.length === 0 ? (
            <div className="p-6 text-center text-xs sm:text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
              No helper requests accepted on your tasks yet. When you accept requests from community helpers, they will appear here!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {helpers.map((h) => {
                const helper = h.requester;
                const hName = helper ? `${helper.firstName} ${helper.lastName}` : "Helper";
                const hInitials = helper ? `${helper.firstName?.[0] || ""}${helper.lastName?.[0] || ""}`.toUpperCase() : "H";
                return (
                  <div key={h._id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-start gap-3">
                    {helper?.profilePicture ? (
                      <img src={helper.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 grid place-items-center font-bold text-sm shrink-0">
                        {hInitials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{hName}</div>
                        <span className="text-[11px] capitalize px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                          {h.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        Task: <b>{h.task?.title || "Task"}</b>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{new Date(h.updatedAt || h.createdAt).toLocaleDateString()}</span>
                        <Link to="/dashboard/messages" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          tasksHelped.length === 0 ? (
            <div className="p-6 text-center text-xs sm:text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
              You haven't helped on any tasks yet. Send requests on community tasks to become a verified helper!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tasksHelped.map((req) => (
                <div key={req._id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 grid place-items-center font-bold text-sm shrink-0">
                    <Award size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {req.task?.title || "Community Task"}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      Owner: {req.task?.user?.firstName ? `${req.task.user.firstName} ${req.task.user.lastName}` : "Task Owner"}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="capitalize px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium">
                        {req.status}
                      </span>
                      <Link to="/dashboard/my-requests" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </section>

      {/* ====== Achievements ====== */}
      <section className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base sm:text-lg">
            <Award size={18} className="text-amber-500" /> Achievements
          </h2>
          <div className="text-xs text-slate-500 font-medium">{achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <div key={a.id} className={`rounded-xl border p-3.5 sm:p-4 flex items-start gap-3 transition ${
              a.unlocked
                ? "border-amber-200 bg-amber-50/80 dark:border-amber-700/40 dark:bg-amber-900/15"
                : "border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-70"
            }`}>
              <div className={`h-10 w-10 grid place-items-center rounded-xl text-lg shrink-0 ${
                a.unlocked ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                           : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}>{a.emoji}</div>
              <div className="min-w-0">
                <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">{a.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== Reviews ====== */}
      <section className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base sm:text-lg">
            <Star size={18} className="text-amber-500 fill-amber-500" /> Reviews
          </h2>
          {reviews.count > 0 && (
            <div className="text-xs sm:text-sm text-slate-500">
              <b className="text-slate-800 dark:text-white">{reviews.average}</b> avg · {reviews.count} total
            </div>
          )}
        </div>
        {reviews.list.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-500 py-2">No reviews yet — complete a task to earn your first review.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.list.map((r) => (
              <li key={r._id} className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 first:pt-0 first:border-0">
                {r.fromUser?.profilePicture ? (
                  <img src={r.fromUser.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-bold text-sm shrink-0">
                    {(r.fromUser?.firstName?.[0] || "?") + (r.fromUser?.lastName?.[0] || "")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {r.fromUser?.firstName} {r.fromUser?.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500 my-1">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} size={12} className={n <= r.rating ? "fill-amber-500" : "text-slate-300 dark:text-slate-600"} />
                    ))}
                    {r.task?.title && <span className="text-xs text-slate-500 ml-2 truncate">on "{r.task.title}"</span>}
                  </div>
                  {r.comment && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.comment}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ====== Recent activity ====== */}
      <section className="card p-4 sm:p-6">
        <h2 className="font-bold text-brand-700 dark:text-brand-300 mb-4 text-base sm:text-lg">Recent Activity</h2>
        {(!data?.recent || data.recent.length === 0) ? (
          <p className="text-xs sm:text-sm text-slate-500 py-2">Nothing yet — your activity will appear here as you interact with tasks and requests.</p>
        ) : (
          <ul className="space-y-3">
            {data.recent.map((n) => (
              <li key={n._id} className="flex items-start gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 grid place-items-center shrink-0">
                  <Eye size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">{n.body}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// === Skeleton Loading Component for Overview ===
function OverviewSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse" aria-label="Loading overview">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>

      {/* Profile card skeleton */}
      <div className="card overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="h-36 sm:h-48 md:h-52 bg-slate-200 dark:bg-slate-800" />
        <div className="px-4 sm:px-8 pb-6 -mt-12 sm:-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-950/95 p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800">
            <div className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-2xl sm:rounded-[28px] bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex justify-between items-center">
                <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              </div>
              <div className="h-4 w-full max-w-md bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={`stat-skel-${i}`} className="rounded-2xl p-6 bg-slate-200 dark:bg-slate-800 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-5 w-5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-10 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
            <div className="h-3 w-32 bg-slate-300 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Mini stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={`ministat-skel-${i}`} className="card p-6 text-center space-y-2 border border-slate-200/80 dark:border-slate-800">
            <div className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
            <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Achievements skeleton */}
      <div className="card p-4 sm:p-6 space-y-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={`ach-skel-${i}`} className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildAchievements(c, reviews) {
  return [
    { id: "first-post",   emoji: "🚀", title: "First Task Posted",  desc: "Post your first task",            unlocked: (c.myTasks ?? 0) >= 1 },
    { id: "task-pro",     emoji: "📋", title: "Task Pro",           desc: "Post 5 tasks",                    unlocked: (c.myTasks ?? 0) >= 5 },
    { id: "helper",       emoji: "🤝", title: "Helping Hand",       desc: "Complete 1 task for someone",     unlocked: (c.helped ?? 0) >= 1 },
    { id: "super-helper", emoji: "⭐", title: "Super Helper",       desc: "Complete 10 helped tasks",        unlocked: (c.helped ?? 0) >= 10 },
    { id: "reviewed",     emoji: "💬", title: "First Review",       desc: "Receive your first review",       unlocked: reviews.count >= 1 },
    { id: "five-star",    emoji: "🏆", title: "Five-Star Worker",   desc: "Maintain a 4.5+ average rating",  unlocked: reviews.average >= 4.5 && reviews.count >= 3 },
  ];
}

function GradientStat({ title, value, sub, icon: Icon, gradient, to }) {
  const content = (
    <div className={`rounded-2xl p-6 text-white bg-gradient-to-br ${gradient} shadow-soft transition hover:opacity-95 hover:scale-[1.01]`}>
      <div className="flex items-start justify-between">
        <div className="font-semibold">{title}</div>
        <Icon size={20} />
      </div>
      <div className="text-5xl font-extrabold my-3">{value}</div>
      <div className="text-sm text-white/85">{sub}</div>
    </div>
  );
  return to ? <Link to={to} className="block">{content}</Link> : content;
}
function MiniStat({ icon: Icon, value, label, to }) {
  const content = (
    <div className="card p-6 text-center transition hover:border-brand-300 dark:hover:border-brand-700">
      <Icon className="mx-auto text-brand-600 dark:text-brand-300" size={20} />
      <div className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
  return to ? <Link to={to} className="block">{content}</Link> : content;
}
