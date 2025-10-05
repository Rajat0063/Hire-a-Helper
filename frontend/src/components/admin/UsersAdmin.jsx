import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/admin/users', { withCredentials: true })
      .then(res => setUsers(res.data))
      .catch(err => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleBlock = (id, block) => {
    axios.patch(`/api/admin/users/${id}/${block ? 'block' : 'unblock'}`, {}, { withCredentials: true })
      .then(res => setUsers(users => users.map(u => u._id === id ? res.data : u)))
      .catch(() => alert('Action failed'));
  };

  const handleDelete = id => {
    if (!window.confirm('Delete this user?')) return;
    axios.delete(`/api/admin/users/${id}`, { withCredentials: true })
      .then(() => setUsers(users => users.filter(u => u._id !== id)))
      .catch(() => alert('Delete failed'));
  };

  if (loading) return <div>Loading users...</div>;
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
