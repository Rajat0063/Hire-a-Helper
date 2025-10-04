
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Icon, AddTaskIcon } from '../ui/Icon';
import Avatar from '../ui/Avatar';

// Helper to get unique suggestions from tasks and previous searches
function getSuggestions(tasks, previous, query) {
    const q = query.toLowerCase();
    const fields = ['title', 'type', 'location', 'description'];
    let suggestions = [];
    if (Array.isArray(tasks)) {
        tasks.forEach(task => {
            fields.forEach(f => {
                if (task[f] && typeof task[f] === 'string') {
                    const val = task[f].trim();
                    if (val && val.toLowerCase().includes(q)) suggestions.push(val);
                }
            });
        });
    }
    if (Array.isArray(previous)) {
        previous.forEach(val => {
            if (val && typeof val === 'string' && val.toLowerCase().includes(q)) suggestions.push(val);
        });
    }
    // Remove duplicates, keep only those that match query
    return [...new Set(suggestions)].filter(s => s.toLowerCase() !== q).slice(0, 6);
}

const TopHeader = ({ requestCount, user, searchQuery, setSearchQuery, feedTasks }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [previousSearches, setPreviousSearches] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('searchHistory') || '[]');
        } catch { return []; }
    });
    const inputRef = useRef();
    const suggestions = getSuggestions(feedTasks, previousSearches, searchQuery);

    // Save search to history
    const handleSearchChange = e => {
        setSearchQuery(e.target.value);
        setShowSuggestions(true);
    };
    const handleSuggestionClick = val => {
        setSearchQuery(val);
        setShowSuggestions(false);
        // Save to history
        setPreviousSearches(prev => {
            const updated = [val, ...prev.filter(v => v !== val)].slice(0, 10);
            localStorage.setItem('searchHistory', JSON.stringify(updated));
            return updated;
        });
        if (inputRef.current) inputRef.current.blur();
    };
    // Hide suggestions on click outside
    useEffect(() => {
        if (!showSuggestions) return;
        const handler = e => {
            if (inputRef.current && !inputRef.current.parentNode.contains(e.target)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showSuggestions]);

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between h-20 px-4 sm:px-8 bg-white border-b border-zinc-200 shadow-sm">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-lg">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full px-4 py-2 pl-10 rounded-full bg-zinc-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto animate-fadeIn">
                        {suggestions.map((s, i) => (
                            <li
                                key={s + i}
                                className="px-4 py-2 cursor-pointer hover:bg-indigo-50 text-zinc-700"
                                onMouseDown={e => { e.preventDefault(); handleSuggestionClick(s); }}
                            >
                                {s}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Right Side Icons & Profile */}
            <div className="flex items-center space-x-4 sm:space-x-6">
                <Link to="/dashboard/requests" className="relative p-2 rounded-full text-zinc-600 hover:bg-zinc-100 transition-colors">
                    <Icon className="h-6 w-6" path="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    {requestCount > 0 && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </Link>

                <Link to="/dashboard/add-task" className="relative p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                    <AddTaskIcon className="h-6 w-6" />
                </Link>

                <Link to="/dashboard/settings" className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <Avatar user={user} className="h-10 w-10" />
                </Link>
            </div>
        </header>
    );
};

export default TopHeader;
export default TopHeader;