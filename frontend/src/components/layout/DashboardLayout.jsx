// src/layouts/DashboardLayout.jsx

// FIXED: Imported 'useCallback'
import { useState, useEffect, useCallback, useRef } from 'react';
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
    const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const icon = type === 'success' ? (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    ) : (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    );
    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center px-6 py-4 rounded-lg shadow-lg text-white ${color} animate-slideDown`} style={{ minWidth: '300px', maxWidth: '90vw' }}>
            {icon}
            <span className="ml-3 font-medium flex-1 text-center">{message}</span>
            <button className="ml-4 text-white text-lg font-bold" onClick={onClose}>&#10005;</button>
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [feedTasks, setFeedTasks] = useState([]);
    const [tasksData, setTasksData] = useState({ todo: [], inProgress: [], done: [] });
    const [requests, setRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [requestCount, setRequestCount] = useState(0);
    const [user, setUser] = useState(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    // Notification bar state
    const [showNotificationBar, setShowNotificationBar] = useState(false);
    const [newRequesters, setNewRequesters] = useState([]);
    const prevRequestCount = useRef(0);
    // Track if notification should persist until Requests page is visited
    const [notificationActive, setNotificationActive] = useState(false);
    const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

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
    const fetchTasks = useCallback(async () => {
        try {
            const response = await fetch('/api/tasks');
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
        }
    }, [user]);

    // --- EFFECTS (FIXED with correct dependencies) ---

    // FIXED: Load user data from localStorage
    useEffect(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            try {
                setUser(JSON.parse(storedUserInfo));
            } catch (error) {
                console.error("Failed to parse user info from localStorage:", error);
                handleLogout();
            }
        } else {
            navigate('/login');
        }
    }, [navigate, handleLogout]); // FIXED: Added missing dependencies

    // FIXED: useEffect for polling
    useEffect(() => {
        fetchTasks();
        const intervalId = setInterval(fetchTasks, 5000);
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
        try {
            const response = await fetch(`/api/incoming-requests/received/${user._id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch incoming requests:', error);
        }
    }, [user]);


    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleOpenRequestModal = useCallback((task) => {
        setSelectedTask(task);
        setIsRequestModalOpen(true);
    }, []);

    const handleUserUpdate = useCallback((updatedUserData) => {
        const newUser = { ...user, ...updatedUserData };
        setUser(newUser);
        localStorage.setItem('userInfo', JSON.stringify(newUser));
        alert('Profile updated successfully!');
        navigate('/dashboard/settings');
    }, [user, navigate]);


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
            const response = await fetch('/api/tasks', {
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
            const response = await fetch(`/api/incoming-requests-sent/sent/${user._id}`);
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
            fetch(`/api/incoming-requests/notifications/${user._id}`)
                .then(res => res.json())
                .then(data => {
                    // Show the latest unread accepted or declined notification
                    const latest = data.find(n => (n.type === 'request-accepted' || n.type === 'request-declined') && !n.isRead);
                    setRequesterNotification(latest || null);
                });
        }
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
            const response = await fetch('/api/incoming-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send request');
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
            const response = await fetch(`/api/incoming-requests/accept/${requestToAccept._id || requestToAccept.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to accept request');
            await fetchIncomingRequests();
            setToast({ show: true, type: 'success', message: 'Request accepted! A new task has been added.' });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
        } catch (error) {
            setToast({ show: true, type: 'error', message: 'Could not accept request. ' + (error.message || '') });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
        }
    }, [fetchIncomingRequests]);
    
    const handleDeclineRequest = useCallback(async (requestToDeclineId) => {
        try {
            // Call backend to decline the request
            const response = await fetch(`/api/incoming-requests/decline/${requestToDeclineId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to decline request');
            await fetchIncomingRequests();
            setToast({ show: true, type: 'error', message: 'Request declined.' });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
        } catch (error) {
            setToast({ show: true, type: 'error', message: 'Could not decline request. ' + (error.message || '') });
            setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
        }
    }, [fetchIncomingRequests]);
    
    const navItems = [
        // ... your navItems array is unchanged ...
         { name: 'Feed', path: 'feed', icon: <Icon className="h-5 w-5" path="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM5 5h14v14H5V5zm4 4h2v6H9V9zm4 0h2v6h-2V9z" />, count: null },
         { name: 'My Tasks', path: 'my-tasks', icon: <Icon className="h-5 w-5" path="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zm0 16H5V5h14v14zM17 8H7v2h10V8zm-2 4H7v2h8v-2z" />, count: null },
         { name: 'Requests', path: 'requests', icon: <Icon className="h-5 w-5" path="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />, count: requestCount },
         { name: 'My Requests', path: 'my-requests', icon: <Icon className="h-5 w-5" path="M22 2l-7 20-4-9-9-4 20-7z" />, count: null },
         { name: 'Add Task', path: 'add-task', icon: <AddTaskIcon className="h-5 w-5" />, count: null },
         { name: 'Settings', path: 'settings', icon: <Icon className="h-5 w-5" path="M19.4 12.9l.2-1.2c.1-.5-.2-1-.7-1.1l-1.9-.4c-.2-.5-.4-1-.7-1.4l1.2-1.9c.4-.7.3-1.5-.2-2l-1.4-1.4c-.5-.5-1.3-.6-2-.2l-1.9 1.2c-.4-.3-1-.5-1.4-.7l-.4-1.9c-.1-.5-.6-.8-1.1-.7l-1.2.2c-.5.1-1 .2-1.4-.4l-1.9-1.2c-.7-.4-1.5-.3-2 .2l-1.4 1.4c-.5.5-.6 1.3-.2 2l1.2 1.9c-.3.4-.5 1-.7 1.4l-1.9.4c-.5.1-.8.6-.7 1.1l.2 1.2c.1.5.2 1 .4 1.4l-1.2 1.9c-.4.7-.3 1.5.2 2l1.4 1.4c.5.5 1.3.6 2 .2l1.9-1.2c.4.3 1 .5 1.4.7l.4 1.9c.1.5.6.8 1.1-.7l1.2-.2c-.5-.1 1-.2 1.4-.4l1.9 1.2c.7.4 1.5.3 2-.2l1.4-1.4c-.5-.5.6-1.3.2-2l-1.2-1.9c.3-.4.5-1 .7-1.4l1.9-.4c.5-.1.8-.6.7-1.1zM12 15a3 3 0 100-6 3 3 0 000 6z" />, count: null },
    ];

    if (!user) {
        return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
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