import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Star, GripVertical, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// === FeedbackWidget ===
// Draggable floating "Send feedback" bubble — users can move and place it
// anywhere on the screen. Remembers custom position in localStorage.
export default function FeedbackWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);

  // Position state (clamped to screen viewport)
  const [position, setPosition] = useState({ x: 24, y: 550 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);
  const dragRef = useRef({
    isDown: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    origX: 24,
    origY: 550,
  });

  // Clamp position to viewport bounds
  const clampPosition = useCallback((x, y, btnW = 120, btnH = 44) => {
    if (typeof window === "undefined") return { x, y };
    const pad = 12;
    const maxX = Math.max(pad, window.innerWidth - btnW - pad);
    const maxY = Math.max(pad, window.innerHeight - btnH - pad);
    return {
      x: Math.min(Math.max(pad, x), maxX),
      y: Math.min(Math.max(pad, y), maxY),
    };
  }, []);

  // Initialize position on mount from localStorage or default to bottom-left
  useEffect(() => {
    if (typeof window === "undefined") return;
    const defaultY = Math.max(20, window.innerHeight - 100);
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
    setPosition(clampPosition(24, defaultY));
  }, [clampPosition]);

  // Keep button inside screen on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition]);

  // Handle pointer down (mouse or touch)
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

    // Global listeners for smooth dragging outside button boundaries
    const handlePointerMove = (moveEvent) => {
      if (!dragRef.current.isDown) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;

      if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
      }

      if (dragRef.current.hasMoved) {
        const btnW = rect?.width || 120;
        const btnH = rect?.height || 44;
        const nextX = dragRef.current.origX + dx;
        const nextY = dragRef.current.origY + dy;
        const clamped = clampPosition(nextX, nextY, btnW, btnH);
        setPosition(clamped);
      }
    };

    const handlePointerUp = (upEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      const hadMoved = dragRef.current.hasMoved;
      dragRef.current.isDown = false;
      setIsDragging(false);

      if (hadMoved) {
        // Save repositioned coordinate
        const btnW = rect?.width || 120;
        const btnH = rect?.height || 44;
        const dx = upEvent.clientX - dragRef.current.startX;
        const dy = upEvent.clientY - dragRef.current.startY;
        const finalPos = clampPosition(dragRef.current.origX + dx, dragRef.current.origY + dy, btnW, btnH);
        setPosition(finalPos);
        try {
          localStorage.setItem("hirehelper_feedback_pos", JSON.stringify(finalPos));
        } catch {}
      } else {
        // Just a click -> open feedback dialog
        setOpen(true);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Reset to default bottom-left position
  const resetPosition = (e) => {
    e.stopPropagation();
    const defaultY = Math.max(20, window.innerHeight - 100);
    const def = clampPosition(24, defaultY);
    setPosition(def);
    try {
      localStorage.setItem("hirehelper_feedback_pos", JSON.stringify(def));
    } catch {}
    toast.success("Feedback button reset to default position");
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

  return (
    <>
      {/* Draggable Launcher Button */}
      <div
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: "none",
        }}
        className={`z-40 h-11 pl-2.5 pr-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900
                   flex items-center gap-2 select-none cursor-grab active:cursor-grabbing transition-shadow
                   ${isDragging ? "shadow-2xl scale-105 ring-2 ring-brand-500/80 !cursor-grabbing" : "shadow-xl hover:shadow-2xl hover:scale-[1.02]"}`}
        title="Drag anywhere to reposition • Click to send feedback"
        role="button"
        tabIndex={0}
        aria-label="Send feedback (draggable)"
      >
        <GripVertical size={14} className="opacity-50 -mr-0.5 shrink-0" />
        <MessageCircle size={16} className="shrink-0 text-brand-400 dark:text-brand-600" />
        <span className="text-sm font-semibold whitespace-nowrap">Feedback</span>

        {/* Small reset button shown on hover if user moved away from default */}
        {isHovered && !isDragging && (
          <button
            type="button"
            onClick={resetPosition}
            className="ml-1 p-1 rounded-full text-slate-400 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition"
            title="Reset position to default"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Send us feedback</div>
                <div className="text-xs text-slate-500">Bugs, ideas, complaints — we read everything.</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {["bug", "suggestion", "complaint", "praise", "other"].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={`text-xs py-2 rounded-lg capitalize border transition ${
                        type === t
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={140}
                  required
                  className="input h-10 mt-1"
                  placeholder="Short summary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={4000}
                  required
                  rows={5}
                  className="input mt-1"
                  placeholder="Tell us what happened, what you'd like, or what's broken…"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Rate your experience (optional)</label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n === rating ? 0 : n)}
                      className={`p-1 ${n <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"} hover:scale-110 transition`}
                    >
                      <Star size={22} fill={n <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                Cancel
              </button>
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

