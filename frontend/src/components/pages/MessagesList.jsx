import React from "react";

const MessagesList = () => (
  <main className="flex-1 flex items-center justify-center bg-zinc-100 p-4 sm:p-6 md:p-8">
    <div className="text-center">
      <svg className="mx-auto mb-4 h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e5e7eb" opacity="0.2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 14h.01M16 10h.01" /></svg>
      <h2 className="text-2xl font-bold text-zinc-700 mb-2">Select a conversation</h2>
      <p className="text-zinc-500">Choose a chat from the sidebar to start messaging.</p>
    </div>
  </main>
);

export default MessagesList;
