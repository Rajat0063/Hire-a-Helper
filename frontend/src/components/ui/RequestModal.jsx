// src/components/ui/RequestModal.jsx
import { useState } from 'react';

const RequestModal = ({ isOpen, onClose, task, onSendRequest }) => {
    const [message, setMessage] = useState('');
    const [showRequest, setShowRequest] = useState(false);

    if (!isOpen || !task) return null;

    const handleSend = () => {
        if (message.trim()) {
            onSendRequest(task, message);
            setMessage('');
            setShowRequest(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-lg m-4 overflow-hidden animate-fadeIn">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 w-full bg-zinc-100 flex items-center justify-center p-4">
                        <img src={task.image} alt={task.title} className="rounded-xl w-full h-56 object-cover shadow-md" />
                    </div>
                    <div className="md:w-1/2 w-full p-6 flex flex-col">
                        <h2 className="text-2xl font-bold text-zinc-800 mb-2">{task.title}</h2>
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${task.type ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-200 text-zinc-600'}`}>{task.type}</span>
                        <p className="text-zinc-600 mb-2">{task.description}</p>
                        <div className="text-zinc-500 text-sm mb-2">
                            <span className="block mb-1"><b>Location:</b> {task.location || 'N/A'}</span>
                            <span className="block mb-1"><b>Start:</b> {task.startTime ? new Date(task.startTime).toLocaleString() : 'N/A'}</span>
                            {task.endTime && <span className="block mb-1"><b>End:</b> {new Date(task.endTime).toLocaleString()}</span>}
                        </div>
                        <div className="flex-1" />
                        {!showRequest ? (
                            <button
                                onClick={() => setShowRequest(true)}
                                className="w-full mt-4 px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition-colors"
                            >
                                Send Request
                            </button>
                        ) : (
                            <div className="mt-4">
                                <textarea
                                    className="w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                    rows="4"
                                    placeholder="Write a short message to the task owner..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                ></textarea>
                                <div className="mt-4 flex justify-end space-x-3">
                                    <button
                                        onClick={() => { setShowRequest(false); setMessage(''); }}
                                        className="px-6 py-2 rounded-lg bg-zinc-200 text-zinc-800 hover:bg-zinc-300 font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition-colors disabled:bg-indigo-300"
                                        disabled={!message.trim()}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 text-2xl font-bold focus:outline-none"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestModal;