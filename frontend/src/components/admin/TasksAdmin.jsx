

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { ADMIN_EVENTS } from '../../utils/requestSocketEvents';
import SkeletonLoader from '../ui/SkeletonLoader';

const API = import.meta.env.VITE_API_URL || '';



export default function TasksAdmin() {
  const [tasks, setTasks] = useState(() => {
    const cached = localStorage.getItem('admin_tasks');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('admin_tasks'));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.on('admin:task-deleted', deletedTaskId => {
      setTasks(tasks => {
        const updated = tasks.filter(t => t._id !== deletedTaskId);
        localStorage.setItem('admin_tasks', JSON.stringify(updated));
        return updated;
      });
    });
    return () => {
      socket.off('admin:task-deleted');
    };
  }, []);

  // Always fetch fresh data on mount and tab switch
  useEffect(() => {
    let timer;
    setLoading(true);
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.get(`${API}/api/admin/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => {
        setTasks(res.data);
        localStorage.setItem('admin_tasks', JSON.stringify(res.data));
      })
      .catch(() => setError('Failed to load tasks'))
      .finally(() => {
        timer = setTimeout(() => setLoading(false), 1000);
      });
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = id => {
    if (!window.confirm('Delete this task?')) return;
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    let previous;
    setTasks(t => {
      previous = t;
      const updated = t.filter(x => x._id !== id);
      localStorage.setItem('admin_tasks', JSON.stringify(updated));
      return updated;
    });
    axios.delete(`${API}/api/admin/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    }).then(() => {
      // success - nothing further to do because UI already updated and socket will notify others
    }).catch(err => {
      console.error('Delete task failed', err);
      setTasks(() => {
        localStorage.setItem('admin_tasks', JSON.stringify(previous || []));
        return previous || [];
      });
      const msg = err && err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Delete failed';
      alert(msg);
    });
  };

  if (loading) return <SkeletonLoader rows={5} cols={4} headers={["Title", "Description", "User", "Actions"]} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tasks</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Title</th>
            <th className="p-2">Description</th>
            <th className="p-2">User</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t._id} className="border-t">
              <td className="p-2">{t.title}</td>
              <td className="p-2">{t.description}</td>
              <td className="p-2">{t.userId ? t.userId.name || t.userId.email : '-'}</td>
              <td className="p-2">
                <button
                  className="px-2 py-1 rounded bg-red-500 text-white"
                  onClick={() => handleDelete(t._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
