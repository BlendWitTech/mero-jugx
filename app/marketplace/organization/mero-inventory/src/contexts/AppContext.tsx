import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@frontend/store/authStore';
import { isAppSubdomain } from '@frontend/config/urlConfig';

interface AppContextType {
    appSlug: string;
    organizationId: string;
    buildHref: (href: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({
    children,
    appSlug,
    organizationId
}: {
    children: ReactNode;
    appSlug: string;
    organizationId: string;
}) {
    const location = useLocation();
    const { organization } = useAuthStore();
    const isSubdomainRoute = isAppSubdomain();

    const buildHref = (href: string): string => {
        if (isSubdomainRoute) {
            const currentPath = location.pathname;
            let basePath = '/';
            const orgMatch = currentPath.match(/^(\/org\/[^/]+)/);
            if (orgMatch) {
                basePath = orgMatch[1];
            } else if (organization?.slug) {
                basePath = `/org/${organization.slug}`;
            }
            if (!href || href === '' || href === '/') return basePath;
            return `${basePath}${href.startsWith('/') ? href : `/${href}`}`;
        } else {
            const currentPath = location.pathname;
            // Updated regex for mero-inventory
            const appBaseMatch = currentPath.match(/\/org\/[^/]+\/app\/mero-inventory/);
            if (appBaseMatch) {
                const appBase = appBaseMatch[0];
                if (!href || href === '' || href === '/') return appBase;
                return `${appBase}${href.startsWith('/') ? href : `/${href}`}`;
            }
            if (organization?.slug) {
                const base = `/org/${organization.slug}/app/mero-inventory`;
                if (!href || href === '' || href === '/') return base;
                return `${base}${href.startsWith('/') ? href : `/${href}`}`;
            }
            return href;
        }
    };

    return (
        <AppContext.Provider value={{ appSlug, organizationId, buildHref }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
}
