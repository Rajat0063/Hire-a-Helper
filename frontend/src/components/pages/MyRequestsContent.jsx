// src/components/pages/MyRequestsContent.jsx

import { useOutletContext } from 'react-router-dom'; // 1. Import the hook
import { Icon } from '../ui/Icon';

const MyRequestsContent = () => {
    // 2. Get the myRequests data from the context
    const { myRequests, user } = useOutletContext();

    const getStatusClass = (status) => {
        switch (status) {
            case 'Accepted': return 'bg-green-100 text-green-800 border border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'Declined': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-zinc-100 text-zinc-800 border border-zinc-200';
        }
    };

    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return `${names[0][0]}`.toUpperCase();
    }

    // Map backend request fields to frontend display fields
    const mappedRequests = myRequests.map(request => ({
        id: request._id || request.id,
        title: request.taskTitle || request.title || '',
        type: request.type || request.taskType || '',
        taskOwner: request.taskOwnerName || request.taskOwner || '',
        status: request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : '',
        message: request.message || '',
        image: request.image || request.taskImage || '',
        sentDate: request.createdAt ? `Sent ${new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '',
        location: request.location || request.taskLocation || '',
    }));

    // DEBUG BLOCK: Show current user ID and raw myRequests data
    // Remove this block after troubleshooting
    const debug = false; // Set to true to show debug info

    return (
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 sm:p-6 md:p-8">
            {debug && (
                <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
                    <div className="font-bold">DEBUG INFO</div>
                    <div>User ID: <span className="font-mono">{user?._id}</span></div>
                    <div>myRequests: <pre className="overflow-x-auto text-xs">{JSON.stringify(myRequests, null, 2)}</pre></div>
                </div>
            )}
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-zinc-800">My Requests</h1>
                <p className="mt-1 text-zinc-500">Track the help requests you've sent.</p>
                <div className="mt-6 space-y-6">
                    {mappedRequests.length > 0 ? mappedRequests.map(request => (
                        <div key={request.id} className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-zinc-200 rounded-full text-zinc-600 font-bold text-xl">
                                    {getInitials(request.taskOwner)}
                                </div>

                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h2 className="text-xl font-bold text-zinc-900">{request.title}</h2>
                                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">{request.type}</span>
                                            </div>
                                            <p className="text-sm text-zinc-500 mt-1">Task owner: {request.taskOwner}</p>
                                        </div>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusClass(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-zinc-600">Your message:</p>
                                        <blockquote className="mt-2 p-4 bg-zinc-50 border-l-4 border-zinc-300 text-zinc-700 italic rounded-r-md">
                                            {request.message}
                                        </blockquote>
                                    </div>

                                    <div className="mt-4 rounded-lg overflow-hidden">
                                        <img
                                            src={request.image || "https://placehold.co/600x300/cccccc/ffffff?text=No+Image"}
                                            alt={request.title}
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-zinc-200 flex items-center justify-end text-sm text-zinc-500 space-x-6">
                               <div className="flex items-center space-x-2">
                                    <Icon path="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" className="h-4 w-4"/>
                                    <span>{request.sentDate}</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                    <Icon path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" className="h-4 w-4"/>
                                    <span>{request.location}</span>
                               </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold text-zinc-700">No Sent Requests</h2>
                            <p className="text-zinc-500 mt-2">Apply for a task in the feed to see your requests here.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default MyRequestsContent;