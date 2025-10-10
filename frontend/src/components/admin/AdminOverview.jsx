import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SkeletonLoader from '../ui/SkeletonLoader';

const API = import.meta.env.VITE_API_URL || '';

export default function AdminOverview() {
  const [analytics, setAnalytics] = useState(() => {
    const cached = localStorage.getItem('admin_analytics');
    return cached ? JSON.parse(cached) : null;
  });
  const [actions, setActions] = useState(() => {
    const cached = localStorage.getItem('admin_actions');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('admin_analytics'));
  const [error, setError] = useState(null);

  useEffect(() => {
    let timer;
    setLoading(true);
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.get(`${API}/api/admin/analytics`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true })
      .then(res => {
        setAnalytics(res.data);
        localStorage.setItem('admin_analytics', JSON.stringify(res.data));
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => {
        timer = setTimeout(() => setLoading(false), 1000);
      });

    // fetch actions
    axios.get(`${API}/api/admin/actions`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true })
      .then(res => {
        setActions(res.data.slice(0, 20));
        localStorage.setItem('admin_actions', JSON.stringify(res.data.slice(0, 20)));
      })
      .catch(() => console.warn('Failed to load admin actions'));

    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SkeletonLoader rows={3} cols={3} headers={["Metric","Value",""]} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Users</div>
          <div className="text-3xl font-extrabold">{analytics?.userCount ?? '-'}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Tasks</div>
          <div className="text-3xl font-extrabold">{analytics?.taskCount ?? '-'}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Recent Actions</div>
          <div className="text-3xl font-extrabold">{actions.length}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Recent Admin Activity</h3>
        {actions.length === 0 ? (
          <div className="text-gray-500">No recent actions</div>
        ) : (
          <ul className="space-y-2">
            {actions.map(a => (
              <li key={a._id} className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-700">{a.actionType.replace('_', ' ')} on <span className="font-medium">{a.targetType}</span></div>
                  <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-500">by {a.adminId ? (a.adminId.name || a.adminId) : 'unknown'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
