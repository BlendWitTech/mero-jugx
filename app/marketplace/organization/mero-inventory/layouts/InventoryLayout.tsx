import React from 'react';
import { Outlet } from 'react-router-dom';
import InventorySidebar from '../components/InventorySidebar';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import api from '@frontend/services/api';
import { useAppContext } from '../contexts/AppContext';
import { useLocation } from 'react-router-dom';
import { isAppSubdomain } from '@frontend/config/urlConfig';

export default function InventoryLayout() {
    const { theme } = useTheme();
    const { buildHref } = useAppContext();
    const location = useLocation();
    const appSlug = 'mero-inventory';

    // Fetch organization members
    const { data: members = [] } = useQuery({
        queryKey: ['organization-members'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data.users || [];
        },
    });

    // Check if path is active
    const checkActive = (href: string, currentPath: string): boolean => {
        let appPath: string;
        const isSubdomainRoute = isAppSubdomain();

        if (isSubdomainRoute) {
            const orgMatch = currentPath.match(/^\/org\/[^/]+(.*)$/);
            appPath = orgMatch ? orgMatch[1] || '/' : currentPath;
        } else {
            appPath = currentPath.includes(`/app/${appSlug}`)
                ? currentPath.split(`/app/${appSlug}`)[1] || '/'
                : currentPath;
        }

        if (href === '' || href === '/') {
            return appPath === '' || appPath === '/';
        }
        return appPath.startsWith(href);
    };

    return (
        <div className="flex h-full w-full" style={{ backgroundColor: theme.colors.background }}>
            <InventorySidebar
                appSlug={appSlug}
                buildHref={buildHref}
                checkActive={checkActive}
                members={members}
            />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
