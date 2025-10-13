import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function DashboardOverview() {
  const [userTasksCount, setUserTasksCount] = useState(null);
  const [myRequestsCount, setMyRequestsCount] = useState(null);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const stored = localStorage.getItem('userInfo');
      if (!stored) {
        // No user in localStorage — stop loading and bail (user likely logged out)
        console.warn('No userInfo in localStorage while loading Overview');
        setLoading(false);
        return;
      }
      const user = JSON.parse(stored);
      try {
        // Tasks (public endpoint) - client-side filter for tasks created by this user
        const tasksRes = await fetch(`${API}/api/tasks`);
        const tasks = await tasksRes.json();
        const userTasks = tasks.filter(t => (t.userId && t.userId._id === user._id) || t.postedByName === user.name || t.userId === user._id);
        setUserTasksCount(userTasks.length);

        // My sent requests
        const myReqRes = await fetch(`${API}/api/incoming-requests-sent/sent/${user._id}`);
        const myReq = await myReqRes.json();
  setMyRequestsCount(Array.isArray(myReq) ? myReq.length : 0);
  setMyRequests(Array.isArray(myReq) ? myReq : []);

        // Incoming requests for tasks owned by user
        const incRes = await fetch(`${API}/api/incoming-requests/received/${user._id}`);
        const inc = await incRes.json();
        setIncomingRequestsCount(Array.isArray(inc) ? inc.length : 0);

        // Build recent activity list from requests and tasks
        const activities = [];
        (inc || []).slice(0, 5).forEach(r => activities.push({ type: 'incoming-request', title: r.taskTitle || 'Request', by: r.requesterName || r.requester?.name, date: r.createdAt }));
        (myReq || []).slice(0, 5).forEach(r => activities.push({ type: 'sent-request', title: r.taskTitle || 'Request', to: r.taskOwnerName || r.taskOwner?.name, date: r.createdAt }));
        userTasks.slice(0, 6).forEach(t => activities.push({ type: 'task', title: t.title, date: t.createdAt }));

        // Sort recent activities by date desc and keep 8
        activities.sort((a,b) => new Date(b.date) - new Date(a.date));
        setRecentActivities(activities.slice(0,8));
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-3/4 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg shadow bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
          <div className="text-sm opacity-90">Your Tasks</div>
          <div className="text-3xl font-extrabold mt-2">{userTasksCount ?? '-'}</div>
          <div className="text-xs opacity-80 mt-1">Tasks you posted on Hire-a-Helper</div>
        </div>
        <div className="p-4 rounded-lg shadow bg-gradient-to-br from-green-400 to-teal-500 text-white">
          <div className="text-sm opacity-90">Requests Sent</div>
          <div className="text-3xl font-extrabold mt-2">{myRequestsCount ?? '-'}</div>
          <div className="text-xs opacity-80 mt-1">Requests you sent to task owners</div>
        </div>
        <div className="p-4 rounded-lg shadow bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
          <div className="text-sm opacity-90">Incoming Requests</div>
          <div className="text-3xl font-extrabold mt-2">{incomingRequestsCount ?? '-'}</div>
          <div className="text-xs opacity-80 mt-1">Requests for your tasks</div>
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
  );
}
