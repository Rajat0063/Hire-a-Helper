

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { ADMIN_EVENTS } from '../../utils/requestSocketEvents';
import SkeletonLoader from '../ui/SkeletonLoader';

const API = import.meta.env.VITE_API_URL || '';


export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Connect socket on mount
  useEffect(() => {
    if (!socket.connected) socket.connect();
    return () => {
      socket.off(ADMIN_EVENTS.USER_UPDATED);
      socket.off(ADMIN_EVENTS.USER_DELETED);
      // socket.disconnect(); // Don't disconnect globally, only if you want to close all sockets
    };
  }, []);

  // Listen for real-time user updates
  useEffect(() => {
    socket.on(ADMIN_EVENTS.USER_UPDATED, updatedUser => {
      setUsers(users => users.map(u => u._id === updatedUser._id ? updatedUser : u));
    });
    socket.on(ADMIN_EVENTS.USER_DELETED, deletedUserId => {
      setUsers(users => users.filter(u => u._id !== deletedUserId));
    });
    return () => {
      socket.off(ADMIN_EVENTS.USER_UPDATED);
      socket.off(ADMIN_EVENTS.USER_DELETED);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  // Optimistic UI update and emit socket event
  const handleBlock = (id, block) => {
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.patch(`${API}/api/admin/users/${id}/${block ? 'block' : 'unblock'}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => {
        setUsers(users => users.map(u => u._id === id ? res.data : u));
        socket.emit(ADMIN_EVENTS.USER_UPDATED, res.data); // Notify all admins
      })
      .catch(() => alert('Action failed'));
  };

  const handleDelete = id => {
    if (!window.confirm('Delete this user?')) return;
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.delete(`${API}/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(() => {
        setUsers(users => users.filter(u => u._id !== id));
        socket.emit(ADMIN_EVENTS.USER_DELETED, id); // Notify all admins
      })
      .catch(() => alert('Delete failed'));
  };

  if (loading) return <SkeletonLoader count={5} />;
  if (loading) return <SkeletonLoader rows={5} cols={5} headers={["Name", "Email", "Admin", "Blocked", "Actions"]} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Admin</th>
            <th className="p-2">Blocked</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.isAdmin ? 'Yes' : 'No'}</td>
              <td className="p-2">{u.isBlocked ? 'Yes' : 'No'}</td>
              <td className="p-2 flex gap-2">
                <button
                  className={`px-2 py-1 rounded ${u.isBlocked ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                  onClick={() => handleBlock(u._id, !u.isBlocked)}
                >
                  {u.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button
                  className="px-2 py-1 rounded bg-gray-700 text-white"
                  onClick={() => handleDelete(u._id)}
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
