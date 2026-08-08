import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, X, Send, Trash2, Bot, User as UserIcon, Minimize2, HelpCircle, GripVertical, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  // Dragging & Corner-docking states
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const buttonRef = useRef(null);
  const idleTimerRef = useRef(null);

  const dragRef = useRef({
    isDown: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  // Clamp position within screen viewport
  const clampPosition = useCallback((x, y, btnW = 150, btnH = 48) => {
    if (typeof window === "undefined") return { x, y };
    const pad = 12;
    const maxX = Math.max(pad, window.innerWidth - btnW - pad);
    const maxY = Math.max(pad, window.innerHeight - btnH - pad);
    return {
      x: Math.min(Math.max(pad, x), maxX),
      y: Math.min(Math.max(pad, y), maxY),
    };
  }, []);

  // Initialize position on mount (Default: bottom-right corner)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const defaultX = Math.max(12, window.innerWidth - 170);
    const defaultY = Math.max(12, window.innerHeight - 110);

    const saved = localStorage.getItem("hirehelper_assistant_pos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clampPosition(parsed.x, parsed.y));
          return;
        }
      } catch {}
    }
    setPosition(clampPosition(defaultX, defaultY));
  }, [clampPosition]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      const btnW = rect?.width || 150;
      const btnH = rect?.height || 48;
      setPosition((prev) => clampPosition(prev.x, prev.y, btnW, btnH));
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [clampPosition]);

  // Auto-dock idle timer (Auto-hide into corner edge after 3.5s of inactivity)
  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!isDragging && !open) {
        setIsDocked(true);
      }
    }, 3500);
  }, [isDragging, open]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setIsDocked(false);
    startIdleTimer();
  }, [startIdleTimer]);

  useEffect(() => {
    if (!open && !isDragging && !isHovered) {
      startIdleTimer();
    } else {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setIsDocked(false);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [open, isDragging, isHovered, startIdleTimer]);

  // Load chat history when opened
  useEffect(() => {
    if (!open || !user) return;
    api.get("/assistant/history").then(({ data }) => {
      if ((data.messages || []).length === 0) {
        setMsgs([
          {
            _id: "welcome",
            role: "assistant",
            text: `Hi ${user.firstName || "there"}! 👋 I'm **HireHelper Assistant**, your interactive AI guide.\n\nAsk me anything about posting tasks, mandatory fields, payment currencies, requests, chat, profile, or security rules!`,
          },
        ]);
      } else {
        setMsgs(data.messages);
      }
    }).catch(() => {});
  }, [open, user]);

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

  // Pointer Down Drag Handler
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    const rect = buttonRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : position.x;
    const currentY = rect ? rect.top : position.y;

    dragRef.current = {
      isDown: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: currentX,
      origY: currentY,
    };

    try {
      if (e.target?.setPointerCapture && e.pointerId) {
        e.target.setPointerCapture(e.pointerId);
      }
    } catch {}

    const handlePointerMove = (moveEvent) => {
      if (!dragRef.current.isDown) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;

      if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
        setIsDocked(false);
      }

      if (dragRef.current.hasMoved) {
        const btnW = rect?.width || 150;
        const btnH = rect?.height || 48;
        const nextX = dragRef.current.origX + dx;
        const nextY = dragRef.current.origY + dy;
        setPosition(clampPosition(nextX, nextY, btnW, btnH));
      }
    };

    const handlePointerUp = (upEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      try {
        if (upEvent.target?.releasePointerCapture && upEvent.pointerId) {
          upEvent.target.releasePointerCapture(upEvent.pointerId);
        }
      } catch {}

      const hadMoved = dragRef.current.hasMoved;
      dragRef.current.isDown = false;
      setIsDragging(false);

      if (hadMoved) {
        const btnW = rect?.width || 150;
        const btnH = rect?.height || 48;
        const dx = upEvent.clientX - dragRef.current.startX;
        const dy = upEvent.clientY - dragRef.current.startY;
        const finalPos = clampPosition(dragRef.current.origX + dx, dragRef.current.origY + dy, btnW, btnH);
        setPosition(finalPos);
        try {
          localStorage.setItem("hirehelper_assistant_pos", JSON.stringify(finalPos));
        } catch {}
        startIdleTimer();
      } else {
        // Tap/click -> Pop up Assistant dialog
        setOpen(true);
        setIsDocked(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const resetPosition = (e) => {
    e.stopPropagation();
    const defaultX = Math.max(12, window.innerWidth - 170);
    const defaultY = Math.max(12, window.innerHeight - 110);
    const def = clampPosition(defaultX, defaultY);
    setPosition(def);
    try {
      localStorage.setItem("hirehelper_assistant_pos", JSON.stringify(def));
    } catch {}
    setIsDocked(false);
  };

  if (!user) return null;

  const isLeftHalf = typeof window !== "undefined" ? position.x < window.innerWidth / 2 : false;

  return (
    <>
      {/* Draggable & Auto-docking Floating Corner Trigger Handle */}
      {!open && (
        <div
          ref={buttonRef}
          onPointerDown={handlePointerDown}
          onMouseEnter={() => { setIsHovered(true); setIsDocked(false); }}
          onMouseLeave={() => { setIsHovered(false); resetIdleTimer(); }}
          style={{
            position: "fixed",
            left: isDocked ? (isLeftHalf ? "0px" : `${window.innerWidth}px`) : `${position.x}px`,
            top: `${position.y}px`,
            transform: isDocked
              ? isLeftHalf
                ? "translateX(calc(-100% + 28px))"
                : "translateX(-28px)"
              : "none",
            touchAction: "none",
          }}
          className={`z-40 h-11 sm:h-12 pl-2.5 pr-3.5 rounded-full
                     bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 text-white
                     flex items-center gap-2 select-none cursor-grab active:cursor-grabbing
                     transition-all duration-300 ease-out border-2 border-white/20 dark:border-slate-700/50 shadow-2xl
                     ${isDragging ? "scale-105 ring-2 ring-amber-400 !cursor-grabbing" : ""}
                     ${isDocked ? "opacity-90 hover:opacity-100 hover:scale-105" : ""}`}
          title={isDocked ? "Click to pop up HireHelper Assistant" : "Drag anywhere • Click to open Assistant"}
          role="button"
          tabIndex={0}
          aria-label="Open HireHelper Assistant"
        >
          {/* Peeking Arrow Indicator when docked */}
          {isDocked && isLeftHalf && (
            <ChevronRight size={14} className="text-amber-300 animate-pulse -mr-1" />
          )}

          <GripVertical size={14} className="opacity-60 shrink-0 -mr-0.5" />

          <div className="relative shrink-0">
            <Sparkles size={18} className="animate-pulse text-amber-300" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>

          <div className="text-left leading-tight whitespace-nowrap">
            <div className="text-xs sm:text-sm font-extrabold tracking-wide">Assistant</div>
          </div>

          {isHovered && !isDragging && !isDocked && (
            <button
              type="button"
              onClick={resetPosition}
              className="ml-0.5 p-1 rounded-full hover:bg-white/20 transition text-white/80 hover:text-white"
              title="Reset position to bottom-right corner"
            >
              <RotateCcw size={11} />
            </button>
          )}

          {isDocked && !isLeftHalf && (
            <ChevronLeft size={14} className="text-amber-300 animate-pulse -ml-1" />
          )}
        </div>
      )}

      {/* Expanded Floating Assistant Dialog */}
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
                onClick={() => setOpen(false)}
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
