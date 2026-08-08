import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Star, GripVertical, RotateCcw, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// === FeedbackWidget ===
// Draggable, corner-dockable, auto-hiding feedback widget.
// Can be dragged anywhere on screen. Auto-hides into screen edge/corner when idle.
// Tap/hover to reveal or click to pop up the feedback modal.
export default function FeedbackWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);

  // Position state (clamped to screen viewport)
  const [position, setPosition] = useState({ x: 16, y: 550 });
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
    origX: 16,
    origY: 550,
  });

  // Clamp position to viewport bounds
  const clampPosition = useCallback((x, y, btnW = 130, btnH = 44) => {
    if (typeof window === "undefined") return { x, y };
    const pad = 12;
    const maxX = Math.max(pad, window.innerWidth - btnW - pad);
    const maxY = Math.max(pad, window.innerHeight - btnH - pad);
    return {
      x: Math.min(Math.max(pad, x), maxX),
      y: Math.min(Math.max(pad, y), maxY),
    };
  }, []);

  // Initialize position on mount (Default: bottom-left corner)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const defaultY = Math.max(12, window.innerHeight - 110);
    const saved = localStorage.getItem("hirehelper_feedback_pos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clampPosition(parsed.x, parsed.y));
          return;
        }
      } catch {}
    }
    setPosition(clampPosition(16, defaultY));
  }, [clampPosition]);

  // Keep button inside screen on window resize
  useEffect(() => {
    const handleResize = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      const btnW = rect?.width || 130;
      const btnH = rect?.height || 44;
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
        const btnW = rect?.width || 130;
        const btnH = rect?.height || 44;
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
        const btnW = rect?.width || 130;
        const btnH = rect?.height || 44;
        const dx = upEvent.clientX - dragRef.current.startX;
        const dy = upEvent.clientY - dragRef.current.startY;
        const finalPos = clampPosition(dragRef.current.origX + dx, dragRef.current.origY + dy, btnW, btnH);
        setPosition(finalPos);
        try {
          localStorage.setItem("hirehelper_feedback_pos", JSON.stringify(finalPos));
        } catch {}
        startIdleTimer();
      } else {
        // Tap/click -> Pop up Feedback modal
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
    const defaultY = Math.max(12, window.innerHeight - 110);
    const def = clampPosition(16, defaultY);
    setPosition(def);
    try {
      localStorage.setItem("hirehelper_feedback_pos", JSON.stringify(def));
    } catch {}
    setIsDocked(false);
    toast.success("Feedback button reset to bottom-left corner");
  };

  if (!user) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setBusy(true);
    try {
      await api.post("/feedback", { type, subject, message, rating: rating || null });
      toast.success("Thanks — feedback sent to the team!");
      setSubject("");
      setMessage("");
      setRating(0);
      setType("suggestion");
      setOpen(false);
    } catch {
      toast.error("Couldn't send feedback. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const isLeftHalf = typeof window !== "undefined" ? position.x < window.innerWidth / 2 : true;

  return (
    <>
      {/* Draggable & Auto-docking Corner Handle */}
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
          className={`z-40 h-10 sm:h-11 pl-2 sm:pl-2.5 pr-3 sm:pr-4 rounded-full
                     bg-slate-900 dark:bg-white text-white dark:text-slate-900
                     flex items-center gap-1.5 sm:gap-2 select-none cursor-grab active:cursor-grabbing
                     transition-all duration-300 ease-out border border-slate-700/50 dark:border-slate-300/50 shadow-xl
                     ${isDragging ? "scale-105 ring-2 ring-brand-500/80 !cursor-grabbing shadow-2xl" : "hover:shadow-2xl"}
                     ${isDocked ? "opacity-90 hover:opacity-100 hover:scale-105" : ""}`}
          title={isDocked ? "Click to pop up Feedback form" : "Drag anywhere • Click to open Feedback"}
          role="button"
          tabIndex={0}
          aria-label="Send feedback (draggable corner handle)"
        >
          {/* Peeking Arrow Indicator when docked */}
          {isDocked && isLeftHalf && (
            <ChevronRight size={14} className="text-brand-400 dark:text-brand-600 animate-pulse -mr-1" />
          )}

          <GripVertical size={14} className="opacity-50 -mr-0.5 shrink-0" />
          <MessageCircle size={15} className="shrink-0 text-brand-400 dark:text-brand-600" />
          <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Feedback</span>

          {isHovered && !isDragging && !isDocked && (
            <button
              type="button"
              onClick={resetPosition}
              className="ml-0.5 p-1 rounded-full text-slate-400 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition"
              title="Reset position to bottom-left corner"
            >
              <RotateCcw size={11} />
            </button>
          )}

          {isDocked && !isLeftHalf && (
            <ChevronLeft size={14} className="text-brand-400 dark:text-brand-600 animate-pulse -ml-1" />
          )}
        </div>
      )}

      {/* Pop Up Modal Form */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <div className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">Send us Feedback</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Bugs, suggestions, or complaints — monitored live by admins.</div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                  title="Minimize / Close"
                  aria-label="Minimize form"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                  title="Close"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Feedback Type</label>
                <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {["bug", "suggestion", "complaint", "praise", "other"].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={`text-xs py-2 px-2 rounded-xl capitalize font-semibold border transition text-center truncate ${
                        type === t
                          ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={140}
                  required
                  className="input h-10 mt-1 w-full text-xs sm:text-sm"
                  placeholder="Short summary of what you're sharing"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={4000}
                  required
                  rows={4}
                  className="input mt-1 w-full text-xs sm:text-sm min-h-[90px] sm:min-h-[110px]"
                  placeholder="Tell us what happened, what you'd like to improve, or what feels broken…"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rate your experience <span className="font-normal lowercase text-slate-400">(optional)</span>
                </label>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n === rating ? 0 : n)}
                      className={`p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                        n <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"
                      }`}
                      aria-label={`Rate ${n} stars`}
                    >
                      <Star size={22} fill={n <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-xs text-slate-500 font-semibold ml-1">
                      {rating === 5 ? "Loved it!" : rating >= 4 ? "Great" : rating === 3 ? "Okay" : "Needs work"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-xs sm:text-sm py-2 px-4">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-primary text-xs sm:text-sm py-2 px-5 shadow-soft">
                <Send size={14} /> {busy ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
