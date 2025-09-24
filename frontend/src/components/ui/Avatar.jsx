// src/components/ui/Avatar.jsx

import React from 'react';

// Helper function to get initials from a name
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Avatar = ({ user, className = 'h-10 w-10' }) => {
  // Check if the user object and name exist
  if (!user || !user.name) {
    return (
      <div className={`${className} rounded-full bg-zinc-500 animate-pulse`} />
    );
  }

  return (
    <>
      {user.image ? (
        // If user has an image, display it
        <img 
          src={user.image} 
          alt={user.name} 
          className={`${className} rounded-full object-cover`} 
        />
      ) : (
        // Otherwise, display their initials
        <div 
          className={`${className} rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold`}
        >
          <span>{getInitials(user.name)}</span>
        </div>
      )}
    </>
  );
};

export default Avatar;