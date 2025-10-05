
import React from 'react';



// Users/Tasks tab: skeleton row styled like table row with rounded bg and spacing
const AdminTableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center bg-white rounded-lg shadow-sm px-2 py-3 gap-2 animate-pulse">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 bg-gray-200 rounded w-full mx-1" style={{ flex: 1 }} />
        ))}
      </div>
    ))}
  </div>
);

// Analytics tab: skeleton cards styled like analytics cards
const AdminAnalyticsSkeleton = () => (
  <div className="flex gap-8">
    <div className="bg-blue-100 p-6 rounded-2xl shadow w-32 h-24 flex flex-col justify-center items-center animate-pulse">
      <div className="h-8 w-12 bg-blue-200 rounded mb-2" />
      <div className="h-4 w-16 bg-blue-200 rounded" />
    </div>
    <div className="bg-green-100 p-6 rounded-2xl shadow w-32 h-24 flex flex-col justify-center items-center animate-pulse">
      <div className="h-8 w-12 bg-green-200 rounded mb-2" />
      <div className="h-4 w-16 bg-green-200 rounded" />
    </div>
  </div>
);

export default function SkeletonLoader({ type = 'table', rows = 5, cols = 5 }) {
  if (type === 'analytics') return <AdminAnalyticsSkeleton />;
  return <AdminTableSkeleton rows={rows} cols={cols} />;
}
