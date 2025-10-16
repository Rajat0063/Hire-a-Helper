
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon, AddTaskIcon } from '../ui/Icon';
import Avatar from '../ui/Avatar';

const TopHeader = ({ requestCount, user, searchQuery, setSearchQuery }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const inputRef = useRef(null);

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

            {/* Right Side Icons & Profile */}
            <div className="flex items-center space-x-4 sm:space-x-6">
                <Link to="/dashboard/requests" className="relative p-2 rounded-full text-zinc-600 hover:bg-zinc-100 transition-colors">
                    <Icon className="h-6 w-6" path="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    {requestCount > 0 && (
                        <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 inline-flex items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none h-5 min-w-[20px] px-1.5 py-0.5 items-center justify-center">{requestCount}</span>
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

