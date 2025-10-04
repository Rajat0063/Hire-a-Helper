

import React, { useEffect, useState, useRef } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const socket = io(BACKEND_URL, { autoConnect: false });


const Messages = () => {
  const { taskId, userId } = useParams();
  const context = useOutletContext() || {};
  const user = context.user;
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState([]); // For sidebar
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const messagesEndRef = useRef(null);
  // Listen for chat notification events for this user
  useEffect(() => {
    if (!user || !user._id) return;
    socket.on(`chat-notification-${user._id}`, (data) => {
      setNotification(data?.message || "New message received!");
      // Optionally, you could also update conversations/messages here
    });
    return () => {
      socket.off(`chat-notification-${user._id}`);
    };
  }, [user]);

  // Fetch conversations for sidebar (all tasks with messages for this user)
  useEffect(() => {
    if (!user) return;
    axios.get(`${BACKEND_URL}/api/chat/conversations/${user._id}`)
      .then(res => setConversations(res.data))
      .catch(() => setConversations([]));
  }, [user]);

  // Fetch chat history for selected conversation
  useEffect(() => {
    if (!taskId || !userId) return;
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/chat/${taskId}/${userId}`)
      .then((res) => setMessages(res.data))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));

    socket.connect();
    socket.emit("joinRoom", { taskId, userId });
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.emit("leaveRoom", { taskId, userId });
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [taskId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Find the conversation for this taskId
    const conversation = conversations.find(c => c.taskId === taskId);
    // Determine the receiverId: if current user is the task owner, send to the other user; otherwise, send to the task owner
    let receiverId = "";
    if (conversation) {
      if (conversation.taskOwnerId && conversation.taskOwnerId !== user._id) {
        receiverId = conversation.taskOwnerId;
      } else if (conversation.otherUserId && conversation.otherUserId !== user._id) {
        receiverId = conversation.otherUserId;
      } else if (conversation.taskOwner && conversation.taskOwner !== user._id) {
        receiverId = conversation.taskOwner;
      } else if (conversation.ownerId && conversation.ownerId !== user._id) {
        receiverId = conversation.ownerId;
      } else if (conversation.userId && conversation.userId !== user._id) {
        receiverId = conversation.userId;
      }
    }
    // Fallback: if not found, use userId from params (for compatibility)
    if (!receiverId) {
      receiverId = userId;
    }
    const msg = {
      taskId,
      userId,
      receiverId,
      text: input,
      timestamp: new Date().toISOString(),
    };
    socket.emit("sendMessage", msg);
    setMessages((prev) => [...prev, { ...msg, self: true }]);
    setInput("");
    try {
      await axios.post(`${BACKEND_URL}/api/chat/${taskId}/${userId}`, msg);
    } catch (err) {
      // Optionally show error to user
      console.error(err);
    }
  };

  if (!user) {
    return (
      <main className="flex-1 flex items-center justify-center bg-zinc-100 p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e5e7eb" opacity="0.2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 14h.01M16 10h.01" /></svg>
          <h2 className="text-2xl font-bold text-zinc-700 mb-2">Sign in to view messages</h2>
          <p className="text-zinc-500">You must be logged in to access your messages.</p>
          <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex h-full bg-zinc-100">
      {/* Sidebar for conversations */}
      <aside className="w-80 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-4 border-b border-zinc-100 font-bold text-lg text-zinc-700">Messages</div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-zinc-400 text-center">No conversations yet.</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.taskId}
                className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 flex items-center gap-3 ${conv.taskId === taskId ? 'bg-indigo-100' : ''}`}
                onClick={() => navigate(`/dashboard/messages/${conv.taskId}/${user._id}`)}
              >
                <img src={conv.taskImage || 'https://placehold.co/40x40'} alt="Task" className="h-10 w-10 rounded-full object-cover border" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-800 truncate">{conv.taskTitle || 'Task'}</div>
                  <div className="text-xs text-zinc-500 truncate">{conv.lastMessage || 'No messages yet.'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
      {/* Chat area */}
      <section className="flex-1 flex flex-col h-full">
        {/* Notification banner */}
        {notification && (
          <div className="bg-green-500 text-white text-center py-2 px-4 font-semibold animate-fade-in-down z-50">
            {notification}
          </div>
        )}
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3 bg-white">
          <img src={conversations.find(c => c.taskId === taskId)?.taskImage || 'https://placehold.co/40x40'} alt="Task" className="h-10 w-10 rounded-full object-cover border" />
          <div className="font-semibold text-lg text-zinc-800">{conversations.find(c => c.taskId === taskId)?.taskTitle || 'Chat'}</div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-zinc-50">
          {loading ? (
            <div className="text-zinc-400 text-center mt-10">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-zinc-400 text-center mt-10">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`my-2 flex ${msg.self || msg.senderId === user._id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-lg break-words text-base shadow ${
                    msg.self || msg.senderId === user._id ? "bg-indigo-600 text-white" : "bg-white text-zinc-800 border border-zinc-200"
                  }`}
                >
                  {msg.text}
                  <div className="text-[10px] text-right opacity-60 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="flex gap-2 p-4 bg-white border-t border-zinc-100">
          <input
            className="flex-1 border rounded-2xl px-4 py-2 focus:outline-none focus:ring"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-2xl hover:bg-indigo-700 font-semibold"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
};


export default Messages;
