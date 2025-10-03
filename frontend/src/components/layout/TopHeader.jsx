import { Link } from 'react-router-dom';
import { Icon, AddTaskIcon } from '../ui/Icon';
import Avatar from '../ui/Avatar'; // 1. Import the new Avatar component


const TopHeader = ({ requestCount, user, searchQuery, setSearchQuery }) => (
    <header className="sticky top-0 z-10 flex items-center justify-between h-20 px-4 sm:px-8 bg-white border-b border-zinc-200 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
            <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-full bg-zinc-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

export default TopHeader;