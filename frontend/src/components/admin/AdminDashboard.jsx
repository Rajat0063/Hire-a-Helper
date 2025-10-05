import React, { useState } from 'react';
import UsersAdmin from './UsersAdmin';
import TasksAdmin from './TasksAdmin';
import DisputesAdmin from './DisputesAdmin';
import AnalyticsAdmin from './AnalyticsAdmin';

const TABS = [
  { label: 'Users', value: 'users' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Disputes', value: 'disputes' },
  { label: 'Analytics', value: 'analytics' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex gap-4 mb-6">
        {TABS.map(t => (
          <button
            key={t.value}
            className={`px-4 py-2 rounded ${tab === t.value ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded shadow p-4 min-h-[400px]">
        {tab === 'users' && <UsersAdmin />}
        {tab === 'tasks' && <TasksAdmin />}
        {tab === 'disputes' && <DisputesAdmin />}
        {tab === 'analytics' && <AnalyticsAdmin />}
      </div>
    </div>
  );
}
