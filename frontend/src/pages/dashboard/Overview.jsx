import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Send, Inbox, TrendingUp, Search, MessageSquare, LogIn, Eye } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// === Overview ===
// Per-user dashboard home. Every signed-in user sees their own counts,
// fetched from /api/users/overview.
export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/users/overview")
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, []);

  const c = data?.counts || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Here's your dashboard overview</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <GradientStat title="Your Tasks" value={c.myTasks ?? 0}
          sub="Tasks you posted on Hire-a-Helper" icon={ClipboardList}
          gradient="from-brand-500 to-brand-700" />
        <GradientStat title="Requests Sent" value={c.sentRequests ?? 0}
          sub="Requests you sent to task owners" icon={Send}
          gradient="from-emerald-400 to-teal-600" />
        <GradientStat title="Incoming Requests" value={c.receivedRequests ?? 0}
          sub="Requests for your tasks" icon={Inbox}
          gradient="from-amber-400 to-orange-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat icon={TrendingUp} value={c.totalActions ?? 0} label="Total Actions" />
        <MiniStat icon={Search} value={c.searches ?? 0} label="Searches" />
        <MiniStat icon={MessageSquare} value={c.messages ?? 0} label="Messages" />
        <MiniStat icon={LogIn} value={c.logins ?? 0} label="Logins" />
      </div>

      <section className="card p-6">
        <h2 className="font-bold text-brand-700 dark:text-brand-300">Your Requests</h2>
        <p className="text-slate-500 text-sm mt-1">
          {c.sentRequests ? `${c.sentRequests} request(s) sent` : "No requests sent"}
        </p>
        <Link to="/dashboard/my-requests" className="inline-block mt-3 text-sm font-semibold text-brand-700 dark:text-brand-300">
          View all →
        </Link>
      </section>

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


