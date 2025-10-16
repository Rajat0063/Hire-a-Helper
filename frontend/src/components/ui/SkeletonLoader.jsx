
import React from 'react';



const AdminTableSkeleton = ({ rows = 5, cols = 5, headers = [] }) => (
  <div className="overflow-x-auto">
    <div className="w-full border rounded-lg terminal-panel">
      {headers.length > 0 && (
        <div className="w-full border-b pb-3 mb-3">
          <div className="grid grid-cols-12 gap-4 px-2">
            {headers.map((header, i) => (
              <div key={i} className="col-span-3 font-mono text-sm" style={{ color: 'rgba(57,255,20,0.7)' }}>{header}</div>
            ))}
          </div>
        </div>
      )}
      <div className="px-2 pb-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 py-3 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="col-span-3">
                <div className="hacker-skeleton" style={{ height: 18 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Analytics tab: skeleton cards styled like analytics cards
const AdminAnalyticsSkeleton = () => (
  <div className="flex gap-8">
    <div className="terminal-panel p-6 rounded-2xl w-40 h-28 flex flex-col justify-center items-center">
      <div className="hacker-skeleton" style={{ height: 28, width: 60 }} />
      <div className="hacker-skeleton mt-3" style={{ height: 16, width: 80 }} />
    </div>
    <div className="terminal-panel p-6 rounded-2xl w-40 h-28 flex flex-col justify-center items-center">
      <div className="hacker-skeleton" style={{ height: 28, width: 60 }} />
      <div className="hacker-skeleton mt-3" style={{ height: 16, width: 80 }} />
    </div>
  </div>
);

export default function SkeletonLoader({ type = 'table', rows = 5, cols = 5 }) {
  if (type === 'analytics') return <AdminAnalyticsSkeleton />;
  return <AdminTableSkeleton rows={rows} cols={cols} />;
}
