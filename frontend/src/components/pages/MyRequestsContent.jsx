// src/components/pages/MyRequestsContent.jsx

import { useOutletContext } from 'react-router-dom'; // 1. Import the hook
import { useEffect, useState } from 'react';
import socket from '../../utils/socket';
import { Icon } from '../ui/Icon';

// Professional skeleton for My Requests page
const MyRequestsSkeleton = () => (
    <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="mt-6 space-y-6">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-5 w-16 bg-blue-100 rounded animate-pulse" />
                                        </div>
                                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="mt-4">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                                    <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                                </div>
                                <div className="mt-4 rounded-lg overflow-hidden">
                                    <div className="w-full h-32 bg-gray-200 animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-200 flex items-center justify-end text-sm text-zinc-500 space-x-6">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </main>
);

const PLACEHOLDER_IMG = "https://placehold.co/600x300?text=No+Image";

const MyRequestsContent = () => {
  const context = useOutletContext() || {};
  const [myRequests, setMyRequests] = useState(Array.isArray(context.myRequests) ? context.myRequests : []);

  // Listen for real-time notification updates and update myRequests status
  useEffect(() => {
    setMyRequests(Array.isArray(context.myRequests) ? context.myRequests : []);
  }, [context.myRequests]);

  useEffect(() => {
    if (!context.user || !context.user._id) return;
    if (!socket.connected) socket.connect();
    // Join user room for real-time events
    socket.emit('join-user-room', context.user._id);

    // Listen for request status updates (existing logic)
    const notificationHandler = (notification) => {
      setMyRequests(prev => prev.map(req => {
        if (req._id === notification.requestId || req.id === notification.requestId) {
          return { ...req, status: notification.type === 'request-accepted' ? 'accepted' : notification.type === 'request-declined' ? 'declined' : req.status };
        }
        return req;
      }));
    };
    socket.on(`notification-update-${context.user._id}`, notificationHandler);

    // Listen for real-time request deletion by admin
    const requestDeletedHandler = (deletedId) => {
      setMyRequests(prev => prev.filter(req => req._id !== deletedId && req.id !== deletedId));
    };
    socket.on('user:request-deleted', requestDeletedHandler);

    return () => {
      socket.off(`notification-update-${context.user._id}`, notificationHandler);
      socket.off('user:request-deleted', requestDeletedHandler);
    };
  }, [context.user]);

  if (context.myRequests === undefined) return <MyRequestsSkeleton />;
  if (!Array.isArray(myRequests) || myRequests.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center bg-zinc-50 p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <Icon className="mx-auto mb-4 h-12 w-12 text-zinc-400" path="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-2.21 0-4-1.79-4-4h2a2 2 0 004 0h2c0 2.21-1.79 4-4 4zm6-8V7a6 6 0 10-12 0v3a6 6 0 0012 0z" />
          <h2 className="text-2xl font-bold text-zinc-700 mb-2">No requests sent</h2>
          <p className="text-zinc-500">You haven't sent any requests yet.</p>
        </div>
      </main>
    );
  }

  const statusColor = status => {
    if (!status) return 'bg-yellow-100 text-yellow-700';
    if (status.toLowerCase() === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (status.toLowerCase() === 'accepted') return 'bg-green-100 text-green-700';
    if (status.toLowerCase() === 'declined') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-800 mb-1">My Requests</h1>
        <div className="text-zinc-500 mb-4">Track the help requests you've sent</div>
        <div className="space-y-8">
          {myRequests.map(request => {
            // Prefer taskImage (from backend), then image, then placeholder
            const imgSrc = request.taskImage || request.image || PLACEHOLDER_IMG;
            return (
              <div key={request._id || request.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 border border-zinc-100">
                <div className="flex items-center gap-3 mb-2">
                  {request.taskOwnerImage ? (
                    <img src={request.taskOwnerImage} alt={request.taskOwnerName || 'Owner'} className="h-10 w-10 rounded-full object-cover border border-zinc-200" />
                  ) : (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-zinc-200 text-zinc-600 font-bold text-lg">
                      {request.taskOwnerName ? request.taskOwnerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg text-zinc-800 truncate">{request.taskTitle || request.title || 'Untitled Task'}</span>
                      {request.type && (
                        <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">{request.type}</span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500">Task owner: {request.taskOwnerName || request.taskOwner || 'Unknown'}</div>
                  </div>
                  <span className={`ml-2 px-3 py-1 rounded text-xs font-semibold ${statusColor(request.status)}`}>{request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}</span>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-zinc-700 text-sm">
                  <span className="font-semibold text-zinc-600">Your message:</span> {request.message || 'No message provided.'}
                </div>
                <div className="flex items-center text-zinc-500 text-xs gap-2 mt-2">
                  <span>📅 {request.createdAt ? new Date(request.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  {request.location && <span>📍 {request.location}</span>}
                </div>
                <div className="mt-2">
                  <img src={imgSrc} alt="Task" className="rounded-lg w-full object-cover max-h-72 border border-zinc-200" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default MyRequestsContent;