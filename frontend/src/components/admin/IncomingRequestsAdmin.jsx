import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SkeletonLoader from '../ui/SkeletonLoader';

const API = import.meta.env.VITE_API_URL || '';

function Avatar({ src, name }) {
  if (src) return <img src={src} alt={name || 'avatar'} className="w-8 h-8 rounded-full object-cover" />;
  const initials = (name || '').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
  return <div className="w-8 h-8 rounded-full bg-gray-300 text-sm flex items-center justify-center">{initials || '?'}</div>;
}

export default function IncomingRequestsAdmin() {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const cached = localStorage.getItem('admin_incoming_requests');
    if (cached) {
      try { setIncomingRequests(JSON.parse(cached)); } catch { console.warn('Failed to parse cached incoming requests'); }
      setTimeout(() => setLoading(false), 500);
    }

    const tokenRaw = localStorage.getItem('userInfo');
    const parsed = tokenRaw ? JSON.parse(tokenRaw) : null;
    const token = parsed ? parsed.token : '';

    // Choose endpoint: admin users can list all incoming requests, regular users fetch only their received requests
    const isAdmin = parsed && (parsed.isAdmin || parsed.user?.isAdmin);
    const userIdForReceived = parsed && (parsed.user?._id || parsed.user?.id || parsed._id || parsed.id);

    const endpoint = isAdmin ? `${API}/api/incoming-requests` : `${API}/api/incoming-requests/received/${userIdForReceived || ''}`;

    axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => {
  const data = Array.isArray(res.data) ? res.data : [];
  setIncomingRequests(data);
        try { localStorage.setItem('admin_incoming_requests', JSON.stringify(data)); } catch { console.warn('Failed to cache incoming requests'); }
      })
      .catch((err) => {
        console.error('Incoming requests load error:', err && err.message ? err.message : err);
        setError('Failed to load incoming requests');
      })
      .finally(() => {
        if (!cached) setTimeout(() => setLoading(false), 500);
      });
  }, []);

  const handleDelete = id => {
    if (!window.confirm('Delete this incoming request?')) return;
    const tokenRaw = localStorage.getItem('userInfo');
    const token = tokenRaw ? JSON.parse(tokenRaw).token : '';
    axios.delete(`${API}/api/incoming-requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(() => {
        setIncomingRequests(reqs => {
          const updated = reqs.filter(r => (r._id || r.id) !== id);
          try { localStorage.setItem('admin_incoming_requests', JSON.stringify(updated)); } catch { console.warn('Failed to update cached incoming requests'); }
          return updated;
        });
      })
      .catch(err => {
        console.error('Delete incoming request failed:', err && err.message ? err.message : err);
        alert('Delete failed. Please refresh.');
      });
  };

  if (loading) return <SkeletonLoader rows={5} cols={6} headers={["From","Email","Task","Message","Created","Actions"]} />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
      {incomingRequests.length === 0 ? (
        <div className="p-6 bg-white rounded shadow text-center">
          <div className="text-2xl font-semibold mb-2">No incoming requests</div>
          <div className="text-sm text-gray-600">You don't have any incoming requests right now. When someone requests your help, they'll appear here.</div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3">From</th>
                <th className="p-3">Email</th>
                <th className="p-3">Task</th>
                <th className="p-3">Message</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomingRequests.map(r => {
                const id = r._id || r.id;
                const requesterName = (r.requester && r.requester.name) || r.requesterName || (r.requester && (r.requester.name || r.requester)) || '-';
                const requesterEmail = (r.requester && r.requester.email) || r.requesterEmail || '-';
                const requesterImage = (r.requester && r.requester.image) || r.requesterImage || '';
                const taskTitle = (r.task && r.task.title) || r.taskTitle || '-';
                const message = r.message || '-';
                const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : '-';
                return (
                  <tr key={id} className="border-t">
                    <td className="p-3 flex items-center gap-3">
                      <Avatar src={requesterImage} name={requesterName} />
                      <div>
                        <div className="font-medium">{requesterName}</div>
                        <div className="text-xs text-gray-500">{requesterEmail}</div>
                      </div>
                    </td>
                    <td className="p-3">{requesterEmail}</td>
                    <td className="p-3">{taskTitle}</td>
                    <td className="p-3">{message}</td>
                    <td className="p-3 text-sm text-gray-600">{created}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(id)} className="px-3 py-1 rounded bg-red-500 text-white text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
