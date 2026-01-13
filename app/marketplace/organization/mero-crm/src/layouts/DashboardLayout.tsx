import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar, AppSidebarItem, MainContentArea } from '@shared';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAuthStore } from '@frontend/store/authStore';
import {
    LayoutDashboard,
    Users,
    FileText,
    CreditCard,
    LogOut,
    User,
} from 'lucide-react';

export function DashboardLayout() {
    const { theme } = useTheme();
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigationItems: AppSidebarItem[] = [
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
            name: 'Payments',
            href: '/payments',
            icon: CreditCard,
        },
    ];

    const footer = (
        <div className="border-t pt-2" style={{ borderColor: theme.colors.border }}>
            <div className="px-2 py-2 mb-1">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary }}
                    >
                        <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: theme.colors.text }}>
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs truncate" style={{ color: theme.colors.textSecondary }}>
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-colors"
                    style={{ color: theme.colors.textSecondary }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.border;
                        e.currentTarget.style.color = theme.colors.text;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden">
            <AppSidebar
                items={navigationItems}
                title="Mero CRM"
                footer={footer}
                theme={theme}
            />
            <MainContentArea theme={theme}>
                <div className="flex-1 overflow-auto">
                    <Outlet />
                </div>
            </MainContentArea>
        </div>
    );
}
