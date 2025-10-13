import React, { useState, useEffect, useRef } from "react";

import io from "socket.io-client";
import { fetchMessages, sendMessageApi } from "../../utils/messagesApi";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
let socket;

const Messages = ({ user, recipient }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);


  useEffect(() => {
    if (!user || !recipient) return;
    let isMounted = true;
    // Fetch chat history
    const token = localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")).token : null;
    fetchMessages(user._id, recipient._id, token)
      .then((msgs) => {
        if (isMounted) setMessages(msgs);
      })
      .catch(() => {});

    // Setup socket
    socket = io(SOCKET_URL, { autoConnect: true });
    setConnected(true);
    socket.emit("joinRoom", { userId: user._id, recipientId: recipient._id });
    const handleMessage = (msg) => {
      // Only add if not duplicate (avoid double add on send)
      setMessages((prev) => {
        if (prev.length && prev[prev.length - 1]._id === msg._id) return prev;
        return [...prev, msg];
      });
    };
    socket.on("message", handleMessage);
    return () => {
      socket.emit("leaveRoom", { userId: user._id, recipientId: recipient._id });
      socket.disconnect();
      setConnected(false);
      isMounted = false;
    };
  }, [user, recipient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const token = localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")).token : null;
    try {
      const sent = await sendMessageApi(user._id, recipient._id, input, token);
      // The socket will also emit this, but for instant feedback:
      setMessages((prev) => [...prev, sent]);
      socket.emit("message", sent);
      setInput("");
    } catch {
      // Optionally show error
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] w-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b bg-indigo-50">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-indigo-700">Chat with {recipient?.name || "User"}</h3>
        </div>
        <span className={`ml-2 h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`}></span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-zinc-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === user._id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs text-sm shadow-md "
                ${msg.sender === user._id ? "bg-indigo-600 text-white" : "bg-white border text-zinc-800"}`}
            >
              {msg.text}
              <div className="text-[10px] text-right text-zinc-400 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex items-center border-t px-4 py-2 bg-white">
        <input
          type="text"
          className="flex-1 border rounded-lg px-3 py-2 mr-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold"
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Messages;
