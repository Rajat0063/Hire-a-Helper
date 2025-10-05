
import React from 'react';


// Table-style skeleton loader for admin dashboard
const SkeletonTableRow = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-2 py-3">
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

const SkeletonTable = ({ rows = 5, cols = 5, className = '' }) => (
  <table className={`w-full ${className}`}>
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </tbody>
  </table>
);

// Analytics-style skeleton
const SkeletonAnalytics = () => (
  <div className="flex gap-8">
    <div className="bg-blue-100 p-4 rounded shadow w-32 h-20 flex flex-col justify-center items-center animate-pulse">
      <div className="h-6 w-10 bg-blue-200 rounded mb-2" />
      <div className="h-3 w-14 bg-blue-200 rounded" />
    </div>
    <div className="bg-green-100 p-4 rounded shadow w-32 h-20 flex flex-col justify-center items-center animate-pulse">
      <div className="h-6 w-10 bg-green-200 rounded mb-2" />
      <div className="h-3 w-14 bg-green-200 rounded" />
    </div>
  </div>
);

export default function SkeletonLoader({ type = 'table', rows = 5, cols = 5, ...props }) {
  if (type === 'analytics') return <SkeletonAnalytics />;
  return <SkeletonTable rows={rows} cols={cols} {...props} />;
}
