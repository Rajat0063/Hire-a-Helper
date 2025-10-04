import SkeletonLoader from '../ui/SkeletonLoader';
// src/layouts/DashboardLayout.jsx

// FIXED: Imported 'useCallback'
import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

// Layout Components

import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

// UI Components
import { Icon, AddTaskIcon } from '../ui/Icon';
import RequestModal from '../ui/RequestModal';

// Toast component
function Toast({ show, type, message, onClose }) {
    if (!show) return null;
    const color = type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-700' : 'bg-gradient-to-r from-red-500 to-red-700';
    const icon = type === 'success' ? (
        <svg className="w-7 h-7 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e" opacity="0.2" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    ) : (
        <svg className="w-7 h-7 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444" opacity="0.2" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    );
    return (
        <div className={`fixed top-8 left-1/2 z-50 flex items-center px-7 py-5 rounded-2xl shadow-2xl text-white ${color} animate-toastFade border-2 border-white/20`} style={{ minWidth: '340px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', transform: 'translateX(-50%)' }}>
            <div className="flex items-center justify-center rounded-full bg-white/10 p-2 mr-4">{icon}</div>
            <span className="font-semibold text-lg flex-1 text-center tracking-wide drop-shadow-sm">{message}</span>
            <button className="ml-6 text-white text-2xl font-bold hover:text-zinc-200 transition" onClick={onClose}>&#10005;</button>
        </div>
    );
}

// Notification bar for requester
function RequesterNotificationBar({ notification, onClick, onClose }) {
    if (!notification) return null;
    const isDeclined = notification.type === 'request-declined';
    return (
        <div
            className={`text-white py-2 px-4 font-semibold z-40 mt-4 mb-4 mx-4 rounded-lg shadow-lg cursor-pointer transition flex items-center justify-between ${isDeclined ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={onClick}
        >
            <span className="w-full text-center">{notification.message}</span>
            <button className="ml-4 text-white text-lg font-bold" onClick={e => { e.stopPropagation(); onClose(); }}>&#10005;</button>
        </div>
    );
}

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Notification for requester
    const [requesterNotification, setRequesterNotification] = useState(null);
    
    // --- STATE MANAGEMENT (No changes here) ---
    // Initialize sidebar open state based on viewport width: collapsed on small screens
    const getInitialSidebarState = () => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth > 768; // >768px open, <=768px collapsed (mobile)
    };
    const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);
    const [feedTasks, setFeedTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [tasksData, setTasksData] = useState({ todo: [], inProgress: [], done: [] });
    const [requests, setRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [requestCount, setRequestCount] = useState(0);
    // Force user to null for skeleton loader testing
    const [user, setUser] = useState(null);
    // Uncomment the next line to always show the skeleton loader for testing
    // user = null;
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    // Notification bar state
    const [showNotificationBar, setShowNotificationBar] = useState(false);
    const [newRequesters, setNewRequesters] = useState([]);
    const prevRequestCount = useRef(0);
    // Track if notification should persist until Requests page is visited
    const [notificationActive, setNotificationActive] = useState(false);
    const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [feedLoading, setFeedLoading] = useState(true);
    const isFirstFeedLoad = useRef(true);

    // --- HANDLER FUNCTIONS (REFACTORED WITH useCallback) ---

    // REFACTORED: Logs the user out with confirmation
    const handleLogout = useCallback(() => {
        if (window.confirm("Are you sure you want to log out?")) {
            localStorage.removeItem('userInfo');
            navigate('/login', { replace: true });
        }
    }, [navigate]); // Dependency: this function depends on 'navigate'

    // REFACTORED: Function to fetch tasks from the server
    // Fetch tasks from backend and map to frontend format
    const fetchTasks = useCallback(async (isInitial = false) => {
        if (isInitial) setFeedLoading(true);
        try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            // Debug: Log raw backend response
            console.log('Raw /api/tasks response:', data);
            // Map backend fields to frontend expected fields
            const mappedTasks = data.map(task => ({
                id: task._id || task.id,
                title: task.title,
                type: task.category || task.type || 'other',
                description: task.description,
                date: `Posted ${task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`,
                startTime: task.startTime || '',
                endTime: task.endTime || '',
                location: task.location || '',
                user: task.postedByName || task.user || (user && user.name) || 'Unknown',
                userId: task.userId || task.ownerId || task.postedById || '',
                userImage: task.userImageUrl || task.userImage || '',
                image: task.imageUrl || task.image || '',
            }));
            // Debug: Log mapped tasks
            console.log('Mapped feedTasks:', mappedTasks);
            setFeedTasks(mappedTasks);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setFeedLoading(false);
            isFirstFeedLoad.current = false;
        }
    }, [user]);

    // --- EFFECTS (FIXED with correct dependencies) ---

    // FIXED: Load user data from localStorage
    useEffect(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            try {
                const parsedUser = JSON.parse(storedUserInfo);
                setUser(parsedUser);
                // Always store token in localStorage as 'userToken' for PATCH profile
                if (parsedUser.token) {
                    localStorage.setItem('userToken', parsedUser.token);
                } else if (parsedUser && parsedUser.token === undefined && parsedUser._id) {
                    // fallback: try to get token from userToken or force logout
                    const fallbackToken = localStorage.getItem('userToken');
                    if (!fallbackToken) handleLogout();
                }
            } catch (error) {
                console.error("Failed to parse user info from localStorage:", error);
                handleLogout();
            }
        } else {
            navigate('/login');
        }
    }, [navigate, handleLogout]);

    // Disable browser Back navigation while user is logged in
    useEffect(() => {
        if (!user) return;
        // Push initial state so back returns to same location
        try {
            window.history.pushState(null, null, window.location.href);
        } catch (err) {
            // some environments may throw, ignore — log for debugging
            console.debug('history.pushState not supported or failed:', err);
        }

        const onPopState = () => {
            // Push state again to prevent going back
            try {
                window.history.pushState(null, null, window.location.href);
            } catch (e) {
                console.error('Failed to push history state to disable back:', e);
            }
        };

        window.addEventListener('popstate', onPopState);
        return () => {
            window.removeEventListener('popstate', onPopState);
        };
    }, [user]);

    // FIXED: useEffect for polling
    useEffect(() => {
        fetchTasks(true); // Initial load shows skeleton
        const intervalId = setInterval(() => fetchTasks(false), 5000); // Polling does not show skeleton
        return () => clearInterval(intervalId);
    }, [fetchTasks]); // FIXED: Added 'fetchTasks' as a dependency

    // Notification effect: show bar if new unseen incoming requests arrive
    useEffect(() => {
        if (!user) return;
        const unseenRequests = requests.filter(r => !(r.seenBy && r.seenBy.includes(user._id)));
        setRequestCount(unseenRequests.length);
        if (unseenRequests.length > prevRequestCount.current) {
            // Find new requester names
            const newOnes = unseenRequests.slice(0, unseenRequests.length - prevRequestCount.current).map(r => r.requesterName || r.requester?.name || 'Someone');
            setNewRequesters(newOnes);
            setShowNotificationBar(true);
            setNotificationActive(true);
        }
        prevRequestCount.current = unseenRequests.length;
    }, [requests, user]);

    // Mark requests as seen and hide notification when user visits Requests page (Incoming Requests)
    useEffect(() => {
        const path = location.pathname;
        if (path.endsWith('/requests')) {
            setShowNotificationBar(false);
            setNotificationActive(false);
            setNewRequesters([]);
            // Mark all unseen requests as seen
            if (user && requests.length) {
                const unseenRequestIds = requests
                    .filter(r => !(r.seenBy && r.seenBy.includes(user._id)))
                    .map(r => r._id || r.id);
                if (unseenRequestIds.length) {
                    fetch('/api/incoming-requests/mark-seen', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user._id, requestIds: unseenRequestIds }),
                    }).catch(err => console.error('Failed to mark requests as seen:', err));
                }
            }
        }
    }, [location.pathname, user, requests]);
    

    // Fetch incoming requests for the current user (task owner)
    const fetchIncomingRequests = useCallback(async () => {
        if (!user) return;
        setRequestsLoading(true);
        try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/incoming-requests/received/${user._id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch incoming requests:', error);
        } finally {
            setRequestsLoading(false);
        }
    }, [user]);


    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Keep sidebar responsive: collapse when screen is small
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onResize = () => {
            if (window.innerWidth <= 768 && isSidebarOpen) {
                setIsSidebarOpen(false);
            } else if (window.innerWidth > 768 && !isSidebarOpen) {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [isSidebarOpen]);

    const handleOpenRequestModal = useCallback((task) => {
        setSelectedTask(task);
        setIsRequestModalOpen(true);
    }, []);

    const handleUserUpdate = useCallback(async (updatedUserData) => {
        // Optimistic UI: update user context immediately
    // Only show success toast after backend confirms
        try {
            // Remove email from update payload to avoid backend rejection
            const { email: _email, ...safeData } = updatedUserData;
            let token = (user && user.token) || localStorage.getItem('userToken');
            if (!token) {
                const storedUserInfo = localStorage.getItem('userInfo');
                if (storedUserInfo) {
                    const parsedUser = JSON.parse(storedUserInfo);
                    token = parsedUser.token;
                }
            }
            if (!token) throw new Error('No auth token found. Please log in again.');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(safeData)
            });
            if (!response.ok) {
                let errorMessage = 'Failed to update profile';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // If not JSON, keep default message
                }
                throw new Error(errorMessage);
            }
            let updatedUser = null;
            try {
                updatedUser = await response.json();
            } catch {
                // If no JSON, fallback to optimistic update
                updatedUser = { ...user, ...updatedUserData };
            }
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            if (updatedUser.token) localStorage.setItem('userToken', updatedUser.token);
            setToast({ show: true, type: 'success', message: 'Profile updated!' });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 2000);
        } catch (error) {
            setToast({ show: true, type: 'error', message: 'Failed to update profile: ' + (error.message || '') });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
        }
    }, [user]);


    // Add a new task and persist to backend
    const handleAddTask = useCallback(async (newTaskData) => {
        if (!user) return;
        try {
            // Convert startTime and endTime to ISO strings if present
            const startTimeISO = newTaskData.startTime ? new Date(newTaskData.startTime).toISOString() : undefined;
            const endTimeISO = newTaskData.endTime ? new Date(newTaskData.endTime).toISOString() : undefined;
            const payload = {
                title: newTaskData.title,
                description: newTaskData.description,
                category: newTaskData.type || 'other',
                location: newTaskData.location,
                postedByName: user.name,
                imageUrl: newTaskData.image || '',
                userImageUrl: user.image || '',
                startTime: startTimeISO,
                endTime: endTimeISO,
            };
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to post task');
            }
            await fetchTasks();
            navigate('/dashboard/feed');
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Could not add the task. Please try again.\n" + (error.message || ''));
        }
    }, [user, navigate, fetchTasks]);


    // Fetch requests sent by the current user (My Requests) from incomingrequests collection
    const fetchMyRequests = useCallback(async () => {
        if (!user) return;
        try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/incoming-requests-sent/sent/${user._id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setMyRequests(data);
        } catch (error) {
            console.error('Failed to fetch my requests:', error);
        }
    }, [user]);


    // Always fetch myRequests and incoming requests on user change and page load
    useEffect(() => {
        fetchMyRequests();
        fetchIncomingRequests();
        // Fetch notifications for requester

        if (user) {
            fetch(`${import.meta.env.VITE_API_URL}/api/incoming-requests/notifications/${user._id}`)
                .then(res => res.json())
                .then(() => {
                    // Show the latest unread accepted or declined notification
                    // const latest = data.find(n => (n.type === 'request-accepted' || n.type === 'request-declined') && !n.isRead);
                    // You can handle the latest notification here if needed
                });
        }

        // --- SOCKET.IO REAL-TIME REQUESTS & NOTIFICATIONS ---
        let socket;
        if (user && user._id) {
            // Connect to socket server using env config with sensible fallback
            const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';
            socket = io(socketUrl);
            // Listen for real-time updates to incoming requests (for task owner)
            socket.on(`requests-update-${user._id}`, (updatedRequests) => {
                setRequests(updatedRequests);
            });
            // Listen for notifications for requester (when their request is accepted/declined)
            socket.on(`notification-update-${user._id}`, (notification) => {
                setRequesterNotification(notification);
            });
            // Real-time task events to update feed instantly
            socket.on('task:new', (newTask) => {
                try {
                    const mapped = {
                        id: newTask._id || newTask.id,
                        title: newTask.title,
                        type: newTask.category || newTask.type || 'other',
                        description: newTask.description,
                        date: `Posted ${newTask.createdAt ? new Date(newTask.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`,
                        startTime: newTask.startTime || '',
                        endTime: newTask.endTime || '',
                        location: newTask.location || '',
                        user: newTask.postedByName || newTask.user || (user && user.name) || 'Unknown',
                        userId: newTask.userId || newTask.ownerId || newTask.postedById || '',
                        userImage: newTask.userImageUrl || newTask.userImage || '',
                        image: newTask.imageUrl || newTask.image || '',
                    };
                    setFeedTasks(prev => [mapped, ...prev]);
                } catch (err) {
                    console.error('Failed to handle task:new socket event:', err);
                }
            });
            socket.on('task:update', (updatedTask) => {
                try {
                    setFeedTasks(prev => prev.map(t => (t.id === (updatedTask._id || updatedTask.id) ? ({ ...t, title: updatedTask.title, description: updatedTask.description, image: updatedTask.imageUrl || updatedTask.image }) : t)));
                    setTasksData(prev => {
                        const newData = { ...prev };
                        ['todo','inProgress','done'].forEach(col => {
                            newData[col] = newData[col].map(t => t.id === (updatedTask._id || updatedTask.id) ? ({ ...t, title: updatedTask.title, description: updatedTask.description, image: updatedTask.imageUrl || updatedTask.image }) : t);
                        });
                        return newData;
                    });
                } catch (err) {
                    console.error('Failed to handle task:update socket event:', err);
                }
            });
            socket.on('task:delete', ({ _id }) => {
                try {
                    setFeedTasks(prev => prev.filter(t => t.id !== _id));
                    setTasksData(prev => {
                        const newData = { ...prev };
                        ['todo','inProgress','done'].forEach(col => {
                            newData[col] = newData[col].filter(t => t.id !== _id);
                        });
                        return newData;
                    });
                } catch (err) {
                    console.error('Failed to handle task:delete socket event:', err);
                }
            });
            // Listen for profile updates for the current user and apply them
            socket.on(`user-updated-${user._id}`, (updatedUser) => {
                try {
                    if (updatedUser && updatedUser._id === user._id) {
                        setUser(prev => ({ ...prev, ...updatedUser }));
                        // update stored value as well
                        const stored = localStorage.getItem('userInfo');
                        if (stored) {
                            try {
                                const parsed = JSON.parse(stored);
                                const newVal = { ...parsed, ...updatedUser };
                                localStorage.setItem('userInfo', JSON.stringify(newVal));
                                if (newVal.token) localStorage.setItem('userToken', newVal.token);
                            } catch (e) {
                                console.error('Failed to update localStorage after user-updated socket:', e);
                            }
                        }
                        // Update all feed tasks and tasksData where userId matches
                        setFeedTasks(prev => prev.map(t =>
                          t.userId === updatedUser._id
                            ? { ...t, user: updatedUser.name, userImage: updatedUser.image || t.userImage }
                            : t
                        ));
                        setTasksData(prev => {
                          const newData = { ...prev };
                          ['todo','inProgress','done'].forEach(col => {
                            newData[col] = newData[col].map(t =>
                              t.userId === updatedUser._id
                                ? { ...t, user: updatedUser.name, userImage: updatedUser.image || t.userImage }
                                : t
                            );
                          });
                          return newData;
                        });
                    }
                } catch (err) {
                    console.error('Error handling user-updated socket event:', err);
                }
            });
        }
        return () => {
            if (socket) socket.disconnect();
        };
    }, [user, fetchMyRequests, fetchIncomingRequests]);


    // Send a new request and persist to incomingrequests collection
    const handleSendRequest = useCallback(async (task, message = '') => {
        if (!user) return;
        try {
            // Get owner info from task
            const taskOwnerId = task.ownerId || task.taskOwnerId || task.userId || (task.user && task.user._id);
            const taskOwnerName = task.user || task.postedByName || task.taskOwnerName;
            // POST to backend (incomingrequests)
            const payload = {
                requesterId: user._id,
                requesterName: user.name,
                taskId: task.id || task._id,
                taskOwnerId,
                taskOwnerName,
                message,
            };
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/incoming-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                // Try to parse JSON body, but guard against empty responses
                let errorMessage = 'Failed to send request';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.warn('Non-JSON or empty error response when sending request:', e);
                }
                throw new Error(errorMessage);
            }
            setIsRequestModalOpen(false);
            navigate('/dashboard/my-requests');
            // Optionally refetch requests after sending
            await fetchMyRequests();
            await fetchIncomingRequests();
        } catch (error) {
            alert('Could not send request. ' + (error.message || ''));
        }
    }, [user, navigate, fetchMyRequests, fetchIncomingRequests]);

    const handleMoveTask = useCallback((taskId, fromColumn, toColumn) => {
        let taskToMove;
        const newFromColumn = tasksData[fromColumn].filter(task => {
            if (task.id === taskId) {
                taskToMove = task;
                return false;
            }
            return true;
        });

        if (taskToMove) {
            const newToColumn = [taskToMove, ...tasksData[toColumn]];
            setTasksData(prevData => ({
                ...prevData,
                [fromColumn]: newFromColumn,
                [toColumn]: newToColumn,
            }));
        }
    }, [tasksData]);
    
    const handleAcceptRequest = useCallback(async (requestToAccept) => {
        try {
            // Call backend to accept the request
            const url = `${import.meta.env.VITE_API_URL}/api/incoming-requests/accept/${requestToAccept._id || requestToAccept.id}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                let errorMessage = 'Failed to accept request';
                try {
                    const errData = await response.json();
                    errorMessage = errData.message || errorMessage;
                } catch (e) {
                    console.warn('Non-JSON/empty error response on accept:', e);
                }
                throw new Error(errorMessage);
            }
            await fetchIncomingRequests();
            const userName = requestToAccept.requesterName || requestToAccept.name || 'the user';
            setToast({ show: true, type: 'success', message: `You accepted the request of ${userName}. A new task has been added!` });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
        } catch (error) {
            setToast({ show: true, type: 'error', message: 'Could not accept request. ' + (error.message || '') });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
        }
    }, [fetchIncomingRequests]);
    
    const handleDeclineRequest = useCallback(async (requestToDeclineId) => {
        try {
            // Call backend to decline the request
            const url = `${import.meta.env.VITE_API_URL}/api/incoming-requests/decline/${requestToDeclineId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                let errorMessage = 'Failed to decline request';
                try {
                    const errData = await response.json();
                    errorMessage = errData.message || errorMessage;
                } catch (e) {
                    console.warn('Non-JSON/empty error response on decline:', e);
                }
                throw new Error(errorMessage);
            }
            await fetchIncomingRequests();
            // Try to get the user name from the requests array
            let declinedUserName = 'the user';
            if (Array.isArray(requests)) {
                const declinedReq = requests.find(r => (r._id || r.id) === requestToDeclineId);
                if (declinedReq) declinedUserName = declinedReq.requesterName || declinedReq.name || 'the user';
            }
            setToast({ show: true, type: 'error', message: `You declined the request of ${declinedUserName}.` });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
        } catch (error) {
            setToast({ show: true, type: 'error', message: 'Could not decline request. ' + (error.message || '') });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
        }
    }, [fetchIncomingRequests, requests]);
    
    const navItems = [
        // ... your navItems array is unchanged ...
         { name: 'Feed', path: 'feed', icon: <Icon className="h-5 w-5" path="M3 7a1 1 0 011-1h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7zm1 0v10h16V7H4zm8 2a2 2 0 110 4 2 2 0 010-4zm0 6a6 6 0 016-6H6a6 6 0 016 6z" />, count: null },
         { name: 'My Tasks', path: 'my-tasks', icon: <Icon className="h-5 w-5" path="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm2 6h10v2H7V9zm0 4h6v2H7v-2z" />, count: null },
         { name: 'Requests', path: 'requests', icon: <Icon className="h-5 w-5" path="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />, count: requestCount },
         { name: 'My Requests', path: 'my-requests', icon: <Icon className="h-5 w-5" path="M22 2l-7 20-4-9-9-4 20-7z" />, count: null },
         { name: 'Add Task', path: 'add-task', icon: <AddTaskIcon className="h-5 w-5" />, count: null },
         { name: 'Settings', path: 'settings', icon: <Icon className="h-5 w-5" path="M12 4.5c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5 7.5-3.358 7.5-7.5-3.358-7.5-7.5-7.5zm0 13a5.5 5.5 0 110-11 5.5 5.5 0 010 11zm0-9a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />, count: null },
    ];

    if (!user) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-zinc-100">
                <div className="space-y-6 w-full max-w-2xl p-8">
                    {/* Avatar Skeleton */}
                    <div className="flex items-center space-x-4">
                        <SkeletonLoader width="56px" height="56px" borderRadius="50%" />
                        <div className="flex-1 space-y-2">
                            <SkeletonLoader width="40%" height="18px" />
                            <SkeletonLoader width="30%" height="14px" />
                        </div>
                    </div>
                    {/* Main content skeletons */}
                    <SkeletonLoader width="100%" height="32px" />
                    <SkeletonLoader width="100%" height="120px" />
                    <div className="flex space-x-4">
                        <SkeletonLoader width="48%" height="80px" />
                        <SkeletonLoader width="48%" height="80px" />
                    </div>
                </div>
            </div>
        );
    }

    // --- JSX RENDER (No changes here) ---
    return (
        <div className="h-screen flex bg-zinc-100 font-sans">
            <Sidebar 
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                navItems={navItems}
                user={user}
                handleLogout={handleLogout}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopHeader 
                    requestCount={requestCount}
                    user={user}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
                {/* Notification Bar for requester when their request is accepted */}
                <RequesterNotificationBar
                    notification={requesterNotification}
                    onClick={async () => {
                        if (requesterNotification) {
                            // Mark as read in backend
                            await fetch(`/api/incoming-requests/notifications/read/${requesterNotification._id}`, { method: 'PATCH' });
                            setRequesterNotification(null);
                            navigate('/dashboard/my-requests');
                        }
                    }}
                    onClose={async () => {
                        if (requesterNotification) {
                            await fetch(`/api/incoming-requests/notifications/read/${requesterNotification._id}`, { method: 'PATCH' });
                            setRequesterNotification(null);
                        }
                    }}
                />
                {/* Existing notification bar for task owner */}
                {showNotificationBar && notificationActive && (
                    <div className="bg-indigo-600 text-white text-center py-2 px-4 font-semibold z-40 mt-4 mb-4 mx-4 rounded-lg shadow-lg cursor-pointer transition hover:bg-indigo-700 flex items-center justify-between"
                        onClick={() => { navigate('/dashboard/requests'); setShowNotificationBar(false); setNotificationActive(false); setNewRequesters([]); }}
                    >
                        <span className="w-full text-center">
                            {newRequesters.length === 1
                                ? `${newRequesters[0]} sent you a new request! Click to view.`
                                : `${newRequesters.join(', ')} sent you new requests! Click to view.`}
                        </span>
                        <button className="ml-4 text-white text-lg font-bold" onClick={e => { e.stopPropagation(); setShowNotificationBar(false); setNotificationActive(false); setNewRequesters([]); }}>&#10005;</button>
                    </div>
                )}
                <Outlet context={{ 
                    feedTasks, 
                    tasksData, 
                    requests, 
                    myRequests, 
                    user,
                    handleOpenRequestModal,
                    handleUserUpdate,
                    handleAddTask,
                    handleMoveTask,
                    handleAcceptRequest,
                    handleDeclineRequest,
                    requestsLoading,
                    feedLoading,
                    searchQuery,
                }} />
            </div>
            <RequestModal 
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                task={selectedTask}
                onSendRequest={handleSendRequest}
            />
            <Toast show={toast.show} type={toast.type} message={toast.message} onClose={() => setToast(t => ({ ...t, show: false }))} />
        </div>
    );
};

export default DashboardLayout;

// Add this to your CSS (e.g. index.css or App.css):
/*
@keyframes slideDown {
  0% { opacity: 0; transform: translateY(-40px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-slideDown {
  animation: slideDown 0.4s cubic-bezier(0.4,0,0.2,1);
}
*/