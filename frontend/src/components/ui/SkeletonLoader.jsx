
import React from 'react';

// Professional skeleton card with shimmer effect
const SkeletonCard = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded-xl bg-white shadow p-4 flex flex-col gap-4 min-h-[160px] ${className}`}>
    {/* Shimmer overlay */}
    <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent animate-shimmer" />
    <div className="flex items-center gap-3 z-10">
      <div className="h-10 w-10 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="h-3 w-1/4 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="h-4 w-2/3 bg-gray-200 rounded z-10" />
    <div className="h-3 w-full bg-gray-200 rounded z-10" />
    <div className="h-3 w-5/6 bg-gray-200 rounded z-10" />
    <div className="flex gap-2 mt-2 z-10">
      <div className="h-8 w-20 bg-gray-200 rounded" />
      <div className="h-8 w-20 bg-gray-200 rounded" />
    </div>
  </div>
);

// Main SkeletonLoader for lists
const SkeletonLoader = ({ count = 3, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonLoader;
