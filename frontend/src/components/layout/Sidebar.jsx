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
                        <h1 className="ml-2 text-2xl font-bold text-zinc-800 whitespace-nowrap">Heir-a-Helper</h1>
                    </div>
                    <button onClick={toggleSidebar} className="p-2 rounded-full text-zinc-600 hover:bg-zinc-100">
                        <Icon className="h-6 w-6" path="M15 19l-7-7 7-7" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center w-full h-full">
                    <button onClick={toggleSidebar} className="p-2 rounded-full text-zinc-600 hover:bg-zinc-100">
                        <Icon className="h-6 w-6" path="M9 5l7 7-7 7" />
                    </button>
                </div>
            )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
                <NavLink
                    key={item.name}
                    to={`/dashboard/${item.path}`}
                    className={({ isActive }) => `w-full flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 group relative ${
                        isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-600 hover:bg-zinc-100'
                    } ${!isSidebarOpen && 'justify-center'}`}
                >
                    {({ isActive }) => (
                        <>
                            <div className="flex items-center">
                                {item.icon}
                                {isSidebarOpen && <span className="ml-3">{item.name}</span>}
                            </div>
                            
                            {item.count > 0 && isSidebarOpen && (
                                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                                    {item.count}
                                </span>
                            )}

                            {!isSidebarOpen && (
                                <span className="absolute left-full rounded-md px-2 py-1 ml-6 bg-indigo-100 text-indigo-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                                    {item.name}
                                </span>
                            )}
                        </>
                    )}
                </NavLink>
            ))}
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
                <Icon path="M17 16l4-4m0 0l-4-4m4 4H7" className="h-5 w-5" />
                {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
            </button>
        </div>
    </aside>
);

export default Sidebar;