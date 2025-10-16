
// Default avatar image (fallback)
const defaultAvatar = "https://ui-avatars.com/api/?name=User&background=random";

// Format date utility
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleString('en-US', options);
}

// Add styles for mobile responsiveness
const cardStyles = {
  container: {
    width: "100%",
    maxWidth: 400,
    margin: "0 auto 1rem auto",
    padding: "1rem",
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  actions: {
    display: "flex",
    flexDirection: "row",
    gap: "0.5rem",
    marginTop: "0.5rem",
    width: "100%",
    justifyContent: "space-between",
  },
  acceptBtn: {
    flex: 1,
    background: "#4ade80",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "0.5rem 0",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
  },
  declineBtn: {
    flex: 1,
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 6,
    padding: "0.5rem 0",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
  },
  rejectedText: {
    background: "#ef4444",
    color: "#fff",
    borderRadius: 6,
    padding: "0.25rem 0.5rem",
    fontWeight: 600,
    fontSize: "0.95rem",
    textAlign: "center",
    marginTop: "0.5rem",
    width: "fit-content",
    alignSelf: "flex-end",
  },
};

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SkeletonLoader from '../ui/SkeletonLoader';



const API = import.meta.env.VITE_API_URL || '';

export default function IncomingRequestsAdmin() {
  const [incomingRequests, setIncomingRequests] = useState([]);

  // Use localStorage cache for snappy UX, like RequestsAdmin
  useEffect(() => {
    const cached = localStorage.getItem('admin_incoming_requests');
    if (cached) {
      setIncomingRequests(JSON.parse(cached));
    }
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.get(`${API}/api/incoming-requests`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => {
        setIncomingRequests(res.data);
        localStorage.setItem('admin_incoming_requests', JSON.stringify(res.data));
      });
  }, []);


  // Accept handler
  const handleAccept = (id) => {
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.patch(`${API}/api/incoming-requests/accept/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    }).then(() => {
      setIncomingRequests(reqs => {
        const updated = reqs.map(r => r._id === id ? { ...r, status: 'accepted', _actionDisabled: true } : r);
        localStorage.setItem('admin_incoming_requests', JSON.stringify(updated));
        return updated;
      });
    }).catch(() => alert('Accept failed. Please refresh.'));
  };

  // Decline handler
  const handleDecline = (id) => {
    const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : '';
    axios.patch(`${API}/api/incoming-requests/decline/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    }).then(() => {
      setIncomingRequests(reqs => {
        const updated = reqs.map(r => r._id === id ? { ...r, status: 'rejected', _actionDisabled: true } : r);
        localStorage.setItem('admin_incoming_requests', JSON.stringify(updated));
        return updated;
      });
    }).catch(() => alert('Decline failed. Please refresh.'));
  };

  // Render
  return (
    <div className="incoming-requests-container" style={{ padding: '0 0.5rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Incoming <span>Requests</span>
        <span className="incoming-requests-subtext" style={{ display: 'block', fontSize: '1rem', fontWeight: 400 }}>
          People who want to help with your tasks
        </span>
      </h2>
      {incomingRequests.length === 0 ? (
        <div className="no-requests">No incoming requests.</div>
      ) : (
        incomingRequests.map((request, idx) => (
          <div key={request._id || idx} style={cardStyles.container}>
            <div style={cardStyles.header}>
              <img
                src={request.avatarUrl || defaultAvatar}
                alt="avatar"
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{request.username}</div>
                <div style={{ color: '#374151', fontSize: '1rem' }}>{request.message}</div>
              </div>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 6, padding: '0.5rem', margin: '0.5rem 0' }}>
              Requesting for: <b>{request.requestedFor}</b>
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              <span role="img" aria-label="calendar">📅</span> {formatDate(request.date)}
            </div>
            <div style={cardStyles.actions}>
              {request.status === "pending" ? (
                <>
                  <button
                    style={cardStyles.acceptBtn}
                    onClick={() => handleAccept(request._id)}
                  >
                    Accept
                  </button>
                  <button
                    style={cardStyles.declineBtn}
                    onClick={() => handleDecline(request._id)}
                  >
                    Decline
                  </button>
                </>
              ) : request.status === "accepted" ? (
                <span style={{ ...cardStyles.acceptBtn, background: '#4ade80', color: '#fff', cursor: 'default' }}>Accepted</span>
              ) : (
                <span style={cardStyles.rejectedText}>Rejected</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
