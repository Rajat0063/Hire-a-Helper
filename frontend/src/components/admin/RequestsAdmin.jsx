import React, { useEffect, useState } from 'react';
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
    <div>
      <h2 className="text-xl font-semibold mb-4">Requests</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">From</th>
            <th className="p-2">Task</th>
            <th className="p-2">Message</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r._id} className="border-t">
              <td className="p-2">{r.requesterName || r.requester || '-'}</td>
              <td className="p-2">{r.taskTitle || r.taskId}</td>
              <td className="p-2">{r.message}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === 'accepted' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'}</span>
              </td>
              <td className="p-2">
                <button
                  onClick={() => handleDelete(r._id)}
                  className="px-2 py-1 rounded bg-red-500 text-white disabled:opacity-50"
                  disabled={r.status !== 'pending'}
                  title={r.status !== 'pending' ? 'Cannot delete after decision' : ''}
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
