import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Send, MessageSquare, MoreVertical, Trash2, Ban, User as UserIcon, Unlock, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../services/socket";
import { Avatar } from "../../components/DashboardLayout";

// === Messages ===
// Two-pane chat. Conversations are keyed on the OTHER participant so multiple
// tasks between the same two people collapse into a single thread. A right-side
// header shows the other user with actions: view profile, block, delete chat.
export default function Messages() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(params.get("c") || null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef(null);

  const loadConvos = () =>
    api.get("/messages/conversations").then(({ data }) => setConvos(data.conversations || []));

  useEffect(() => { loadConvos(); }, []);
  useEffect(() => {
    if (!active) { setMsgs([]); return; }
    api.get(`/messages/${active}`).then(({ data }) => setMsgs(data.messages || []));
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
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Messages</h1>
        <p className="text-slate-500 dark:text-slate-400">Chat with helpers for your accepted tasks</p>
      </div>

      <div className="card overflow-hidden grid lg:grid-cols-[320px_1fr] flex-1 min-h-0">
        {/* conversation list */}
        <aside className="border-r border-slate-100 dark:border-slate-800 overflow-y-auto min-h-0">
          <div className="h-16 px-4 flex items-center font-bold border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white sticky top-0 bg-white dark:bg-slate-900 z-10">
            Conversations
          </div>
          {convos.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 text-center">
              No conversations yet.<br />They appear when a task request is accepted.
            </div>
          ) : convos.map((c) => {
            const o = other(c);
            const initials = `${o?.firstName?.[0] || ""}${o?.lastName?.[0] || ""}`.toUpperCase();
            return (
              <button key={c._id} onClick={() => setActive(c._id)}
                className={`w-full flex items-start gap-3 p-3 text-left border-b border-slate-50 dark:border-slate-800/60 ${
                  String(active) === String(c._id) ? "bg-brand-50/60 dark:bg-brand-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}>
                <Avatar src={o?.profilePicture} initials={initials} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate flex items-center gap-2">{o?.firstName} {o?.lastName} {c.isBlocked && <span className="chip bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Blocked</span>}</div>
                  <div className="text-xs text-slate-400 truncate">{c.isBlocked ? "Messaging paused until unblocked" : (c.lastMessage || "Start the conversation")}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* chat pane */}
        <section className="flex flex-col min-h-0">
          {!active ? (
            <div className="flex-1 grid place-items-center text-center text-slate-500">
              <div>
                <div className="mx-auto h-14 w-14 grid place-items-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 mb-3">
                  <MessageSquare size={22} />
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-200">Select a conversation</div>
                <div className="text-sm">Choose a chat from the list to start messaging</div>
              </div>
            </div>
          ) : (
            <>
              {/* === Chat header with profile + actions menu === */}
              <div className="h-16 px-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
                <button onClick={() => activeOther && nav(`/dashboard/profile/${activeOther._id}`)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-90">
                  <Avatar src={activeOther?.profilePicture}
                    initials={`${activeOther?.firstName?.[0] || ""}${activeOther?.lastName?.[0] || ""}`.toUpperCase()}
                    size={40} />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {activeOther?.firstName} {activeOther?.lastName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">Tap to view profile, reviews & rating</div>
                  </div>
                </button>
                <div className="relative">
                  <button onClick={() => setMenuOpen((v) => !v)} className="btn-ghost p-2" aria-label="More">
                    <MoreVertical size={18} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-11 w-56 card p-1 z-20">
                      <button onClick={() => { setMenuOpen(false); nav(`/dashboard/profile/${activeOther?._id}`); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                        <UserIcon size={14} /> View profile
                      </button>
                      {activeConvo?.blockedByMe ? (
                        <button onClick={unblockUser}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-emerald-600">
                          <Unlock size={14} /> Unblock user
                        </button>
                      ) : (
                        <button onClick={blockUser}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-amber-600">
                          <Ban size={14} /> Block user
                        </button>
                      )}
                      <button onClick={deleteChat}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-rose-600">
                        <Trash2 size={14} /> Delete chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* messages */}
              {chatBlocked && (
                <div className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/40 text-sm text-rose-700 dark:text-rose-200 flex items-center gap-2">
                  <ShieldAlert size={16} /> {activeConvo.blockedByMe ? "You blocked this user. Unblock to continue messaging." : "This user has blocked messaging in this chat."}
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                {msgs.map((m) => {
                  const mine = String(m.sender) === String(user?.id);
                  return (
                    <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        mine ? "bg-brand-600 text-white rounded-br-sm"
                             : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm"
                      }`}>
                        {m.text}
                        <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-slate-400"}`}>
                          {new Date(m.createdAt).toLocaleString([], { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0">
                <input className="input" disabled={chatBlocked} placeholder={chatBlocked ? "Messaging is blocked" : "Type a message…"} value={text} onChange={(e) => setText(e.target.value)} />
                <button disabled={chatBlocked} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"><Send size={16} /></button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
