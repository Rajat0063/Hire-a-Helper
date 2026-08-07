import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Mail, Phone, MapPin, Star, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Avatar } from "../../components/DashboardLayout";

// === Public Profile ===
// Backend gates contact info + `canReview` on whether the two users have an
// accepted/completed request between them. When eligible, this page renders
// a rating form so either party can submit a review.
export default function PublicProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [taskId, setTaskId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/users/${id}/public`).then(({ data }) => {
    setData(data);
    setTaskId(data?.reviewable?.[0]?.taskId || "");
  });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!data) return <p className="text-slate-500">Loading…</p>;
  const u = data.user;
  const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();

  const submitReview = async (e) => {
    e.preventDefault();
    if (!taskId) return;
    setBusy(true);
    try {
      await api.post("/reviews", { taskId, toUserId: u.id, rating, comment });
      toast.success("Review submitted");
      setComment(""); setRating(5);
      await load();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ===== Redesigned profile hero ===== */}
      <div className="card overflow-hidden">
        <div className="relative h-56 sm:h-72 bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900">
          {u.coverImage && <img src={u.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        <div className="px-6 sm:px-10 pb-6 -mt-16 sm:-mt-20 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="rounded-full ring-4 ring-white dark:ring-slate-900 shadow-xl w-fit">
              <Avatar src={u.profilePicture} initials={initials} size={128} />
            </div>
            <div className="flex-1 min-w-0 sm:pb-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {u.firstName} {u.lastName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 chip bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {data.stats.rating} <span className="opacity-70">({data.stats.reviewCount})</span>
                </span>
                <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Helped {data.stats.helped}
                </span>
                <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                  Posted {data.stats.posted}
                </span>
                {u.phoneVerified && (
                  <span className="chip bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"><ShieldCheck size={12}/> Verified</span>
                )}
              </div>
              {u.bio && <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 max-w-2xl">{u.bio}</p>}
              {u.address && (
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1"><MapPin size={12}/> {u.address}</div>
              )}
            </div>
          </div>

          {/* Contact card — gated by request acceptance */}
          <div className="mt-6 rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-800/40">
            {data.connected ? (
              <div className="flex flex-wrap gap-4 text-sm">
                {u.email && <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><Mail size={14} className="text-brand-600"/> {u.email}</span>}
                {u.phone && <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><Phone size={14} className="text-brand-600"/> {u.phone}</span>}
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-400"/>
                Contact details are hidden for privacy — they unlock once the request is accepted. Reviews & comments below are always public.
              </div>
            )}
          </div>
        </div>
      </div>

      {data.canReview && (
        <form onSubmit={submitReview} className="card p-5 space-y-3">
          <h2 className="font-bold text-slate-800 dark:text-white">Leave a review</h2>
          <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            {data.reviewable.map((r) => <option key={r.taskId} value={r.taskId}>{r.title}</option>)}
          </select>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)}>
                <Star size={22} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
              </button>
            ))}
          </div>
          <textarea className="input" rows={3} placeholder="Share your experience…"
            value={comment} onChange={(e) => setComment(e.target.value)} />
          <button disabled={busy} className="btn-primary">{busy ? "Submitting…" : "Submit review"}</button>
        </form>
      )}

      <div className="card p-5">
        <h2 className="font-bold text-slate-800 dark:text-white mb-3">Reviews & Comments</h2>
        {data.reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.reviews.map((r) => (
              <li key={r._id} className="border-t border-slate-100 dark:border-slate-800 pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <Avatar src={r.fromUser?.profilePicture}
                    initials={`${r.fromUser?.firstName?.[0] || ""}${r.fromUser?.lastName?.[0] || ""}`.toUpperCase()} size={28} />
                  <span className="font-semibold text-sm text-slate-800 dark:text-white">
                    {r.fromUser?.firstName} {r.fromUser?.lastName}
                  </span>
                  <span className="ml-auto text-amber-500 text-sm flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="fill-amber-400" />)}
                  </span>
                </div>
                {r.task && <div className="text-xs text-slate-400 mt-1">on “{r.task.title}”</div>}
                {r.comment && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
