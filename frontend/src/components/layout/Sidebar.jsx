import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import AppLogo from '../../assets/logo (2).png';
import Avatar from '../ui/Avatar'; // 1. Import the new Avatar component

const Sidebar = ({ isSidebarOpen, toggleSidebar, navItems, user, handleLogout }) => (
    <aside className={`relative bg-white border-r border-zinc-200 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-20 border-b border-zinc-200 flex-shrink-0">
            {isSidebarOpen ? (
                <div className="flex items-center justify-between w-full h-full px-4">
                    <div className="flex items-center">
                        <img src={AppLogo} alt="Logo" className="h-8 w-8" />
                        <h1 className="ml-3 text-2xl font-bold text-zinc-800 whitespace-nowrap tracking-tight">Heir-a-Helper</h1>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="ml-6 p-2 rounded-full text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors duration-150 border border-transparent hover:border-zinc-200 shadow-sm"
                        aria-label="Collapse sidebar"
                        style={{ marginLeft: '2rem', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Icon className="h-6 w-6" path="M6 18L18 6M6 6l12 12" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center w-full h-full">
                    <button onClick={toggleSidebar} className="p-2 rounded-full text-zinc-600 hover:bg-zinc-100" aria-label="Expand sidebar">
                        <Icon className="h-6 w-6" path="M4 6h16M4 12h16M4 18h16" />
                    </button>
                </div>
            )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {/* Always show Overview link so users can easily navigate to their dashboard overview */}
            <NavLink
                to="/dashboard/overview"
                className={({ isActive }) => `w-full flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 group relative ${
                    isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-600 hover:bg-zinc-100'
                } ${!isSidebarOpen && 'justify-center'}`}
            >
                {({ isActive }) => (
                    <>
                        <div className="flex items-center">
                            <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-700'}`} path="M3 12l9-7 9 7v8a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-8z" />
                            {isSidebarOpen && <span className={`ml-3 ${isActive ? 'text-white' : 'text-gray-800'}`}>Overview</span>}
                        </div>
                    </>
                )}
            </NavLink>
                {navItems.map((item) => {
                // Use absolute path for Admin, else prefix with /dashboard/
                const to = item.path.startsWith('/') ? item.path : `/dashboard/${item.path}`;
                return (
                    <NavLink
                        key={item.name}
                        to={to}
                        className={({ isActive }) => `w-full flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 group relative ${
                            isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-600 hover:bg-zinc-100'
                        } ${!isSidebarOpen && 'justify-center'}`}
                    >
                        {({ isActive }) => (
                            <>
                                <div className="flex items-center">
                                            {React.isValidElement(item.icon)
                                                ? React.cloneElement(item.icon, { className: `h-5 w-5 ${isActive ? 'text-white' : 'text-gray-700'}` })
                                                : item.icon}
                                            {isSidebarOpen && <span className={`ml-3 ${isActive ? 'text-white' : 'text-gray-800'}`}>{item.name}</span>}
                                </div>
                                {item.count > 0 && isSidebarOpen && (
                                    <span aria-label={`${item.count} requests need action`} className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {item.count}
                                    </span>
                                )}
                                {!isSidebarOpen && (
                                    <span className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-100 text-gray-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}>
                                        {item.name}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
        <div className="p-4 border-t border-zinc-200">
            <div className={`flex items-center mb-4 ${!isSidebarOpen && 'justify-center'}`}>
                
                {/* 2. Replace the old <img> tag with the new Avatar component */}
                <Avatar user={user} className="h-10 w-10 flex-shrink-0" />

                {isSidebarOpen && (
                    <div className="ml-3 overflow-hidden">
                        <p className="font-semibold text-zinc-800 truncate">{user.name}</p>
                        <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                    </div>
                )}
            </div>
            
            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors duration-200 group"
            >
                <Icon path="M15 12H3m0 0l4-4m-4 4l4 4M21 4v16" className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
            </button>
        </div>
    </aside>
);

export default Sidebar;