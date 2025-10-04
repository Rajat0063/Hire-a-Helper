import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function TaskChat({ taskId, currentUser, otherUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef();
  const chatEndRef = useRef();

  useEffect(() => {
    // Connect and join user room
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join', currentUser._id);

    // Listen for incoming messages
    socketRef.current.on('chat:receive', (msg) => {
      if (msg.taskId === taskId) setMessages((prev) => [...prev, msg]);
    });
    socketRef.current.on('chat:error', (err) => alert(err.error));

    // Fetch chat history
    axios.get(`/api/chat/${taskId}`)
      .then(res => setMessages(res.data))
      .catch(() => setMessages([]));

    return () => {
      socketRef.current.disconnect();
    };
  }, [taskId, currentUser._id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = {
      taskId,
      sender: currentUser._id,
      receiver: otherUser._id,
      message: input.trim(),
    };
    socketRef.current.emit('chat:send', msg);
    setInput('');
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg bg-white shadow p-2">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, i) => (
          <div key={msg._id || i} className={`my-1 flex ${msg.sender === currentUser._id ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.sender === currentUser._id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
              <span>{msg.message}</span>
              <div className="text-xs text-right opacity-60 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Send</button>
      </form>
    </div>
  );
}
