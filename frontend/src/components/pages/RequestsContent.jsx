// src/components/pages/RequestsContent.jsx

import { useOutletContext } from 'react-router-dom'; // 1. Import the hook
import { Icon } from '../ui/Icon';

const RequestsContent = () => {
    // 2. Get data and functions from context. Note the updated function names.
    const { requests, handleAcceptRequest, handleDeclineRequest } = useOutletContext();

    // The entire JSX block below is almost the same, just with updated function calls.
    return (
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-800">Incoming Requests</h1>
        </div>
  
        <div className="space-y-6">
          {requests.length > 0 ? requests.map((request) => (
            <div key={request._id || request.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  {/* Requester Avatar */}
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-indigo-600" path="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">{request.requesterName} <span className="text-xs text-zinc-400">({request.requesterEmail})</span></h3>
                    <p className="text-sm text-zinc-500 mt-1">{request.message || 'No message provided.'}</p>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <button onClick={() => handleAcceptRequest(request)} className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors duration-200">Accept</button>
                  <button onClick={() => handleDeclineRequest(request._id || request.id)} className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors duration-200">Decline</button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 mt-4 border-t border-zinc-200 pt-4">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Task:</span>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">{request.taskTitle}</span>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">{request.taskCategory}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <span>{request.taskLocation}</span>
                </div>
                {request.taskDescription && (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Description:</span>
                    <span>{request.taskDescription}</span>
                  </div>
                )}
                {request.taskImage && (
                  <img src={request.taskImage} alt="Task" className="h-12 w-12 rounded object-cover ml-2" />
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-zinc-700">No Incoming Requests</h2>
                <p className="text-zinc-500 mt-2">You're all caught up!</p>
            </div>
          )}
        </div>
      </main>
    );
};

export default RequestsContent;