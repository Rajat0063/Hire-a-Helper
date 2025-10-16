
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon, AddTaskIcon } from '../ui/Icon';
import Avatar from '../ui/Avatar';

const TopHeader = ({ requestCount, user, searchQuery, setSearchQuery, theme, setTheme }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const inputRef = useRef(null);

    const handleThemeChange = (t) => {
        if (typeof setTheme === 'function') setTheme(t);
    };

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 md:h-20 px-3 sm:px-8 bg-white border-b border-zinc-200 shadow-sm">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-lg md:max-w-xl">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setShowTooltip(true)}
                    onBlur={() => setShowTooltip(false)}
                    className="w-full px-3 py-2 pl-10 rounded-full bg-zinc-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                />
                <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                {showTooltip && (
                    <div className="absolute left-0 mt-2 w-full text-xs text-zinc-600 bg-white border border-zinc-200 rounded shadow-lg px-4 py-2 z-20 animate-fadeIn">
                        <span>
                            <b>Tip:</b> You can search by <b>title</b>, <b>description</b>, <b>location</b>, or <b>type</b>.
                        </span>
                    </div>
                )}
            </div>

            {/* Right Side Icons, Theme & Profile */}
            <div className="flex items-center space-x-4 sm:space-x-6">
                {/* Theme toggle: light / dark / hacker */}
                <div className="flex items-center bg-zinc-100 rounded-full p-1">
                    <button aria-pressed={theme === 'light'} onClick={() => handleThemeChange('light')} className={`px-3 py-1 rounded-full text-sm ${theme === 'light' ? 'bg-white shadow' : 'text-zinc-600'}`}>Light</button>
                    <button aria-pressed={theme === 'dark'} onClick={() => handleThemeChange('dark')} className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-white shadow' : 'text-zinc-600'}`}>Dark</button>
                    <button aria-pressed={theme === 'hacker'} onClick={() => handleThemeChange('hacker')} className={`px-3 py-1 rounded-full text-sm ${theme === 'hacker' ? 'bg-white shadow' : 'text-zinc-600'}`}>Hacker</button>
                </div>
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

