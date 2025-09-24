// src/pages/FeedContent.jsx

import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Icon, AddTaskIcon } from '../ui/Icon';

const FeedContent = () => {
    const { feedTasks, handleOpenRequestModal, user } = useOutletContext();
    const navigate = useNavigate();
    
    const [activeTasks, setActiveTasks] = useState([]);

    // REFACTORED: This effect now processes AND filters tasks immediately.
    // This is the key fix for the UI flicker.

    useEffect(() => {
        // Debug: Log all tasks received
        console.log('FeedContent received feedTasks:', feedTasks);
        // Show all tasks, no filtering or sorting
        setActiveTasks(feedTasks);
    }, [feedTasks]);

    // REFACTORED: This effect is now much more performant.
    // Instead of checking every second, it calculates when the *next* task will expire
    // and sets a single timeout for that specific moment.
    // Removed time-based expiration effect. All tasks will remain visible.
    
    // Utility to format date and time strings (no changes here)
    const formatDateTime = (isoString) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        let formattedString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (isoString.includes('T')) {
            formattedString += ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
        return formattedString;
    };
    
    // Utility to get Tailwind CSS classes (no changes here)
    const getCategoryClass = (category) => {
        switch (category) {
            case 'gardening': return 'bg-green-100 text-green-800';
            case 'moving': return 'bg-purple-100 text-purple-800';
            case 'painting': return 'bg-blue-100 text-blue-800';
            case 'cleaning': return 'bg-yellow-100 text-yellow-800';
            case 'repairs': return 'bg-red-100 text-red-800';
            default: return 'bg-zinc-100 text-zinc-800';
        }
    };
    
    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-zinc-800">Feed</h1>
                <button 
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200" 
                    onClick={() => navigate('/dashboard/add-task')}
                >
                    <AddTaskIcon className="h-5 w-5" />
                    <span>Post a Task</span>
                </button>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTasks.length > 0 ? (
                    activeTasks.map((item) => (
                        <div key={item.id || item._id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group transform hover:-translate-y-2 transition-transform duration-300">
                            <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                            <div className="p-4 flex flex-col flex-grow">
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${getCategoryClass(item.type)}`}>{item.type}</span>
                                        <span className="text-sm text-zinc-500">{item.date}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-zinc-500 mb-4 break-words">{item.description}</p>
                                    <div className="text-zinc-500 text-sm space-y-2 mb-4">
                                        <div className="flex items-center space-x-2">
                                            <Icon className="h-4 w-4" path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <span>{item.location}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Icon className="h-4 w-4" path="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                                            <span>{formatDateTime(item.startTime)} {item.endTime ? `- ${formatDateTime(item.endTime)}` : ''}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-zinc-100">
                                    <div className="flex items-center space-x-2">
                                        <img src={item.userImage} alt={item.user} className="h-8 w-8 rounded-full object-cover" />
                                        <span className="text-sm font-semibold text-zinc-700">{item.user}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleOpenRequestModal(item)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${item.user === (user && user.name) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        disabled={item.user === (user && user.name)}
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-zinc-500">No active tasks at the moment. Check back later!</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default FeedContent;