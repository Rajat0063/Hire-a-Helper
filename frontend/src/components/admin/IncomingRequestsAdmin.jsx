import React, { useEffect, useState } from 'react';
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

  const handleAction = (id, action) => {
    // action: 'accept' or 'decline'
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.patch(`${API}/api/incoming-requests/${action}/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
  }).then(() => {
      // update the status locally and disable actions
      setIncomingRequests(reqs => {
        const updated = reqs.map(r => r._id === id ? { ...r, status: action === 'accept' ? 'accepted' : 'rejected', _actionDisabled: true } : r);
        localStorage.setItem('admin_incoming_requests', JSON.stringify(updated));
        return updated;
      });
    }).catch(() => alert('Action failed. Please refresh.'));
  };

  if (loading) return <SkeletonLoader rows={5} cols={4} headers={["From","Task","Message","Actions"]} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="hacker-bg">
      <h2 className="text-xl font-semibold mb-4 hacker-header">Incoming Requests</h2>
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
            {incomingRequests.map(r => (
              <tr key={r._id}>
                <td>{r.requesterName || r.requester || '-'}</td>
                <td>{r.taskTitle || r.taskId}</td>
                <td>{r.message}</td>
                <td className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(r._id, 'accept')}
                    disabled={r._actionDisabled || r.status === 'accepted'}
                    className={`neon-btn ${r._actionDisabled || r.status === 'accepted' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {r.status === 'accepted' ? <span className="chip-accepted">Accepted</span> : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleAction(r._id, 'decline')}
                    disabled={r._actionDisabled || r.status === 'rejected'}
                    className={`neon-btn ${r._actionDisabled || r.status === 'rejected' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {r.status === 'rejected' ? <span className="chip-declined">Declined</span> : 'Decline'}
                  </button>
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
