import React, { useEffect, useState } from 'react';
import '../../styles/admin-hacker.css';
import axios from 'axios';
import SkeletonLoader from '../ui/SkeletonLoader';

const API = import.meta.env.VITE_API_URL || '';

export default function RequestsAdmin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.get(`${API}/api/requests`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => setRequests(res.data))
      .catch(() => setError('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = id => {
    if (!window.confirm('Delete this request?')) return;
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.delete(`${API}/api/requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(() => setRequests(requests => requests.filter(r => r._id !== id)))
      .catch(() => alert('Delete failed. Please refresh.'));
  };

  if (loading) return <SkeletonLoader rows={5} cols={4} headers={["From","Task","Message","Actions"]} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="hacker-bg">
      <h2 className="text-xl font-semibold mb-4 hacker-header">Requests</h2>
      <div className="terminal-panel">
        <table className="neon-table">
          <thead>
            <tr>
              <th>From</th>
              <th>Task</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r._id}>
                <td>{r.requesterName || r.requester || '-'}</td>
                <td>{r.taskTitle || r.taskId}</td>
                <td>{r.message}</td>
                <td>
                  <button onClick={() => handleDelete(r._id)} className="neon-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
