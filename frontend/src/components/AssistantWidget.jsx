import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Trash2, Bot, User as UserIcon, ChevronDown, Minimize2, HelpCircle } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// Quick suggestion chips for rapid answers
const QUICK_SUGGESTIONS = [
  "How do I post a task?",
  "What fields are mandatory?",
  "How do payments & INR work?",
  "Check my request status",
  "How to change password?",
  "How do I report or block a user?",
];

export default function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if ((!open && !minimized) || !user) return;
    api.get("/assistant/history").then(({ data }) => {
      if ((data.messages || []).length === 0) {
        setMsgs([
          {
            _id: "welcome",
            role: "assistant",
            text: `Hi ${user.firstName || "there"}! 👋 I'm **HireHelper Assistant**, your interactive app guide.\n\nAsk me anything about posting tasks, mandatory fields, payment currencies, requests, chat, profile, or security rules!`,
          },
        ]);
      } else {
        setMsgs(data.messages);
      }
    }).catch(() => {});
  }, [open, minimized, user]);

  useEffect(() => {
    if (listRef.current && open) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [msgs, open, sending]);

  const sendText = async (inputStr) => {
    const t = (inputStr || text).trim();
    if (!t || sending) return;
    setSending(true);
    setMsgs((p) => [...p, { _id: `tmp-${Date.now()}`, role: "user", text: t }]);
    if (!inputStr) setText("");
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
    if (!confirm("Clear conversation history?")) return;
    await api.delete("/assistant/history").catch(() => {});
    setMsgs([]);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Corner Peeking/Launcher Badge */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 group animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => { setOpen(true); setMinimized(false); }}
            className="h-12 sm:h-14 pl-3.5 pr-4 sm:pr-5 rounded-full shadow-2xl
                       bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 text-white
                       flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all duration-200
                       border-2 border-white/20 dark:border-slate-700/50 backdrop-blur-md"
            title="Open HireHelper AI Assistant"
            aria-label="Open assistant"
          >
            <div className="relative">
              <Sparkles size={20} className="animate-pulse text-amber-300" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs sm:text-sm font-extrabold tracking-wide">Assistant</div>
              <div className="text-[10px] text-brand-100 opacity-90 hidden sm:block">Ask anything</div>
            </div>
          </button>
        </div>
      )}

      {/* Expanded Floating Dialog */}
      {open && (
        <div className="fixed z-50 inset-x-2 bottom-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px]
                        max-h-[85vh] h-[540px] flex flex-col rounded-3xl overflow-hidden
                        bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800
                        shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 text-white shrink-0">
            <div className="h-9 w-9 rounded-2xl bg-white/20 grid place-items-center shadow-inner">
              <Bot size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm sm:text-base leading-none">HireHelper Assistant</div>
              <div className="text-[11px] text-brand-100 opacity-90 truncate mt-0.5">Instant App Knowledge & Guidance</div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clear}
                title="Clear chat history"
                className="p-1.5 rounded-xl hover:bg-white/15 transition text-white/80 hover:text-white"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => { setOpen(false); setMinimized(true); }}
                title="Minimize / Dock to corner"
                className="p-1.5 rounded-xl hover:bg-white/15 transition text-white/80 hover:text-white"
              >
                <Minimize2 size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="p-1.5 rounded-xl hover:bg-white/15 transition text-white/80 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 dark:bg-slate-950">
            {msgs.map((m) => (
              <div key={m._id} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-7 w-7 rounded-full grid place-items-center shrink-0 shadow-xs ${
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-300/50 dark:border-slate-700"
                }`}>
                  {m.role === "user" ? <UserIcon size={13} /> : <Bot size={13} />}
                </div>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs
                  ${m.role === "user"
                    ? "bg-brand-600 text-white rounded-tr-xs font-medium"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs"}`}>
                  {formatMarkdown(m.text)}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 grid place-items-center"><Bot size={13} /></div>
                <div className="px-3.5 py-2.5 rounded-2xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="inline-flex gap-1">
                    <Dot /><Dot delay="150ms" /><Dot delay="300ms" />
                  </span>
                </div>
              </div>
            )}

            {/* Quick Suggestions */}
            {msgs.length <= 2 && !sending && (
              <div className="pt-2 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                  <HelpCircle size={12} /> Suggested Topics:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendText(q)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-brand-700 dark:text-brand-300 font-medium hover:bg-brand-50 dark:hover:bg-brand-900/30 transition text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); sendText(); }}
            className="border-t border-slate-200/80 dark:border-slate-800 p-2.5 flex gap-2 bg-white dark:bg-slate-900 shrink-0">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask anything about Hire-a-Helper…"
              className="input h-10 text-xs sm:text-sm flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="btn-primary h-10 w-10 !p-0 grid place-items-center disabled:opacity-40 shrink-0"
              title="Send message"
            >
              <Send size={15} />
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

// Markdown formatting helper supporting bold, bullets, and linebreaks
function formatMarkdown(text) {
  if (!text) return null;
  const lines = String(text).split("\n");
  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith("• ");
    const content = isBullet ? line.trim().slice(2) : line;

    // Parse **bold** and *italic*
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const parsed = parts.map((p, i) => {
      if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i} className="font-bold text-slate-900 dark:text-white">{p.slice(2, -2)}</strong>;
      if (/^\*[^*]+\*$/.test(p)) return <em key={i} className="italic text-slate-600 dark:text-slate-300">{p.slice(1, -1)}</em>;
      return p;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-1.5 my-0.5 pl-1">
          <span className="text-brand-500 font-bold shrink-0">•</span>
          <div>{parsed}</div>
        </div>
      );
    }

    return (
      <p key={lineIdx} className={lineIdx > 0 && line.trim() === "" ? "h-2" : ""}>
        {parsed}
      </p>
    );
  });
}
