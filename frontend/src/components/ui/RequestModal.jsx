// src/components/ui/RequestModal.jsx
import { useState } from 'react';

const RequestModal = ({ isOpen, onClose, task, onSendRequest }) => {
    const [message, setMessage] = useState('');

    if (!isOpen || !task) return null;

    const handleSubmit = () => {
        if (message.trim()) {
            onSendRequest(task, message);
            setMessage('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 sm:p-8">
            <div className="bg-white rounded-xl sm:rounded-xl shadow-2xl p-6 w-full max-w-md sm:max-w-md m-0 sm:m-4 sm:mx-auto sm:my-auto sm:overflow-hidden sm:shadow-xl">
                <h2 className="text-2xl font-bold text-zinc-800 mb-2">Send Request</h2>
                <p className="text-zinc-600 mb-4">You are sending a request for: <span className="font-semibold">{task.title}</span></p>
                
                <textarea
                    className="w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    rows="4"
                    placeholder="Write a short message to the task owner..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                ></textarea>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-zinc-200 text-zinc-800 hover:bg-zinc-300 font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold transition-colors disabled:bg-indigo-300"
                        disabled={!message.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestModal;