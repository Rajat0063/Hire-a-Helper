
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import socket from './utils/socket';
// history not needed here

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

// Global socket setup: if user is logged in, join their room and listen for forced logout
try {
  const stored = localStorage.getItem('userInfo');
  if (stored) {
    const user = JSON.parse(stored);
    if (user && user._id) {
      if (!socket.connected) socket.connect();
      socket.emit('join-user-room', user._id);
      socket.on('user:force-logout', () => {
        // Clear local auth and reload to login page
        localStorage.removeItem('userInfo');
        // If using any state managers, consider clearing them here as well
        window.location.href = '/login';
      });
    }
  }
} catch (e) {
  console.warn('Global socket setup failed:', e && e.message ? e.message : e);
}
