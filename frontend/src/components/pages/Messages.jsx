import React, { useEffect, useRef, useState } from "react";
import { useLocation } from 'react-router-dom';
import socket from "../../utils/socket";
import Avatar from "../ui/Avatar";
import axios from 'axios';

// Conversations will be fetched/created via API
const conversationsDummy = [];

const Messages = () => {
	const location = useLocation();
	const stateOwner = location.state && location.state.owner ? location.state.owner : null;
	const params = new URLSearchParams(location.search);
	// ignore invalid query strings like "[object Object]"
	const rawConv = params.get('conversation');
	const initialConv = (rawConv && rawConv !== '[object Object]') ? rawConv : (conversationsDummy[0]?.id || "");
	// If the owner is passed via state, add/override the owner conversation at the start
	const initialConversations = conversationsDummy;
	const [conversations, setConversations] = useState(initialConversations);
	const [selectedId, setSelectedId] = useState(initialConv);
	const [showSidebarMobile, setShowSidebarMobile] = useState(false);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef(null);

	// Connect to socket once and join user room and join conversation when selectedId changes
	useEffect(() => {
	socket.connect();
	// join user room for notifications
	const u = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch (_err) { console.error('parse userInfo', _err); return {}; } })();
		const userId = u._id || u.id || null;
		if (userId) socket.emit('join-user-room', userId);
		return () => {
			try { socket.disconnect(); } catch (err) { console.error('Socket disconnect error', err); }
		};
	}, []);
	useEffect(() => {
		if (selectedId) socket.emit('join_conversation', selectedId);
	}, [selectedId]);

	// If navigated here with an owner, create or get a conversation with that owner
	useEffect(() => {
		const createForOwner = async () => {
			if (!stateOwner) return;
			try {
				const stored = localStorage.getItem('userInfo');
				if (!stored) return;
				const u = JSON.parse(stored);
				const userId = u._id || u.id;
				const ownerId = stateOwner._id || stateOwner.id || stateOwner.userId;
				if (!userId || !ownerId) return;
				setLoading(true);
				const apiUrl = `${import.meta.env.VITE_API_URL}/api/messages/conversation`;
				const { data } = await axios.post(apiUrl, { participants: [userId, ownerId] });
				const conv = data.conversation || data;
				if (conv) {
					setConversations(prev => [ { ...conv, name: stateOwner.name, ownerName: stateOwner.name, image: stateOwner.image || stateOwner.avatar || undefined }, ...prev ]);
					setSelectedId(conv._id || conv.id);
				}
			} catch (err) {
				console.error('Failed to create/get conversation for owner', err);
			} finally {
				setLoading(false);
			}
		};
		createForOwner();
	}, [stateOwner]);

	// Load user's conversations list for sidebar
	useEffect(() => {
		const loadList = async () => {
			try {
				const stored = localStorage.getItem('userInfo');
				if (!stored) return;
				const u = JSON.parse(stored);
				const userId = u._id || u.id;
				if (!userId) return;
				const apiUrl = `${import.meta.env.VITE_API_URL}/api/messages/conversations/user/${userId}`;
				const { data } = await axios.get(apiUrl);
				// map conversations to have display name and image
				const mapped = data.map(c => {
					// pick the other participant as the name and image
					const other = c.participants.find(p => String(p._id || p.id) !== String(userId));
					return { ...c, name: other ? other.name : 'Conversation', image: other ? other.image : undefined, lastMessage: c.lastMessage || '' };
				});
				setConversations(prev => {
					// Merge with any existing owner prepended convs without duplicating
					const ids = new Set(mapped.map(m => m._id?.toString() || m.id?.toString()));
					const extra = prev.filter(p => !(p._id && ids.has(String(p._id))) && !(p.id && ids.has(String(p.id))));
					return [...mapped, ...extra];
				});
				// If there's a conversation in query param, ensure it's selected
				if (initialConv) setSelectedId(initialConv);
			} catch (err) {
				console.error('Failed to load conversation list', err);
			}
		};
		loadList();
	}, [initialConv]);

	// Listen for incoming messages and normalize them for the UI
	useEffect(() => {
		const handler = (msg) => {
			// msg may be a DB message or a minimal object. Derive sender id and try to get name/image from available sources
			const text = msg.text || msg.message || '';
			const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
			// determine sender id
			let senderId = null;
			let senderName = null;
			let senderImage = undefined;
			if (!msg.sender) {
				// nothing
			} else if (typeof msg.sender === 'string') {
				senderId = msg.sender;
			} else if (msg.sender._id || msg.sender.id) {
				senderId = msg.sender._id || msg.sender.id;
				senderName = msg.sender.name || msg.sender.username || null;
				senderImage = msg.sender.image || msg.sender.avatar || undefined;
			}

			// try to resolve participant details from conversations state
			if ((!senderName || senderName === null) && senderId && conversations && conversations.length) {
				// find conversation object
				const conv = conversations.find(c => (c._id || c.id) === (msg.conversationId || selectedId || ''));
				if (conv && Array.isArray(conv.participants)) {
					const other = conv.participants.find(p => String(p._id || p.id) === String(senderId));
					if (other) {
						senderName = other.name || other.fullName || senderName;
						senderImage = other.image || other.avatar || senderImage;
					}
				}
			}

			// fallback to provided stateOwner if it matches
			if ((!senderName || senderName === null) && stateOwner) {
				const ownerId = stateOwner._id || stateOwner.id || stateOwner.userId || stateOwner;
				if (String(ownerId) === String(senderId)) {
					senderName = stateOwner.name || senderName;
					senderImage = stateOwner.image || stateOwner.avatar || senderImage;
				}
			}

			// final fallbacks
			if (!senderId) senderId = msg.sender && (msg.sender._id || msg.sender.id) ? (msg.sender._id || msg.sender.id) : (msg.sender || 'unknown');
			if (!senderName) senderName = (msg.sender && msg.sender.name) || msg.senderName || 'Unknown';

			const sender = { id: senderId, name: senderName, image: senderImage };
			const normalized = { id: msg._id || msg.id || Math.random().toString(36).slice(2,9), sender, text, time };
			setMessages((prev) => [...prev, normalized]);
		};
		socket.on("receive_message", handler);
		return () => {
			socket.off("receive_message", handler);
		};
	}, [conversations, selectedId, stateOwner]);

	// Scroll to bottom on new message
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Load messages for selected conversation from API
	useEffect(() => {
		const load = async () => {
			if (!selectedId) return setMessages([]);
			setLoading(true);
			try {
				const apiUrl = `${import.meta.env.VITE_API_URL}/api/messages/conversation/${selectedId}`;
				const { data } = await axios.get(apiUrl);
				// Map messages into UI-friendly format
				setMessages(data.map(m => ({ id: m._id, sender: { id: m.sender._id, name: m.sender.name, image: m.sender.image }, text: m.text, time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } )));
			} catch (err) {
				console.error('Failed to load messages:', err && err.message ? err.message : err);
				setMessages([]);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [selectedId]);

	const getUserId = () => {
		try {
			const stored = localStorage.getItem('userInfo');
			if (!stored) return null;
			const u = JSON.parse(stored);
			return u._id || u.id || null;
		} catch (err) { console.error('getUserId parse error', err); return null; }
	};
	const sendMessage = async (e) => {
		e.preventDefault();
		if (!input.trim()) return;
		const userId = getUserId();
		if (!userId) return alert('Please log in to send messages');

		// Determine participants: try to get from selected conversation if available
		let participants = null;
		try {
			// try to find conversation object in state
			const convObj = conversations.find(c => (c._id === selectedId || c.id === selectedId));
			if (convObj && Array.isArray(convObj.participants) && convObj.participants.length >= 2) {
				participants = convObj.participants.map(p => (p._id || p.id || p));
			}
		} catch (err) {
			console.error('participants lookup error', err);
		}
		// fallback: use stateOwner if provided
		if (!participants && stateOwner) {
			const ownerId = stateOwner._id || stateOwner.id || stateOwner.userId || stateOwner;
			if (ownerId) participants = [userId, ownerId];
		}

		const payload = { conversationId: selectedId, sender: userId, text: input, participants };
	// clear input immediately; rely on server's receive_message to append the real message
	setInput('');
		try {
			// If conversationId missing, ensure it exists by POSTing participants
			if (!selectedId && participants && participants.length >= 2) {
				try {
					const apiUrl = `${import.meta.env.VITE_API_URL}/api/messages/conversation`;
					const { data } = await axios.post(apiUrl, { participants });
					const conv = data.conversation || data;
					const convId = conv?._id || conv?.id || (data?._id || data?.id);
					if (convId) {
						payload.conversationId = convId;
						setSelectedId(convId);
						// join the new conversation room
						socket.emit('join_conversation', convId);
					}
				} catch (err) {
					console.error('Failed to create conversation before sending message', err);
				}
			}
			socket.emit('send_message', payload);
		} catch (err) {
			console.error('Failed to send message via socket', err);
		}
	};

		return (
			<div className="flex h-[calc(100vh-64px)] bg-zinc-100">
				{/* Sidebar */}
				{/* Desktop sidebar */}
				<aside className="w-80 bg-white border-r flex-col hidden md:flex">
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
								key={conv._id || conv.id}
								className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 focus:bg-indigo-100 transition text-left ${selectedId === (conv._id || conv.id) ? "bg-indigo-50" : ""}`}
								onClick={() => setSelectedId(conv._id || conv.id)}
							>
								<Avatar user={conv} className="h-10 w-10" />
								<div className="flex-1">
									<div className="font-medium text-zinc-800">{conv.name || conv.taskOwnerName || conv.ownerName}{conv.isOwner && <span className="ml-1 text-xs text-indigo-500 font-semibold">(Owner)</span>}</div>
									<div className="text-xs text-zinc-500 truncate">{conv.lastMessage || ''}</div>
								</div>
							</button>
						))}
					</div>
				</aside>

			{/* Mobile sidebar (overlay) */}
			{showSidebarMobile && (
				<div className="fixed inset-0 z-40 md:hidden">
					<div className="absolute inset-0 bg-black/30" onClick={() => setShowSidebarMobile(false)} />
					<aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r overflow-y-auto p-0">
						<div className="p-6 border-b text-xl font-bold text-indigo-700 flex items-center justify-between">
							Conversations
							<button className="text-zinc-600" onClick={() => setShowSidebarMobile(false)}>Close</button>
						</div>
						<div className="p-2">
							{conversations.map((conv) => (
								<button key={conv._id || conv.id} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition text-left ${selectedId === (conv._id || conv.id) ? "bg-indigo-50" : ""}`} onClick={() => { setSelectedId(conv._id || conv.id); setShowSidebarMobile(false); }}>
									<Avatar user={conv} className="h-10 w-10" />
									<div className="flex-1">
										<div className="font-medium text-zinc-800">{conv.name}</div>
										<div className="text-xs text-zinc-500 truncate">{conv.lastMessage}</div>
									</div>
								</button>
							))}
						</div>
					</aside>
				</div>
			)}

			{/* Main chat area */}
			<main className="flex-1 flex flex-col">
				{/* Header */}
				<div className="h-16 flex items-center px-4 md:px-6 border-b bg-white shadow-sm">
					{selectedId ? (
						<>
							{/* mobile back button */}
							<button className="mr-3 md:hidden text-zinc-600 p-2 rounded hover:bg-zinc-100" onClick={() => { setSelectedId(''); setShowSidebarMobile(true); }} aria-label="Back to conversations">←</button>
							<Avatar user={conversations.find((c) => (c._id || c.id) === selectedId) || {}} className="h-10 w-10 mr-3" />
							<div className="font-semibold text-lg text-zinc-800 truncate">
								{conversations.find((c) => (c._id || c.id) === selectedId)?.name}
							</div>
							<div className="text-sm text-zinc-500 ml-3 hidden sm:block">
								{conversations.find((c) => (c._id || c.id) === selectedId)?.participants?.length ? `${conversations.find((c) => (c._id || c.id) === selectedId)?.participants?.length} participants` : ''}
							</div>
						</>
					) : (
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold">💬</div>
							<div>
								<div className="font-semibold text-lg text-zinc-800">Messages</div>
								<div className="text-sm text-zinc-500">Select a conversation to start chatting</div>
							</div>
						</div>
					)}
					{/* On small screens, show a button to open conversations if none selected */}
					{!selectedId && (
						<button className="ml-auto md:hidden px-3 py-1 rounded bg-indigo-50 text-indigo-700 text-sm" onClick={() => setShowSidebarMobile(true)}>Conversations</button>
					)}
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-4 space-y-2 bg-zinc-50 pb-36 md:pb-4">
					{loading ? (
						<div className="text-zinc-400 text-center mt-10">Loading messages...</div>
					) : selectedId ? (
						messages.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 mt-6">
								<div className="bg-white p-6 rounded-lg shadow-sm">
									<div className="text-3xl mb-2">👋</div>
									<div className="text-lg font-semibold">No messages yet</div>
									<div className="text-sm text-zinc-400 mt-1">Send the first message to start the conversation.</div>
								</div>
							</div>
						) : (
							messages.map((msg, idx) => {
								const own = String(msg.sender?.id) === String(getUserId());
								return (
									<div key={msg.id || idx} className={`flex ${own ? "justify-end" : "justify-start"} px-2 md:px-0`}> 
										{!own && (
											// hide avatar on very small screens to save space
											<Avatar user={msg.sender} className="h-8 w-8 mr-2 md:mr-3 hidden sm:block" />
										)}
										<div className={`w-auto md:max-w-xs max-w-[80%] px-3 py-2 rounded-2xl shadow text-sm break-words ${own ? "bg-indigo-600 text-white" : "bg-white text-zinc-800"}`}>
											{msg.text}
											<div className="text-[10px] text-zinc-400 text-right mt-1">{msg.time}</div>
										</div>
										{own && (
											<Avatar user={msg.sender} className="h-8 w-8 ml-2 md:ml-3 hidden sm:block" />
										)}
									</div>
								);
							})
						)
					) : (
						<div className="text-zinc-500 text-center mt-10">Select a conversation to start chatting</div>
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<form onSubmit={sendMessage} className="flex items-center gap-2 px-4 md:px-6 py-3 border-t bg-white">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type your message..."
						className="flex-1 min-w-0 border rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-zinc-50"
						autoComplete="off"
					/>
					<button
						type="submit"
						className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-semibold shadow text-sm"
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
