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
    <div>
      <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>

      {/* Desktop/table view (md and up) */}
      <div className="hidden md:block">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">From</th>
              <th className="p-2">Task</th>
              <th className="p-2">Message</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {incomingRequests.map(r => (
              <tr key={r._id} className="border-t">
                <td className="p-2">{r.requesterName || r.requester || '-'}</td>
                <td className="p-2">{r.taskTitle || r.taskId}</td>
                <td className="p-2">{r.message}</td>
                <td className="p-2 flex items-center gap-2">
                  <button
                    onClick={() => handleAction(r._id, 'accept')}
                    disabled={r._actionDisabled || r.status === 'accepted'}
                    className={`px-2 py-1 rounded ${r.status === 'accepted' ? 'bg-green-500 text-white' : r._actionDisabled ? 'bg-gray-300 text-gray-600' : 'bg-green-500 text-white'}`}
                  >
                    {r.status === 'accepted' ? 'Accepted' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleAction(r._id, 'decline')}
                    disabled={r._actionDisabled || r.status === 'rejected'}
                    className={`px-2 py-1 rounded ${r.status === 'rejected' ? 'bg-red-500 text-white' : r._actionDisabled ? 'bg-gray-300 text-gray-600' : 'bg-red-500 text-white'}`}
                  >
                    {r.status === 'rejected' ? 'Declined' : 'Decline'}
                  </button>
                  <button onClick={() => handleDelete(r._id)} className="px-2 py-1 rounded bg-zinc-200 text-zinc-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/card view (below md) */}
      <div className="md:hidden">
        {incomingRequests.map(r => (
          <div key={r._id} className="bg-white rounded-lg p-4 shadow mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{r.requesterName || r.requester || '-'}</div>
                <div className="text-sm text-gray-600">{r.taskTitle || r.taskId}</div>
              </div>
              <div className="text-sm text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
            </div>

            <div className="mt-3 text-gray-800">{r.message}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleAction(r._id, 'accept')}
                disabled={r._actionDisabled || r.status === 'accepted'}
                className={`flex-1 min-w-[110px] text-center px-3 py-2 rounded ${r.status === 'accepted' ? 'bg-green-500 text-white' : r._actionDisabled ? 'bg-gray-300 text-gray-600' : 'bg-green-500 text-white'}`}
              >
                {r.status === 'accepted' ? 'Accepted' : 'Accept'}
              </button>

              <button
                onClick={() => handleAction(r._id, 'decline')}
                disabled={r._actionDisabled || r.status === 'rejected'}
                className={`flex-1 min-w-[110px] text-center px-3 py-2 rounded ${r.status === 'rejected' ? 'bg-red-500 text-white' : r._actionDisabled ? 'bg-gray-300 text-gray-600' : 'bg-red-500 text-white'}`}
              >
                {r.status === 'rejected' ? 'Declined' : 'Decline'}
              </button>

              <button onClick={() => handleDelete(r._id)} className="flex-1 min-w-[110px] text-center px-3 py-2 rounded bg-zinc-200 text-zinc-800">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
