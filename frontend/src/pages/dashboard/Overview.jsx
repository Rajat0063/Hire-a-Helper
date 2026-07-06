import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList, Send, Inbox, TrendingUp, Search, MessageSquare, LogIn, Eye,
  Mail, Phone, MapPin, Check, Shield, Star, Award, Calendar, CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// === Overview ===
// Pulls /api/users/overview for counts + /api/reviews/user/<me> for the
// review section so every signed-in user sees their own unique data. The
// profile card has been redesigned: cover banner, large avatar, rating
// badge, contact strip, "Edit profile" CTA. Achievements are computed
// client-side from the counts (no extra endpoint).
export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState({ list: [], average: 0, count: 0 });

  useEffect(() => {
    api.get("/users/overview").then(({ data }) => setData(data)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!user?.id) return;
    api.get(`/reviews/user/${user.id}`)
      .then(({ data }) => setReviews({ list: data.reviews || [], average: data.average || 0, count: data.count || 0 }))
      .catch(() => {});
  }, [user?.id]);

  const c = data?.counts || {};
  const u = data?.user || user || {};
  const initials = `${u?.firstName?.[0] || ""}${u?.lastName?.[0] || ""}`.toUpperCase();
  const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString([], { month: "long", year: "numeric" }) : "—";

  const achievements = buildAchievements(c, reviews);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Welcome back, {u?.firstName}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Here's your dashboard overview</p>
      </div>

      {/* ====== Professional profile card ====== */}
      <section className="card overflow-hidden">
        <div className="relative h-44 sm:h-52 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700">
          {u.coverImage ? (
            <img src={u.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-brand-700/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/90 via-slate-950/0 to-transparent" />
        </div>

        <div className="px-5 sm:px-8 pb-6 -mt-14 sm:-mt-16">
          <div className="flex flex-col gap-5 rounded-b-3xl bg-white/90 dark:bg-slate-950/95 p-5 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-none">
                {u.profilePicture ? (
                  <img src={u.profilePicture} alt="" className="h-32 w-32 sm:h-36 sm:w-36 rounded-[28px] object-cover border-4 border-white dark:border-slate-950 shadow-xl" />
                ) : (
                  <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-[28px] bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-extrabold text-3xl border-4 border-white dark:border-slate-950 shadow-xl">
                    {initials}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-3xl text-slate-900 dark:text-white truncate">{u.firstName} {u.lastName}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 items-center text-sm">
                      {u.phoneVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                          <CheckCircle2 size={14} /> Verified
                        </span>
                      )}
                      {reviews.count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                          <Star size={14} className="fill-current" /> {reviews.average} · {reviews.count} review{reviews.count !== 1 && "s"}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to="/dashboard/settings" className="btn-primary text-sm py-2 whitespace-nowrap">
                    Edit profile
                  </Link>
                </div>

                {u.bio && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 max-w-3xl">{u.bio}</p>}

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-500 dark:text-slate-400">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/80">
                    <Mail size={14} /> {u.email}
                  </div>
                  {u.phone && (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/80">
                      <Phone size={14} /> {u.phone}
                    </div>
                  )}
                  {u.address && (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/80">
                      <MapPin size={14} /> {u.address}
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/80">
                    <Calendar size={14} /> Joined {joined}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Big stats ====== */}
      <div className="grid md:grid-cols-3 gap-4">
        <GradientStat title="Your Tasks" value={c.myTasks ?? 0}
          sub="Tasks you posted" icon={ClipboardList} gradient="from-brand-500 to-brand-700" />
        <GradientStat title="Requests Sent" value={c.sentRequests ?? 0}
          sub="Requests you sent to task owners" icon={Send} gradient="from-emerald-400 to-teal-600" />
        <GradientStat title="Incoming Requests" value={c.receivedRequests ?? 0}
          sub="Requests for your tasks" icon={Inbox} gradient="from-amber-400 to-orange-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat icon={TrendingUp} value={c.totalActions ?? 0} label="Total Actions" />
        <MiniStat icon={Search} value={c.searches ?? 0} label="Searches" />
        <MiniStat icon={MessageSquare} value={c.messages ?? 0} label="Messages" />
        <MiniStat icon={LogIn} value={c.logins ?? 0} label="Logins" />
      </div>

      {/* ====== Achievements ====== */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Award size={18} className="text-amber-500" /> Achievements</h2>
          <div className="text-xs text-slate-500">{achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <div key={a.id} className={`rounded-xl border p-4 flex items-start gap-3 ${
              a.unlocked
                ? "border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/15"
                : "border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-70"
            }`}>
              <div className={`h-10 w-10 grid place-items-center rounded-xl text-lg ${
                a.unlocked ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                           : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}>{a.emoji}</div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 dark:text-slate-100">{a.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== Reviews ====== */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Star size={18} className="text-amber-500 fill-amber-500" /> Reviews
          </h2>
          {reviews.count > 0 && (
            <div className="text-sm text-slate-500">
              <b className="text-slate-800 dark:text-white">{reviews.average}</b> avg · {reviews.count} total
            </div>
          )}
        </div>
        {reviews.list.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet — complete a task to earn your first review.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.list.map((r) => (
              <li key={r._id} className="flex gap-3">
                {r.fromUser?.profilePicture ? (
                  <img src={r.fromUser.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 grid place-items-center font-bold text-sm">
                    {(r.fromUser?.firstName?.[0] || "?") + (r.fromUser?.lastName?.[0] || "")}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {r.fromUser?.firstName} {r.fromUser?.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500 my-0.5">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} size={12} className={n <= r.rating ? "fill-amber-500" : "text-slate-300 dark:text-slate-600"} />
                    ))}
                    {r.task?.title && <span className="text-xs text-slate-500 ml-2">on "{r.task.title}"</span>}
                  </div>
                  {r.comment && <p className="text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ====== Recent activity ====== */}
      <section className="card p-6">
        <h2 className="font-bold text-brand-700 dark:text-brand-300 mb-4">Recent Activity</h2>
        {(!data?.recent || data.recent.length === 0) ? (
          <p className="text-sm text-slate-500">Nothing yet — your activity will appear here.</p>
        ) : (
          <ul className="space-y-3">
            {data.recent.map((n) => (
              <li key={n._id} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 grid place-items-center">
                  <Eye size={16} />
                </div>
                <div>
                  <div className="text-sm text-slate-700 dark:text-slate-200">{n.body}</div>
                  <div className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
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

function GradientStat({ title, value, sub, icon: Icon, gradient }) {
  return (
    <div className={`rounded-2xl p-6 text-white bg-gradient-to-br ${gradient} shadow-soft`}>
      <div className="flex items-start justify-between">
        <div className="font-semibold">{title}</div>
        <Icon size={20} />
      </div>
      <div className="text-5xl font-extrabold my-3">{value}</div>
      <div className="text-sm text-white/85">{sub}</div>
    </div>
  );
}
function MiniStat({ icon: Icon, value, label }) {
  return (
    <div className="card p-6 text-center">
      <Icon className="mx-auto text-brand-600 dark:text-brand-300" size={20} />
      <div className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
