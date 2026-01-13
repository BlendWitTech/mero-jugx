import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    CreditCard,
    ChevronRight,
    LogOut,
    ChevronLeft,
    FileSpreadsheet,
    Settings,
} from 'lucide-react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAuthStore } from '@frontend/store/authStore';
import { logoutFromAppBySlug } from '@shared/frontend/utils/appAuth';
import toast from '@shared/frontend/hooks/useToast';

interface MeroCrmSidebarProps {
    buildHref: (href: string) => string;
    checkActive: (href: string, currentPath: string) => boolean;
    appSlug: string;
}

export default function MeroCrmSidebar({
    buildHref,
    checkActive,
    appSlug,
}: MeroCrmSidebarProps) {
    const { theme } = useTheme();
    const { user, organization } = useAuthStore();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem('mero-crm-sidebar-collapsed');
        return saved === 'true';
    });

    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/',
            icon: LayoutDashboard,
        },
        {
            name: 'Clients',
            href: '/clients',
            icon: Users,
        },
        {
            name: 'Invoices',
            href: '/invoices',
            icon: FileText,
        },
        {
            name: 'Quotes',
            href: '/quotes',
            icon: FileSpreadsheet,
        },
        {
            name: 'Payments',
            href: '/payments',
            icon: CreditCard,
        },
        {
            name: 'Settings',
            href: '/settings',
            icon: Settings,
        },
    ];

    const handleLogout = async () => {
        try {
            await logoutFromAppBySlug(appSlug);
            toast.success('Logged out from CRM');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    const isActive = (href: string): boolean => {
        return checkActive(href, location.pathname);
    };

    const toggleCollapsed = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('mero-crm-sidebar-collapsed', newState.toString());
    };

    const sidebarWidth = collapsed ? 72 : 260;

    return (
        <div
            className="flex flex-col h-full transition-all duration-300 border-r flex-shrink-0 overflow-hidden"
            style={{
                width: `${sidebarWidth}px`,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
            }}
        >
            {/* Header */}
            <div
                className="h-16 px-4 flex items-center justify-between border-b flex-shrink-0"
                style={{ borderColor: theme.colors.border }}
            >
                {!collapsed ? (
                    <>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div
                                className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: theme.colors.primary }}
                            >
                                <LayoutDashboard className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2
                                    className="text-sm font-bold truncate"
                                    style={{ color: theme.colors.text }}
                                >
                                    Mero CRM
                                </h2>
                                <p
                                    className="text-xs truncate"
                                    style={{ color: theme.colors.textSecondary }}
                                >
                                    {organization?.name || 'Management'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleCollapsed}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            style={{ color: theme.colors.textSecondary }}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={toggleCollapsed}
                        className="w-full h-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{ color: theme.colors.textSecondary }}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
                {navigationItems.map((item) => {
                    const Active = isActive(item.href);
                    const Icon = item.icon;
                    const href = buildHref(item.href);

                    return (
                        <Link
                            key={item.name}
                            to={href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative ${Active ? 'shadow-sm' : ''
                                }`}
                            style={{
                                backgroundColor: Active ? theme.colors.primary : 'transparent',
                                color: Active ? '#fff' : theme.colors.textSecondary,
                            }}
                            onMouseEnter={(e) => {
                                if (!Active) {
                                    e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                                    e.currentTarget.style.color = theme.colors.primary;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!Active) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = theme.colors.textSecondary;
                                }
                            }}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && (
                                <span className="text-sm font-medium truncate">{item.name}</span>
                            )}
                            {collapsed && (
                                <div
                                    className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
                                >
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="mt-auto border-t flex-shrink-0" style={{ borderColor: theme.colors.border }}>
                {!collapsed ? (
                    <div className="p-4 space-y-3">
                        {/* User Profile */}
                        <div className="flex items-center gap-3">
                            <div
                                className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: theme.colors.primary }}
                            >
                                <span className="text-sm font-bold text-white uppercase">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-sm font-semibold truncate"
                                    style={{ color: theme.colors.text }}
                                >
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p
                                    className="text-xs truncate"
                                    style={{ color: theme.colors.textSecondary }}
                                >
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors"
                            style={{
                                backgroundColor: `${theme.colors.danger}15`,
                                color: theme.colors.danger,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme.colors.danger;
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = `${theme.colors.danger}15`;
                                e.currentTarget.style.color = theme.colors.danger;
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                ) : (
                    <div className="py-3 space-y-2">
                        {/* User Avatar */}
                        <div className="flex justify-center">
                            <div
                                className="h-9 w-9 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: theme.colors.primary }}
                                title={`${user?.first_name} ${user?.last_name}`}
                            >
                                <span className="text-sm font-bold text-white uppercase">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </span>
                            </div>
                        </div>

                        {/* Logout Icon */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center p-2 rounded-lg transition-colors group relative"
                            style={{ color: theme.colors.danger }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${theme.colors.danger}15`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                            <div
                                className="absolute left-full ml-2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
                                style={{
                                    backgroundColor: theme.colors.surface,
                                    color: theme.colors.text,
                                    border: `1px solid ${theme.colors.border}`,
                                }}
                            >
                                Logout
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
