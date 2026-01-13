import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { useAppContext } from '../contexts/AppContext';
import MeroCrmSidebar from '../components/MeroCrmSidebar';
import { isAppSubdomain } from '@frontend/config/urlConfig';

export default function MeroCrmLayout() {
    const { theme } = useTheme();
    const { organizationId, buildHref } = useAppContext();
    const location = useLocation();

    // Check if path is active
    const checkActive = (href: string, currentPath: string): boolean => {
        // We can simplify this now that we have the context
        let appPath: string;
        const isSubdomainRoute = isAppSubdomain();

        if (isSubdomainRoute) {
            const orgMatch = currentPath.match(/^\/org\/[^/]+(.*)$/);
            appPath = orgMatch ? orgMatch[1] || '/' : currentPath;
        } else {
            appPath = currentPath.includes('/app/mero-crm')
                ? currentPath.split('/app/mero-crm')[1] || '/'
                : currentPath;
        }

        if (href === '' || href === '/') {
            return appPath === '' || appPath === '/';
        }
        return appPath.startsWith(href);
    };

    return (
        <div className="h-full w-full flex overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
            <MeroCrmSidebar
                appSlug="mero-crm"
                buildHref={buildHref}
                checkActive={checkActive}
            />

            <div
                className="flex-1 flex flex-col overflow-hidden"
                style={{ backgroundColor: theme.colors.background }}
            >
                <div
                    className="flex-1 overflow-y-auto scrollbar-thin transition-colors duration-300"
                    style={{
                        backgroundColor: theme.colors.background,
                        scrollbarColor: `${theme.colors.border} transparent`
                    }}
                >
                    <main className="h-full">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
