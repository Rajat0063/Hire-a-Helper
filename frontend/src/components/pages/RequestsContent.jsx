// src/components/pages/RequestsContent.jsx

import { useOutletContext } from 'react-router-dom'; // 1. Import the hook
import { Icon } from '../ui/Icon';

// Professional skeleton for Requests page
const RequestsSkeleton = () => (
  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 p-4 sm:p-6 md:p-8">
    <div className="flex justify-between items-center mb-6">
      <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="space-y-6">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <div className="h-10 w-20 bg-green-200 rounded animate-pulse" />
              <div className="h-10 w-20 bg-red-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 mt-4 border-t border-zinc-200 pt-4">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </main>
);

const RequestsContent = () => {
  const context = useOutletContext() || {};
  const requests = Array.isArray(context.requests) ? context.requests : [];
  const requestsLoading = context.requestsLoading;
  const handleAcceptRequest = context.handleAcceptRequest;
  const handleDeclineRequest = context.handleDeclineRequest;

  if (requestsLoading) return <RequestsSkeleton />;
  if (!Array.isArray(requests) || requests.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center bg-zinc-100 p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <Icon className="mx-auto mb-4 h-12 w-12 text-zinc-400" path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          <h2 className="text-2xl font-bold text-zinc-700 mb-2">No incoming requests</h2>
          <p className="text-zinc-500">You have no incoming requests at the moment.</p>
        </div>
      </main>
    );
  }

  // Helper for avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  };


  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-800">Incoming Requests</h1>
        <span className="text-zinc-500">People who want to help with your tasks</span>
      </div>
      <div className="space-y-6">
        {requests.map((request) => {
          return (
            <div key={request._id || request.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-zinc-100">
              <div className="flex items-center gap-4 mb-2">
                {request.requesterImage ? (
                  <img src={request.requesterImage} alt={request.requesterName || 'Requester'} className="h-12 w-12 rounded-full object-cover border border-zinc-200" />
                ) : (
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-zinc-200 text-zinc-600 font-bold text-xl">
                    {getInitials(request.requesterName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-zinc-800 truncate">{request.requesterName || 'Unknown'}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleAcceptRequest(request)}
                    disabled={request.status && request.status !== 'pending'}
                  >
                    Accept
                  </button>
                  <button
                    className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-lg font-semibold hover:bg-zinc-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleDeclineRequest(request._id || request.id)}
                    disabled={request.status && request.status !== 'pending'}
                  >
                    Decline
                  </button>
                  <span className={
                    `ml-2 px-3 py-1 rounded text-xs font-semibold ` +
                    (request.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      request.status === 'declined' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700')
                  }>
                    {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="text-zinc-700 mb-2">
                {request.message || request.description || 'No message provided.'}
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-zinc-700 text-sm mb-2">
                <span className="font-semibold text-zinc-600">Requesting for:</span> {request.taskTitle || request.title || 'N/A'}
              </div>
              <div className="flex items-center text-zinc-500 text-xs gap-4 mt-1">
                <span>📅 {request.createdAt ? new Date(request.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                {request.location && <span>📍 {request.location}</span>}
                {request.distance && <span>Within {request.distance} miles</span>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default RequestsContent;