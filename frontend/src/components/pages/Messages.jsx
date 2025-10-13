
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { fetchMessages } from "../../utils/messagesApi";

// Dummy chat list for UI demo; replace with real user list from backend
import { fetchConversations, sendMessageApi } from "../../utils/messagesApi";

const getUser = () => {
  try {
    const stored = localStorage.getItem("userInfo");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
};

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
let socket;

const Messages = () => {
  const user = getUser();
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch chat list (conversations)
  useEffect(() => {
    if (!user) return;
    setLoadingChats(true);
    fetchConversations(user.token)
      .then((convos) => {
        setChatList(convos);
        setSelectedChat(convos[0] || null);
      })
      .finally(() => setLoadingChats(false));
  }, [user]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!user || !selectedChat) return;
    let isMounted = true;
    const token = user.token;
    fetchMessages(user._id, selectedChat._id, token)
      .then((msgs) => {
        if (isMounted) setMessages(msgs);
      })
      .catch(() => {});

    // Setup socket
    socket = io(SOCKET_URL, { autoConnect: true });
    setConnected(true);
    socket.emit("joinRoom", { userId: user._id, recipientId: selectedChat._id });
    const handleMessage = (msg) => {
      setMessages((prev) => {
        if (prev.length && prev[prev.length - 1]._id === msg._id) return prev;
        return [...prev, msg];
      });
    };
    socket.on("message", handleMessage);
    return () => {
      socket.emit("leaveRoom", { userId: user._id, recipientId: selectedChat._id });
      socket.disconnect();
      setConnected(false);
      isMounted = false;
    };
  }, [user, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const token = user.token;
    try {
      const sent = await sendMessageApi(user._id, selectedChat._id, input, token);
      setMessages((prev) => [...prev, sent]);
      socket.emit("message", sent);
      setInput("");
    } catch {
      // Optionally show error
    }
  };

  return (
    <div className="flex h-[80vh] w-full bg-white rounded-2xl shadow-2xl overflow-hidden text-zinc-800">
      {/* Sidebar Chat List */}
      <aside className="w-80 bg-zinc-50 border-r border-zinc-200 flex flex-col">
        <div className="p-5 border-b border-zinc-200 text-xl font-bold tracking-wide">Messages</div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-6 text-zinc-400 text-center">Loading chats...</div>
          ) : chatList.length === 0 ? (
            <div className="p-6 text-zinc-400 text-center">No conversations yet.</div>
          ) : chatList.map((chat) => (
            <div
              key={chat._id}
              className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition hover:bg-zinc-100 ${selectedChat && selectedChat._id === chat._id ? "bg-zinc-100" : ""}`}
              onClick={() => setSelectedChat(chat)}
            >
              <img src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}`} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <div className="font-semibold text-base">{chat.name}</div>
                <div className="text-xs text-zinc-500 truncate max-w-[120px]">{chat.lastMessage}</div>
              </div>
              {chat.unread > 0 && (
                <span className="bg-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold text-white">{chat.unread}</span>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Window */}
      <section className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        {selectedChat ? (
          <div className="flex items-center px-8 py-5 border-b border-zinc-200 bg-zinc-50">
            <img src={selectedChat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.name)}`} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover mr-4" />
            <div className="flex-1">
              <div className="font-semibold text-lg">{selectedChat.name}</div>
              <div className="text-xs text-zinc-500">Online</div>
            </div>
            <span className={`ml-2 h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-300"}`}></span>
          </div>
        ) : (
          <div className="flex items-center px-8 py-5 border-b border-zinc-200 bg-zinc-50 text-zinc-400">Select a conversation</div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3 bg-white">
          {selectedChat && messages.length > 0 ? messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === user._id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-5 py-3 rounded-2xl max-w-lg text-sm shadow-md ${msg.sender === user._id ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-800 border border-zinc-200"}`}
              >
                {msg.text}
                <div className="text-[10px] text-right text-zinc-400 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-zinc-400 text-center mt-10">No messages yet.</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {selectedChat && (
          <form onSubmit={sendMessage} className="flex items-center border-t border-zinc-200 px-8 py-5 bg-zinc-50">
            <input
              type="text"
              className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 mr-3 text-zinc-800 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-600 outline-none"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition"
              disabled={!input.trim()}
            >
              Send
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default Messages;
