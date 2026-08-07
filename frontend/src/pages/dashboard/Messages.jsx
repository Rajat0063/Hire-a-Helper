import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Send, MessageSquare, MoreVertical, Trash2, Ban, User as UserIcon, Unlock, ShieldAlert, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../services/socket";
import { Avatar } from "../../components/Avatar";

// === Messages ===
// Two-pane chat. Conversations are keyed on the OTHER participant so multiple
// tasks between the same two people collapse into a single thread. A right-side
// header shows the other user with actions: view profile, block, delete chat.
// Enhanced with responsive mobile view switching and smooth skeleton loading.
export default function Messages() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [convos, setConvos] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [active, setActive] = useState(params.get("c") || null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef(null);

  const loadConvos = () => {
    return api.get("/messages/conversations")
      .then(({ data }) => setConvos(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoadingConvos(false));
  };

  useEffect(() => { loadConvos(); }, []);
  useEffect(() => {
    if (!active) { setMsgs([]); return; }
    setLoadingMsgs(true);
    api.get(`/messages/${active}`)
      .then(({ data }) => setMsgs(data.messages || []))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
    setParams((p) => { const n = new URLSearchParams(p); n.set("c", active); return n; }, { replace: true });
  }, [active]); // eslint-disable-line

  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const onNew = ({ conversationId, message }) => {
      loadConvos();
      if (String(conversationId) === String(active)) setMsgs((p) => [...p, message]);
    };
    s.on("message:new", onNew);
    const onBlock = () => loadConvos();
    s.on("chat:block-updated", onBlock);
    return () => { s.off("message:new", onNew); s.off("chat:block-updated", onBlock); };
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !active) return;
    try {
      const { data } = await api.post(`/messages/${active}`, { text: t });
      setMsgs((p) => [...p, data.message]);
      setText("");
      loadConvos();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to send"); }
  };

  const other = (c) => c?.participants?.find((p) => String(p._id) !== String(user?.id));
  const activeConvo = convos.find((c) => String(c._id) === String(active));
  const activeOther = other(activeConvo);
  const chatBlocked = activeConvo?.isBlocked;

  const deleteChat = async () => {
    if (!active) return;
    if (!confirm("Delete this conversation? Messages will be permanently removed.")) return;
    try {
      await api.delete(`/messages/${active}`);
      setActive(null); setMenuOpen(false);
      await loadConvos();
      toast.success("Conversation deleted");
    } catch { toast.error("Failed to delete"); }
  };
  const blockUser = async () => {
    if (!activeOther) return;
    if (!confirm(`Block ${activeOther.firstName}? You won't see their messages.`)) return;
    try {
      await api.post(`/messages/block/${activeOther._id}`);
      setMenuOpen(false);
      await loadConvos();
      toast.success("User blocked");
    } catch { toast.error("Failed to block"); }
  };
  const unblockUser = async () => {
    if (!activeOther) return;
    try {
      await api.delete(`/messages/block/${activeOther._id}`);
      setMenuOpen(false);
      await loadConvos();
      toast.success("User unblocked");
    } catch { toast.error("Failed to unblock"); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-10rem)]">
      <div className="mb-3 sm:mb-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Messages</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Chat with helpers for your accepted tasks</p>
        </div>
      </div>

      <div className="card overflow-hidden grid lg:grid-cols-[320px_1fr] flex-1 min-h-0 border border-slate-200/80 dark:border-slate-800">
        {/* conversation list — hidden on mobile when viewing active chat */}
        <aside className={`${active ? "hidden lg:block" : "block"} border-r border-slate-100 dark:border-slate-800 overflow-y-auto min-h-0 flex flex-col`}>
          <div className="h-14 sm:h-16 px-4 flex items-center justify-between font-bold border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 text-sm sm:text-base">
            <span>Conversations</span>
            {!loadingConvos && convos.length > 0 && (
              <span className="text-xs text-slate-400 font-normal">{convos.length}</span>
            )}
          </div>

          {loadingConvos ? (
            <div className="p-3 space-y-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={`convo-skel-${i}`} className="flex items-center gap-3 p-2 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : convos.length === 0 ? (
            <div className="p-6 text-xs sm:text-sm text-slate-500 text-center my-auto">
              No conversations yet.<br />They appear when a task request is accepted.
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {convos.map((c) => {
                const o = other(c);
                const initials = `${o?.firstName?.[0] || ""}${o?.lastName?.[0] || ""}`.toUpperCase();
                return (
                  <button key={c._id} onClick={() => setActive(c._id)}
                    className={`w-full flex items-start gap-3 p-3.5 text-left transition ${
                      String(active) === String(c._id) ? "bg-brand-50/70 dark:bg-brand-900/25 border-l-4 border-brand-600" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}>
                    <Avatar src={o?.profilePicture} initials={initials} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white truncate flex items-center justify-between gap-1">
                        <span className="truncate">{o?.firstName} {o?.lastName}</span>
                        {c.isBlocked && <span className="chip bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-[10px] py-0 px-1.5">Blocked</span>}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {c.isBlocked ? "Messaging paused until unblocked" : (c.lastMessage || "Start the conversation")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* chat pane — active conversation or empty state */}
        <section className={`${!active ? "hidden lg:flex" : "flex"} flex-col min-h-0 bg-slate-50/30 dark:bg-slate-950/30`}>
          {!active ? (
            <div className="flex-1 grid place-items-center text-center text-slate-500 p-6">
              <div className="space-y-3">
                <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300">
                  <MessageSquare size={24} />
                </div>
                <div className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-200">Select a conversation</div>
                <div className="text-xs sm:text-sm max-w-xs text-slate-400">Choose a chat from the list to start messaging with task helpers</div>
              </div>
            </div>
          ) : (
            <>
              {/* === Chat header with profile + actions menu + mobile back === */}
              <div className="h-14 sm:h-16 px-3 sm:px-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 sm:gap-3 shrink-0 bg-white dark:bg-slate-900 z-10">
                {/* Mobile Back Button */}
                <button onClick={() => setActive(null)} className="lg:hidden btn-ghost p-2 -ml-1 text-slate-600 dark:text-slate-300" aria-label="Back to conversations">
                  <ArrowLeft size={18} />
                </button>

                <button onClick={() => activeOther && nav(`/dashboard/profile/${activeOther._id}`)}
                  className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left hover:opacity-90 transition">
                  <Avatar src={activeOther?.profilePicture}
                    initials={`${activeOther?.firstName?.[0] || ""}${activeOther?.lastName?.[0] || ""}`.toUpperCase()}
                    size={38} />
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {activeOther?.firstName} {activeOther?.lastName}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-400 truncate">Tap to view public profile & reviews</div>
                  </div>
                </button>

                <div className="relative">
                  <button onClick={() => setMenuOpen((v) => !v)} className="btn-ghost p-2" aria-label="More options">
                    <MoreVertical size={18} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-11 w-52 card p-1.5 z-20 shadow-xl border border-slate-200/80 dark:border-slate-800">
                      <button onClick={() => { setMenuOpen(false); nav(`/dashboard/profile/${activeOther?._id}`); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200">
                        <UserIcon size={14} /> View profile
                      </button>
                      {activeConvo?.blockedByMe ? (
                        <button onClick={unblockUser}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-emerald-600">
                          <Unlock size={14} /> Unblock user
                        </button>
                      ) : (
                        <button onClick={blockUser}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-amber-600">
                          <Ban size={14} /> Block user
                        </button>
                      )}
                      <button onClick={deleteChat}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-rose-600">
                        <Trash2 size={14} /> Delete chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* messages */}
              {chatBlocked && (
                <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/40 text-xs sm:text-sm text-rose-700 dark:text-rose-200 flex items-center gap-2">
                  <ShieldAlert size={15} className="shrink-0" />
                  <span>{activeConvo.blockedByMe ? "You blocked this user. Unblock to continue messaging." : "This user has blocked messaging in this chat."}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {loadingMsgs ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="flex justify-start">
                      <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl rounded-bl-sm" />
                    </div>
                    <div className="flex justify-end">
                      <div className="h-12 w-60 bg-slate-200 dark:bg-slate-800 rounded-2xl rounded-br-sm" />
                    </div>
                    <div className="flex justify-start">
                      <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-2xl rounded-bl-sm" />
                    </div>
                  </div>
                ) : msgs.length === 0 ? (
                  <div className="h-full grid place-items-center text-center text-xs sm:text-sm text-slate-400">
                    No messages yet. Send a message below to start the conversation!
                  </div>
                ) : (
                  msgs.map((m) => {
                    const mine = String(m.sender) === String(user?.id);
                    return (
                      <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm ${
                          mine ? "bg-brand-600 text-white rounded-br-sm shadow-sm"
                               : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700/60"
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                          <div className={`text-[10px] mt-1 text-right ${mine ? "text-white/70" : "text-slate-400"}`}>
                            {new Date(m.createdAt).toLocaleString([], { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="p-2.5 sm:p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0 bg-white dark:bg-slate-900">
                <input className="input text-xs sm:text-sm" disabled={chatBlocked}
                  placeholder={chatBlocked ? "Messaging is blocked" : "Type a message…"}
                  value={text} onChange={(e) => setText(e.target.value)} />
                <button disabled={chatBlocked || !text.trim()}
                  className="btn-primary py-2 px-3 sm:px-4 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
