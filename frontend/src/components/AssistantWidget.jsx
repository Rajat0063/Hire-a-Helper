import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Trash2, Bot, User as UserIcon } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// === AssistantWidget ===
// Floating "Ask HireHelper" chat bubble. Rule-based backend (see
// backend/src/controllers/assistantController.js) — every message is stored
// server-side so the conversation persists across reloads / devices.
export default function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open || !user) return;
    api.get("/assistant/history").then(({ data }) => {
      if ((data.messages || []).length === 0) {
        setMsgs([
          {
            _id: "welcome",
            role: "assistant",
            text: `Hi ${user.firstName || "there"}! 👋 I'm your Hire-a-Helper assistant. Ask me anything — posting tasks, requests, payments, messaging, profile, notifications…`,
          },
        ]);
      } else {
        setMsgs(data.messages);
      }
    }).catch(() => {});
  }, [open, user]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, open, sending]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    // optimistic
    setMsgs((p) => [...p, { _id: `tmp-${Date.now()}`, role: "user", text: t }]);
    setText("");
    try {
      const { data } = await api.post("/assistant/message", { text: t });
      setMsgs((p) => [...p.filter((m) => !String(m._id).startsWith("tmp-")), data.userMessage, data.reply]);
    } catch {
      setMsgs((p) => [...p, { _id: `err-${Date.now()}`, role: "assistant", text: "Sorry, I couldn't reach the server. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const clear = async () => {
    if (!confirm("Clear the whole conversation?")) return;
    await api.delete("/assistant/history").catch(() => {});
    setMsgs([]);
  };

  if (!user) return null;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl
                   bg-gradient-to-br from-brand-500 to-brand-700 text-white
                   grid place-items-center hover:scale-105 transition"
        title="Ask HireHelper AI"
        aria-label="Open assistant"
      >
        <Sparkles size={22} />
      </button>

      {open && (
        <div className="fixed z-50 inset-x-2 bottom-2 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[380px]
                        max-h-[80vh] flex flex-col rounded-2xl overflow-hidden
                        bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                        shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-800 text-white">
            <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center">
              <Bot size={16} />
            </div>
            <div className="flex-1">
              <div className="font-bold leading-none">HireHelper Assistant</div>
              <div className="text-[11px] opacity-80">Answers instantly · Always here to help</div>
            </div>
            <button onClick={clear} title="Clear chat" className="p-1.5 rounded-lg hover:bg-white/10"><Trash2 size={15} /></button>
            <button onClick={() => setOpen(false)} title="Close" className="p-1.5 rounded-lg hover:bg-white/10"><X size={16} /></button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
            {msgs.map((m) => (
              <div key={m._id} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-7 w-7 rounded-full grid place-items-center shrink-0 ${
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}>
                  {m.role === "user" ? <UserIcon size={13} /> : <Bot size={13} />}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed
                  ${m.role === "user"
                    ? "bg-brand-600 text-white rounded-tr-sm"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-sm"}`}>
                  {formatInline(m.text)}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 grid place-items-center"><Bot size={13} /></div>
                <div className="px-3 py-2 rounded-2xl text-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="inline-flex gap-1">
                    <Dot /><Dot delay="150ms" /><Dot delay="300ms" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-slate-100 dark:border-slate-800 p-2 flex gap-2 bg-white dark:bg-slate-900">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask me anything…"
              className="input h-11 flex-1"
              disabled={sending}
            />
            <button type="submit" disabled={!text.trim() || sending}
              className="btn-primary h-11 w-11 !p-0 grid place-items-center disabled:opacity-50">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

// Minimal markdown-lite: **bold** and *italic* + line breaks.
function formatInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  });
}
