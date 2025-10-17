import React from 'react';

// Simple reusable page header used across dashboard pages
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex items-center justify-between w-full px-0">
      <div>
        <div className="text-3xl font-bold text-zinc-800">{title}</div>
        {subtitle && <div className="text-sm text-zinc-500 mt-1">{subtitle}</div>}
      </div>
      {actions && (
        <div className="flex items-center space-x-3">
          {actions}
        </div>
      )}
    </div>
  );
}
