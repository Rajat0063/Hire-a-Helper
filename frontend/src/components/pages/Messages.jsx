import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000"); // Update with your backend URL if needed

const Messages = () => {
  const { taskId, userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch chat history
    axios
      .get(`/api/chat/${taskId}/${userId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error(err));

    // Listen for new messages
    socket.emit("joinRoom", { taskId, userId });
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.emit("leaveRoom", { taskId, userId });
      socket.off("receiveMessage");
    };
  }, [taskId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = {
      taskId,
      userId,
      text: input,
      timestamp: new Date().toISOString(),
    };
    socket.emit("sendMessage", msg);
    setMessages((prev) => [...prev, { ...msg, self: true }]);
    setInput("");
    // Save to DB
    await axios.post(`/api/chat/${taskId}/${userId}`, msg);
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`my-1 flex ${msg.self ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-xs break-words text-sm shadow ${
                msg.self ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.text}
              <div className="text-[10px] text-right opacity-60 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Messages;
