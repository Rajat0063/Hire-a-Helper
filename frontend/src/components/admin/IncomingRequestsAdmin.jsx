import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SkeletonLoader from '../ui/SkeletonLoader';

const API = import.meta.env.VITE_API_URL || '';

export default function IncomingRequestsAdmin() {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.get(`${API}/api/incoming-requests`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => setIncomingRequests(res.data))
      .catch(() => setError('Failed to load incoming requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = id => {
    if (!window.confirm('Delete this incoming request?')) return;
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.delete(`${API}/api/incoming-requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(() => setIncomingRequests(reqs => reqs.filter(r => r._id !== id)))
      .catch(() => alert('Delete failed. Please refresh.'));
  };

  if (loading) return <SkeletonLoader rows={5} cols={4} headers={["From","Task","Message","Actions"]} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Incoming Requests</h2>
      <table className="min-w-full bg-white border rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th className="px-4 py-2">From</th>
            <th className="px-4 py-2">Task</th>
            <th className="px-4 py-2">Message</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {incomingRequests.map(r => (
            <tr key={r._id} className="border-t">
              <td className="px-4 py-2">{r.requesterName}</td>
              <td className="px-4 py-2">{r.taskTitle || r.taskId}</td>
              <td className="px-4 py-2">{r.message}</td>
              <td className="px-4 py-2">
                <button onClick={() => handleDelete(r._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
