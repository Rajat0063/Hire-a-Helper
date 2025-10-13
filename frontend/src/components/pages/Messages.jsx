import React, { useEffect, useRef, useState } from "react";
import { useLocation } from 'react-router-dom';
import socket from "../../utils/socket";
import Avatar from "../ui/Avatar";

// Dummy data for sidebar (replace with API call)
const conversationsDummy = [
	{ id: "1", name: "John Helper", lastMessage: "See you soon!", image: "", unread: 2 },
	{ id: "2", name: "Jane Requester", lastMessage: "Thank you!", image: "", unread: 0 },
	// Example: Task Owner (will be added dynamically in real app)
	{ id: "owner-123", name: "Task Owner", lastMessage: "Request accepted!", image: "", unread: 0, isOwner: true },
];

const currentUser = { id: "me", name: "You" };

const Messages = () => {
		const [conversations] = useState(conversationsDummy);
		const location = useLocation();
		const params = new URLSearchParams(location.search);
		const initialConv = params.get('conversation') || conversationsDummy[0]?.id || "";
		const [selectedId, setSelectedId] = useState(initialConv);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef(null);

	// Connect to socket and join room
	useEffect(() => {
		socket.connect();
		if (selectedId) {
			socket.emit("join_conversation", selectedId);
		}
		return () => {
			socket.disconnect();
		};
	}, [selectedId]);

	// Listen for incoming messages
	useEffect(() => {
		socket.on("receive_message", (msg) => {
			setMessages((prev) => [...prev, msg]);
		});
		return () => {
			socket.off("receive_message");
		};
	}, []);

	// Scroll to bottom on new message
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Dummy: Load messages for selected conversation
	useEffect(() => {
		setLoading(true);
		setTimeout(() => {
			setMessages([
				{ id: 1, sender: { id: "1", name: "John Helper" }, text: "Hello! How can I help you?", time: "10:00" },
				{ id: 2, sender: currentUser, text: "Hi! I need help with my request.", time: "10:01" },
			]);
			setLoading(false);
		}, 500);
	}, [selectedId]);

	const sendMessage = (e) => {
		e.preventDefault();
		if (!input.trim()) return;
		const msg = {
			sender: currentUser,
			text: input,
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		};
		setMessages((prev) => [...prev, msg]);
		socket.emit("send_message", { conversationId: selectedId, ...msg });
		setInput("");
	};

		return (
			<div className="flex h-[calc(100vh-64px)] bg-zinc-100">
				{/* Sidebar */}
				<aside className="w-80 bg-white border-r flex flex-col">
					<div className="p-6 border-b text-xl font-bold text-indigo-700 flex items-center justify-between">
						Messages
						{/* Always show Message Owner button for demonstration */}
						<button
							className="ml-2 px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-xs"
							onClick={() => setSelectedId("owner-123")}
						>
							Message Owner
						</button>
					</div>
					<div className="flex-1 overflow-y-auto">
						{conversations.map((conv) => (
							<button
								key={conv.id}
								className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 focus:bg-indigo-100 transition text-left ${selectedId === conv.id ? "bg-indigo-50" : ""}`}
								onClick={() => setSelectedId(conv.id)}
							>
								<Avatar user={conv} className="h-10 w-10" />
								<div className="flex-1">
									<div className="font-medium text-zinc-800">{conv.name}{conv.isOwner && <span className="ml-1 text-xs text-indigo-500 font-semibold">(Owner)</span>}</div>
									<div className="text-xs text-zinc-500 truncate">{conv.lastMessage}</div>
								</div>
								{conv.unread > 0 && (
									<span className="ml-2 bg-indigo-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold">{conv.unread}</span>
								)}
							</button>
						))}
					</div>
				</aside>

			{/* Main chat area */}
			<main className="flex-1 flex flex-col">
				{/* Header */}
				<div className="h-16 flex items-center px-6 border-b bg-white shadow-sm">
					<Avatar user={conversations.find((c) => c.id === selectedId) || {}} className="h-10 w-10 mr-3" />
					<div className="font-semibold text-lg text-zinc-800">
						{conversations.find((c) => c.id === selectedId)?.name || "Select a conversation"}
					</div>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-zinc-50">
					{loading ? (
						<div className="text-zinc-400 text-center mt-10">Loading messages...</div>
					) : (
						messages.map((msg, idx) => (
							<div
								key={idx}
								className={`flex ${msg.sender.id === currentUser.id ? "justify-end" : "justify-start"}`}
							>
								{msg.sender.id !== currentUser.id && (
									<Avatar user={msg.sender} className="h-8 w-8 mr-2" />
								)}
								<div className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm ${msg.sender.id === currentUser.id ? "bg-indigo-600 text-white" : "bg-white text-zinc-800"}`}>
									{msg.text}
									<div className="text-[10px] text-zinc-400 text-right mt-1">{msg.time}</div>
								</div>
								{msg.sender.id === currentUser.id && (
									<Avatar user={msg.sender} className="h-8 w-8 ml-2" />
								)}
							</div>
						))
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<form onSubmit={sendMessage} className="flex items-center gap-2 px-6 py-4 border-t bg-white">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type your message..."
						className="flex-1 border rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-zinc-50"
						autoComplete="off"
					/>
					<button
						type="submit"
						className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-semibold shadow"
						disabled={!input.trim()}
					>
						Send
					</button>
				</form>
			</main>
		</div>
	);
};

export default Messages;
