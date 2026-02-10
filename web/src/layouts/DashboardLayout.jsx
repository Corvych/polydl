import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Layout, User, Menu, X, Users, BookOpen, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const DashboardLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // Sidebar state
    // Default to collapsed on smaller screens (tablet), expanded on larger screens
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Auto-collapse on tablet initialization
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024 && window.innerWidth >= 768) {
                setIsSidebarCollapsed(true);
            } else if (window.innerWidth >= 1024) {
                setIsSidebarCollapsed(false);
            }
        };

        // Set initial state
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: Layout, label: t('common.deadlines') },
    ];

    if (user?.role === 'superadmin') {
        navItems.push({ path: '/admin/users', icon: User, label: t('common.manageUsers') });
        navItems.push({ path: '/admin/groups', icon: Users, label: t('common.manageGroups') });
    }

    if (user?.role === 'admin') {
        navItems.push({ path: '/manage-group', icon: Users, label: t('common.myGroup') });
    }

    if (user?.role === 'superadmin' || user?.role === 'admin') {
        navItems.push({ path: '/admin/subjects', icon: BookOpen, label: t('common.manageSubjects') });
    }

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col md:flex-row font-sans selection:bg-jungle-500/30">
            {/* Sidebar (Desktop/Tablet) */}
            <div
                className={`hidden md:flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800/50 relative h-screen sticky top-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'
                    }`}
            >
                <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isSidebarCollapsed && (
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-jungle-500 via-jungle-400 to-jungle-300 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
                            PolyDL
                        </h1>
                    )}

                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors"
                        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                    {!isSidebarCollapsed ? "" : ""}
                </div>

                {!isSidebarCollapsed && (
                    <div className="px-6 pb-4 flex items-center gap-1 justify-between">
                        <ThemeSwitcher />
                        <LanguageSwitcher />
                    </div>
                )}

                {isSidebarCollapsed && (
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="scale-75"><ThemeSwitcher /></div>
                        <div className="scale-75"><LanguageSwitcher /></div>
                    </div>
                )}

                <nav className="flex-1 px-3 space-y-2 overflow-y-auto py-4 overflow-x-hidden">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={isSidebarCollapsed ? item.label : ""}
                            className={`
                                flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative
                                ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                                ${isActive(item.path)
                                    ? 'bg-jungle-50 dark:bg-jungle-500/20 text-jungle-600 dark:text-jungle-400 border border-jungle-200 dark:border-jungle-500/30'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                                }
                            `}
                        >
                            <item.icon size={22} className={`shrink-0 ${isActive(item.path) ? 'text-jungle-600 dark:text-jungle-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />

                            {!isSidebarCollapsed && (
                                <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
                            )}
                        </Link>
                    ))}

                    <div className={`px-4 py-3 pb-2 text-gray-500 uppercase text-xs font-bold tracking-wider mt-6 mb-2 ${isSidebarCollapsed ? 'text-center' : ''}`}>
                        {isSidebarCollapsed ? "..." : t('common.account')}
                    </div>

                    <Link
                        to="/profile"
                        title={isSidebarCollapsed ? user?.name : ""}
                        className={`flex items-center px-3 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                    >
                        <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-jungle-500 to-jungle-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-jungle-500/20">
                            {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col min-w-0 overflow-hidden">
                                <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {user?.name} {user?.surname}
                                </span>
                                <span className="truncate text-xs text-gray-500 capitalize">
                                    {user?.group_name || t('common.noGroup')}
                                </span>
                            </div>
                        )}
                    </Link>
                </nav>

                <div className="p-3 border-t border-gray-200 dark:border-gray-800/50">
                    <button
                        onClick={handleLogout}
                        title={isSidebarCollapsed ? t('common.signOut') : ""}
                        className={`flex items-center text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-3 w-full transition-all rounded-xl ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">{t('common.signOut')}</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-black relative pb-24 md:pb-0">
                {/* Background ambient glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-jungle-100/50 dark:from-jungle-900/10 to-transparent pointer-events-none" />

                <div className="relative z-10 w-full mx-auto px-4 md:px-6 lg:px-8">
                    <Outlet />
                </div>
            </div>

            {/* Bottom Navigation (Mobile Only) */}
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-[90vw] bg-white/80 dark:bg-gray-900/50 backdrop-blur-[50px] border border-gray-200 dark:border-white/10 rounded-full z-50 px-8 py-4 flex items-center justify-center gap-8 shadow-2xl shadow-gray-300 dark:shadow-black/50 safe-area-pb ring-1 ring-white/5">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center transition-all duration-300 ${isActive(item.path) ? 'text-jungle-500 dark:text-jungle-400 scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            }`}
                    >
                        <item.icon size={26} className={isActive(item.path) ? 'drop-shadow-[0_0_8px_rgba(46,213,115,0.5)]' : ''} />
                    </Link>
                ))}
                <Link
                    to="/profile"
                    className={`flex flex-col items-center justify-center transition-all duration-300 ${isActive('/profile') ? 'text-jungle-500 dark:text-jungle-400 scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        }`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isActive('/profile')
                        ? 'bg-jungle-500 text-white shadow-lg shadow-jungle-500/40 ring-2 ring-jungle-500/20'
                        : 'bg-gray-800 text-gray-400 border border-white/10'
                        }`}>
                        {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default DashboardLayout;
