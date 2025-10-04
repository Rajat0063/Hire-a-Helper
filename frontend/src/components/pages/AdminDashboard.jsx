import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ userCount: 0, taskCount: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, tasksRes, statsRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/tasks'),
          axios.get('/api/admin/stats'),
        ]);
        setUsers(usersRes.data);
        setTasks(tasksRes.data);
        setStats(statsRes.data);
      } catch (err) {
        // Handle error
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading admin dashboard...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex gap-4 mb-6">
        <button className={`px-4 py-2 rounded ${tab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('users')}>Users</button>
        <button className={`px-4 py-2 rounded ${tab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('tasks')}>Tasks</button>
        <button className={`px-4 py-2 rounded ${tab === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('stats')}>Analytics</button>
      </div>
      {tab === 'users' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">All Users</h2>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Role</th>
                <th className="border px-2 py-1">Blocked</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td className="border px-2 py-1">{user.name}</td>
                  <td className="border px-2 py-1">{user.email}</td>
                  <td className="border px-2 py-1">{user.role}</td>
                  <td className="border px-2 py-1">{user.blocked ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'tasks' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">All Tasks</h2>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Title</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Created By</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id}>
                  <td className="border px-2 py-1">{task.title}</td>
                  <td className="border px-2 py-1">{task.status || '-'}</td>
                  <td className="border px-2 py-1">{task.createdBy || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'stats' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <div className="flex gap-8">
            <div className="bg-blue-100 p-4 rounded shadow">
              <div className="text-lg font-bold">Users</div>
              <div className="text-2xl">{stats.userCount}</div>
            </div>
            <div className="bg-green-100 p-4 rounded shadow">
              <div className="text-lg font-bold">Tasks</div>
              <div className="text-2xl">{stats.taskCount}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
