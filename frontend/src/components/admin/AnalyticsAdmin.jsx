import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AnalyticsAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/admin/analytics', { withCredentials: true })
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Analytics</h2>
      <div className="flex gap-8">
        <div className="bg-blue-100 p-4 rounded shadow">
          <div className="text-2xl font-bold">{data.userCount}</div>
          <div>Users</div>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <div className="text-2xl font-bold">{data.taskCount}</div>
          <div>Tasks</div>
        </div>
      </div>
    </div>
  );
}
