// src/pages/FeedContent.jsx

import React from 'react';
import PageHeader from '../ui/PageHeader';
// Professional skeleton for Feed page
const FeedSkeleton = () => (
  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 px-0 pt-4 pb-8">
        <div className="flex justify-between items-center mb-6">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-40 bg-indigo-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                    <div className="w-full h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4 flex flex-col flex-grow">
                        <div className="flex-grow">
                            <div className="flex justify-between items-center mb-2">
                                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
                                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-4 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
                            <div className="space-y-2 mb-4">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-zinc-100">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-8 w-28 bg-indigo-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </main>
);
import { useOutletContext } from 'react-router-dom';
import { Icon, AddTaskIcon } from '../ui/Icon';

// Helper for category badge color
const getCategoryClass = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'moving': return 'bg-blue-100 text-blue-700';
    case 'cleaning': return 'bg-green-100 text-green-700';
    case 'delivery': return 'bg-yellow-100 text-yellow-700';
    case 'repair': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// Helper for date/time formatting
const formatDateTime = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};


const FeedContent = () => {
  const context = useOutletContext() || {};
  const activeTasks = Array.isArray(context.feedTasks) ? context.feedTasks : [];
  const feedLoading = context.feedLoading;
  const handleOpenRequestModal = context.handleOpenRequestModal;
  const user = context.user;
  const searchQuery = context.searchQuery || '';

  // Filter tasks by search query (title, description, location, type)
  const filteredTasks = activeTasks.filter(task => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (task.title && task.title.toLowerCase().includes(q)) ||
      (task.description && task.description.toLowerCase().includes(q)) ||
      (task.location && task.location.toLowerCase().includes(q)) ||
      (task.type && task.type.toLowerCase().includes(q))
    );
  });

  if (feedLoading) return <FeedSkeleton />;
  if (!Array.isArray(filteredTasks) || filteredTasks.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center bg-zinc-100 p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <Icon className="mx-auto mb-4 h-12 w-12 text-zinc-400" path="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" />
          <h2 className="text-2xl font-bold text-zinc-700 mb-2">No tasks found</h2>
          <p className="text-zinc-500">There are currently no tasks in the feed. Try posting a new task!</p>
        </div>
      </main>
    );
  }
  return (
  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 px-0 pt-4 pb-8">
      <PageHeader
        title="Feed"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
        {filteredTasks.map((item) => (
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
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default FeedContent;