import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import UsersAdmin from './UsersAdmin';
import TasksAdmin from './TasksAdmin';
import DisputesAdmin from './DisputesAdmin';
import AnalyticsAdmin from './AnalyticsAdmin';
import AdminOverview from './AdminOverview';
import RequestsAdmin from './RequestsAdmin';
import IncomingRequestsAdmin from './IncomingRequestsAdmin';

const TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Users', value: 'users' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Requests', value: 'requests' },
  { label: 'Incoming Requests', value: 'incomingrequests' },
  { label: 'Disputes', value: 'disputes' },
  { label: 'Analytics', value: 'analytics' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-white py-4 px-2 sm:px-8 flex flex-col items-center w-full">
      <div className="w-full max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold transition w-full sm:w-auto justify-center"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-800 drop-shadow-sm text-center w-full sm:w-auto">Admin Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 justify-center">
          {TABS.map(t => (
            <button
              key={t.value}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full shadow transition font-semibold text-base sm:text-lg border-2 focus:outline-none ${tab === t.value
                ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-indigo-500 scale-105'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
  <div className="bg-white/95 rounded-2xl shadow-2xl p-4 sm:p-8 min-h-[300px] sm:min-h-[400px] border border-indigo-200 overflow-x-auto transition-all duration-300">
          {tab === 'overview' && <AdminOverview />}
          {tab === 'users' && <UsersAdmin />}
          {tab === 'tasks' && <TasksAdmin />}
          {tab === 'requests' && <RequestsAdmin />}
          {tab === 'incomingrequests' && <IncomingRequestsAdmin />}
          {tab === 'disputes' && <DisputesAdmin />}
          {tab === 'analytics' && <AnalyticsAdmin />}
        </div>
        {/* Friendly admin info message */}
        <div className="mt-4 text-center text-sm text-indigo-700 bg-indigo-50 rounded-lg px-4 py-2 shadow-sm font-medium">
          Welcome, Admin! Manage users, tasks, and analytics in real time. <span className="text-indigo-400">All changes are instantly reflected for your team.</span>
        </div>
      </div>
    </div>
  );
}


