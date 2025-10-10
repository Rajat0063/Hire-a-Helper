import React, { useEffect, useState } from 'react';
import socket from '../../utils/socket';
import { ADMIN_EVENTS } from '../../utils/requestSocketEvents';
import axios from 'axios';
import SkeletonLoader from '../ui/SkeletonLoader';

const API = import.meta.env.VITE_API_URL || '';

export default function IncomingRequestsAdmin() {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use localStorage cache for snappy UX, like RequestsAdmin
  useEffect(() => {
    setLoading(true);
    const cached = localStorage.getItem('admin_incoming_requests');
    if (cached) {
      setIncomingRequests(JSON.parse(cached));
      // Always show skeleton for at least 1s
      setTimeout(() => setLoading(false), 1000);
    }
    // connect socket and listen for new incoming requests created elsewhere
    if (!socket.connected) socket.connect();
    socket.on(ADMIN_EVENTS.INCOMING_REQUEST_CREATED, newReq => {
      setIncomingRequests(prev => {
        const next = [newReq, ...prev];
        localStorage.setItem('admin_incoming_requests', JSON.stringify(next));
        return next;
      });
    });
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.get(`${API}/api/incoming-requests`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => {
        setIncomingRequests(res.data);
        localStorage.setItem('admin_incoming_requests', JSON.stringify(res.data));
      })
      .catch(() => setError('Failed to load incoming requests'))
      .finally(() => {
        // If no cache, show loader for 1s; else, loader already hidden
        if (!cached) setTimeout(() => setLoading(false), 1000);
      });
    return () => {
      socket.off(ADMIN_EVENTS.INCOMING_REQUEST_CREATED);
    };
  }, []);

  const handleDelete = id => {
    if (!window.confirm('Delete this incoming request?')) return;
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.delete(`${API}/api/incoming-requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(() => {
        setIncomingRequests(reqs => {
          const updated = reqs.filter(r => r._id !== id);
          localStorage.setItem('admin_incoming_requests', JSON.stringify(updated));
          return updated;
        });
      })
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
