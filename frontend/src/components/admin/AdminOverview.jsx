import React, { useEffect, useState } from 'react';
import '../../styles/admin-hacker.css';
import socket from '../../utils/socket';
import { ADMIN_EVENTS } from '../../utils/requestSocketEvents';
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

    // Socket listeners for realtime admin updates
    if (!socket.connected) socket.connect();
    socket.off(ADMIN_EVENTS.ACTION_CREATED);
    socket.off(ADMIN_EVENTS.ANALYTICS_UPDATED);
    socket.on(ADMIN_EVENTS.ACTION_CREATED, (newAction) => {
      setActions(prev => {
        const updated = [newAction, ...prev].slice(0, 20);
        localStorage.setItem('admin_actions', JSON.stringify(updated));
        return updated;
      });
    });
    socket.on(ADMIN_EVENTS.ANALYTICS_UPDATED, (newAnalytics) => {
      setAnalytics(newAnalytics);
      localStorage.setItem('admin_analytics', JSON.stringify(newAnalytics));
    });

    return () => {
      clearTimeout(timer);
      socket.off(ADMIN_EVENTS.ACTION_CREATED);
      socket.off(ADMIN_EVENTS.ANALYTICS_UPDATED);
    };
  }, []);

  if (loading) return <SkeletonLoader rows={3} cols={3} headers={["Metric","Value",""]} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="hacker-bg">
      <h2 className="text-2xl font-bold mb-4 hacker-header">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="terminal-panel">
          <div className="text-sm hacker-invert">Users</div>
          <div className="text-3xl font-extrabold hacker-invert">{analytics?.userCount ?? '-'}</div>
        </div>
        <div className="terminal-panel">
          <div className="text-sm hacker-invert">Tasks</div>
          <div className="text-3xl font-extrabold hacker-invert">{analytics?.taskCount ?? '-'}</div>
        </div>
        <div className="terminal-panel">
          <div className="text-sm hacker-invert">Recent Actions</div>
          <div className="text-3xl font-extrabold hacker-invert">{actions.length}</div>
        </div>
      </div>

      <div className="terminal-panel">
        <h3 className="font-semibold mb-3 hacker-invert">Recent Admin Activity</h3>
        {actions.length === 0 ? (
          <div className="hacker-invert">No recent actions</div>
        ) : (
          <ul className="space-y-2">
            {actions.map(a => (
              <li key={a._id} className="flex items-start justify-between">
                <div>
                  <div className="text-sm hacker-invert">{a.actionType.replace('_', ' ')} on <span className="font-medium hacker-invert">{a.targetType}</span></div>
                  <div className="text-xs hacker-invert">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm hacker-invert">by {a.adminId ? (a.adminId.name || a.adminId) : 'unknown'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
