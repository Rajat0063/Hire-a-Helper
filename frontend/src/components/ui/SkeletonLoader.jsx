
import React from 'react';



const AdminTableSkeleton = ({ rows = 5, cols = 5, headers = [] }) => (
  <div className="overflow-x-auto">
    <table className="w-full border rounded-lg bg-white animate-pulse">
      {headers.length > 0 && (
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, i) => (
              <th key={i} className="p-2 text-left font-semibold text-gray-500">{header}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-t">
            {Array.from({ length: cols }).map((_, j) => (
              <td key={j} className="p-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
