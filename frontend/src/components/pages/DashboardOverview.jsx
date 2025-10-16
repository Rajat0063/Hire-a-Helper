import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';

export default function DashboardOverview() {
  const [userTasksCount, setUserTasksCount] = useState(null);
  const [myRequestsCount, setMyRequestsCount] = useState(null);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    // Example: Replace with your actual API calls
    setUserTasksCount(5); // demo value
    setMyRequestsCount(2); // demo value
    setIncomingRequestsCount(3); // demo value
    setRecentActivities([
      { title: 'Task 1', type: 'task', date: Date.now() },
      { title: 'Request from John', type: 'incoming-request', by: 'John', date: Date.now() }
    ]);
    setMyRequests([
      { _id: 1, taskTitle: 'Help Move', taskOwnerName: 'Alice', status: 'accepted' },
      { _id: 2, taskTitle: 'Clean Garage', taskOwnerName: 'Bob', status: 'pending' }
    ]);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto px-2 pt-4 pb-8" style={{ background: '#f8f9fa' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg shadow bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
            <div className="flex flex-col">
              <div className="text-sm opacity-90">Your Tasks</div>
              <div className="text-3xl font-extrabold mt-2">{userTasksCount ?? '-'}</div>
              <div className="text-xs opacity-80 mt-1">Tasks you posted on Hire-a-Helper</div>
            </div>
          </div>
          <div className="p-4 rounded-lg shadow bg-gradient-to-br from-green-400 to-teal-500 text-white">
            <div className="flex flex-col">
              <div className="text-sm opacity-90">Requests Sent</div>
              <div className="text-3xl font-extrabold mt-2">{myRequestsCount ?? '-'}</div>
              <div className="text-xs opacity-80 mt-1">Requests you sent to task owners</div>
            </div>
          </div>
          <div className="p-4 rounded-lg shadow bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
            <div className="flex flex-col">
              <div className="text-sm opacity-90">Incoming Requests</div>
              <div className="text-3xl font-extrabold mt-2">{incomingRequestsCount ?? '-'}</div>
              <div className="text-xs opacity-80 mt-1">Requests for your tasks</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-3 text-indigo-700">Your Requests</h3>
          {myRequests.length === 0 ? (
            <div className="text-gray-500">No requests sent</div>
          ) : (
            <ul className="space-y-3">
              {myRequests.map((r, idx) => (
                <li key={r._id || r.id || idx} className="flex items-center justify-between border-b last:border-b-0 py-2">
                  <div>
                    <div className="text-sm font-medium">{r.taskTitle || r.title || 'Untitled Task'}</div>
                    <div className="text-xs text-gray-500">To {r.taskOwnerName || r.taskOwner || 'Unknown'}</div>
                  </div>
                  <span className={
                    `ml-2 px-3 py-1 rounded text-xs font-semibold ` +
                    (r.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      r.status === 'declined' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700')
                  }>
                    {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3 text-indigo-700">Recent Activity</h3>
          {recentActivities.length === 0 ? (
            <div className="text-gray-500">No recent activity</div>
          ) : (
            <ul className="space-y-3">
              {recentActivities.map((a, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.type === 'task' ? 'Task posted' : a.type === 'incoming-request' ? `From ${a.by}` : `To ${a.to}`}</div>
                  </div>
                  <div className="text-xs text-gray-400">{a.date ? new Date(a.date).toLocaleString() : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
