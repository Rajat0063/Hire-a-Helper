import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-white py-10 px-2 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold transition"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-extrabold text-indigo-800 ml-4 drop-shadow-sm">Admin Dashboard</h1>
          </div>
        </div>
        <div className="flex gap-4 mb-8 justify-center">
          {TABS.map(t => (
            <button
              key={t.value}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full shadow transition font-semibold text-lg border-2 focus:outline-none ${tab === t.value
                ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-indigo-500 scale-105'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
              onClick={() => setTab(t.value)}
            >
              {/* Optionally add icons here for each tab */}
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 min-h-[400px] border border-indigo-100">
          {tab === 'users' && <UsersAdmin />}
          {tab === 'tasks' && <TasksAdmin />}
          {tab === 'disputes' && <DisputesAdmin />}
          {tab === 'analytics' && <AnalyticsAdmin />}
        </div>
      </div>
    </div>
  );
}
