import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Mail, Phone, MapPin, Star, ShieldCheck, ArrowLeft, MessageSquare, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Avatar } from "../../components/Avatar";

// === PublicProfile Skeleton ===
function PublicProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="card overflow-hidden">
        <div className="h-44 sm:h-64 bg-slate-200 dark:bg-slate-800" />
        <div className="px-5 sm:px-8 pb-6 -mt-14 sm:-mt-16 relative space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900 shrink-0" />
            <div className="flex-1 space-y-2 pb-2">
              <div className="h-7 w-48 sm:w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
          </div>
          <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </div>
      </div>

      <div className="card p-5 sm:p-6 space-y-4">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={`rev-skel-${i}`} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  if (!data) return <PublicProfileSkeleton />;
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
      <div className="card overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="relative h-44 sm:h-64 lg:h-72 bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900">
          {u.coverImage && <img src={u.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="Cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        <div className="px-4 sm:px-8 pb-6 -mt-14 sm:-mt-20 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
            <div className="rounded-full ring-4 ring-white dark:ring-slate-900 shadow-xl w-fit shrink-0">
              <Avatar src={u.profilePicture} initials={initials} size={112} />
            </div>
            <div className="flex-1 min-w-0 sm:pb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {u.firstName} {u.lastName}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1 chip bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold py-1 px-2.5">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {data.stats.rating} <span className="opacity-70">({data.stats.reviewCount})</span>
                </span>
                <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 py-1 px-2.5 font-medium">
                  Helped {data.stats.helped}
                </span>
                <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200 py-1 px-2.5 font-medium">
                  Posted {data.stats.posted}
                </span>
                {u.phoneVerified && (
                  <span className="chip bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 py-1 px-2.5 font-medium"><ShieldCheck size={13}/> Verified</span>
                )}
              </div>
              {u.bio && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 max-w-2xl leading-relaxed">{u.bio}</p>}
              {u.address && (
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1"><MapPin size={13} className="text-slate-400 shrink-0"/> {u.address}</div>
              )}
            </div>
          </div>

          {/* Contact card — gated by request acceptance */}
          <div className="mt-5 rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/40">
            {data.connected ? (
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                {u.email && <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><Mail size={15} className="text-brand-600 shrink-0"/> {u.email}</span>}
                {u.phone && <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><Phone size={15} className="text-brand-600 shrink-0"/> {u.phone}</span>}
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-start sm:items-center gap-2">
                <ShieldCheck size={16} className="text-slate-400 shrink-0 mt-0.5 sm:mt-0"/>
                <span>Contact details are hidden for privacy — they unlock once a request is accepted. Reviews & community activity below are always public.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {data.canReview && (
        <form onSubmit={submitReview} className="card p-5 sm:p-6 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Leave a Review</h2>
            <p className="text-xs text-slate-500">Rate your experience working with {u.firstName}</p>
          </div>

          <div>
            <label className="label text-xs mb-1">Select Completed Task</label>
            <select className="input text-xs sm:text-sm" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              {data.reviewable.map((r) => <option key={r.taskId} value={r.taskId}>{r.title}</option>)}
            </select>
          </div>

          <div>
            <label className="label text-xs mb-1">Rating</label>
            <div className="flex gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} className="p-1 hover:scale-110 transition">
                  <Star size={24} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label text-xs mb-1">Review Comments</label>
            <textarea className="input text-xs sm:text-sm min-h-[90px]" rows={3} placeholder="Share your experience working on this task…"
              value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>

          <div className="flex justify-end">
            <button disabled={busy} className="btn-primary text-xs sm:text-sm py-2 px-5 w-full sm:w-auto">
              {busy ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </form>
      )}

      <div className="card p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800">
        <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-4">Reviews & Ratings</h2>
        {data.reviews.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-500 py-4 text-center">No reviews yet for this community member.</p>
        ) : (
          <ul className="space-y-3 sm:space-y-4">
            {data.reviews.map((r) => (
              <li key={r._id} className="p-3.5 sm:p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={r.fromUser?.profilePicture}
                      initials={`${r.fromUser?.firstName?.[0] || ""}${r.fromUser?.lastName?.[0] || ""}`.toUpperCase()} size={32} />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {r.fromUser?.firstName} {r.fromUser?.lastName}
                    </span>
                  </div>
                  <span className="text-amber-500 text-xs sm:text-sm flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={13} className="fill-amber-400" />)}
                  </span>
                </div>
                {r.task && <div className="text-[11px] sm:text-xs text-brand-600 dark:text-brand-400 font-medium">Task: “{r.task.title}”</div>}
                {r.comment && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
