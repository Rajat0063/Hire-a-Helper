

import React, { useEffect, useState } from 'react';
import '../../styles/admin-hacker.css';
import axios from 'axios';
import socket from '../../utils/socket';
import { ADMIN_EVENTS } from '../../utils/requestSocketEvents';
import SkeletonLoader from '../ui/SkeletonLoader';

const API = import.meta.env.VITE_API_URL || '';



export default function AnalyticsAdmin() {
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem('admin_analytics');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('admin_analytics'));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.on(ADMIN_EVENTS.ANALYTICS_UPDATED, newAnalytics => {
      setData(newAnalytics);
      localStorage.setItem('admin_analytics', JSON.stringify(newAnalytics));
    });
    return () => {
      socket.off(ADMIN_EVENTS.ANALYTICS_UPDATED);
    };
  }, []);

  // Always fetch fresh data on mount and tab switch
  useEffect(() => {
    let timer;
    setLoading(true);
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.get(`${API}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => {
        setData(res.data);
        localStorage.setItem('admin_analytics', JSON.stringify(res.data));
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => {
        timer = setTimeout(() => setLoading(false), 1000);
      });
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SkeletonLoader count={2} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="hacker-bg">
      <h2 className="text-xl font-semibold mb-4 hacker-header">Analytics</h2>
      <div className="flex gap-8">
        <div className="terminal-panel">
          <div className="text-2xl font-bold hacker-invert">{data.userCount}</div>
          <div className="hacker-invert">Users</div>
        </div>
        <div className="terminal-panel">
          <div className="text-2xl font-bold hacker-invert">{data.taskCount}</div>
          <div className="hacker-invert">Tasks</div>
        </div>
      </div>
    </div>
  );
}
