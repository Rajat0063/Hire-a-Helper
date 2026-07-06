import { useState } from "react";
import { MessageCircle, X, Send, Star } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// === FeedbackWidget ===
// Small floating "Send feedback" bubble — bottom-left so it doesn't clash
// with the AI assistant on the right. Stores to /api/feedback which fans
// notifications out to every admin.
export default function FeedbackWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setBusy(true);
    try {
      await api.post("/feedback", { type, subject, message, rating: rating || null });
      toast.success("Thanks — feedback sent to the team!");
      setSubject(""); setMessage(""); setRating(0); setType("suggestion");
      setOpen(false);
    } catch {
      toast.error("Couldn't send feedback. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-6 z-40 h-11 pl-3 pr-4 rounded-full shadow-xl bg-slate-900 dark:bg-white
                   text-white dark:text-slate-900 flex items-center gap-2 hover:scale-105 transition text-sm font-semibold"
        title="Send feedback"
      >
        <MessageCircle size={16} /> Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Send us feedback</div>
                <div className="text-xs text-slate-500">Bugs, ideas, complaints — we read everything.</div>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {["bug", "suggestion", "complaint", "praise", "other"].map((t) => (
                    <button type="button" key={t} onClick={() => setType(t)}
                      className={`text-xs py-2 rounded-lg capitalize border transition ${
                        type === t
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)}
                  maxLength={140} required className="input h-10 mt-1" placeholder="Short summary" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  maxLength={4000} required rows={5} className="input mt-1"
                  placeholder="Tell us what happened, what you'd like, or what's broken…" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Rate your experience (optional)</label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)}
                      className={`p-1 ${n <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"} hover:scale-110 transition`}>
                      <Star size={22} fill={n <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={busy} className="btn-primary">
                <Send size={14} /> {busy ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
