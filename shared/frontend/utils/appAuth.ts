/**
 * App-specific authentication and logout utilities
 * These utilities help apps handle authentication and logout properly
 * while maintaining the main Mero Jugx session
 */

import { useAuthStore } from '@frontend/store/authStore';
import { removeAppSession } from '@frontend/services/appSessionService';
import { getMainDomainUrl } from '@frontend/config/urlConfig';
import api from '@frontend/services/api';
import toast from '@shared/hooks/useToast';

/**
 * Logout from a specific app (keeps user logged in to Mero Jugx)
 * This removes the app session and navigates back to the main dashboard
 */
export async function logoutFromApp(appId: number, appSlug?: string): Promise<void> {
  try {
    // Remove app session
    removeAppSession(appId);

    // Remove from taskbar
    const storedApps = localStorage.getItem('taskbar_apps');
    if (storedApps) {
      const apps: any[] = JSON.parse(storedApps);
      const updated = apps.filter(a => a.id !== appId);
      localStorage.setItem('taskbar_apps', JSON.stringify(updated));
    }

    // Dispatch event to notify taskbar
    window.dispatchEvent(new CustomEvent('app-closed', { detail: { appId } }));

    // Remove app session header from API
    delete api.defaults.headers.common['X-App-Session'];

    toast.success('Logged out from app successfully');

    // Navigate back to main dashboard
    const organization = useAuthStore.getState().organization;
    const mainUrl = getMainDomainUrl();

    // Check if we're on localhost
    const isLocalhost = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname);

    if (organization?.slug) {
      if (isLocalhost) {
        // For localhost, use path-based routing
        window.location.href = `${mainUrl}/org/${organization.slug}`;
      } else {
        // For subdomain, navigate to main domain with org slug
        window.location.href = `${mainUrl}/org/${organization.slug}`;
      }
    } else {
      // Fallback to main domain root
      window.location.href = mainUrl;
    }
  } catch (error) {
    console.error('Error logging out from app:', error);
    toast.error('Failed to logout from app');
  }
}

/**
 * Get app ID from app slug
 */
export async function getAppIdFromSlug(appSlug: string): Promise<number | null> {
  try {
    const response = await api.get(`/marketplace/apps/slug/${appSlug}`);
    return response.data?.id || null;
  } catch (error) {
    console.error('Error fetching app ID:', error);
    return null;
  }
}

/**
 * Logout from app using app slug
 */
export async function logoutFromAppBySlug(appSlug: string): Promise<void> {
  try {
    const appId = await getAppIdFromSlug(appSlug);
    if (appId) {
      await logoutFromApp(appId, appSlug);
    } else {
      // If we can't get app ID, still try to logout by removing session if it exists
      // This handles cases where the API call fails but we still want to logout
      const organization = useAuthStore.getState().organization;
      const mainUrl = getMainDomainUrl();

      // Try to find app ID from localStorage taskbar apps
      const storedApps = localStorage.getItem('taskbar_apps');
      if (storedApps) {
        const apps: any[] = JSON.parse(storedApps);
        const app = apps.find((a: any) => a.slug === appSlug);
        if (app?.id) {
          await logoutFromApp(app.id, appSlug);
          return;
        }
      }

      // If we still can't find it, just navigate away
      toast.error('App not found, redirecting to dashboard');
      const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname);

      if (organization?.slug) {
        if (isLocalhost) {
          window.location.href = `${mainUrl}/org/${organization.slug}`;
        } else {
          window.location.href = `${mainUrl}/org/${organization.slug}`;
        }
      } else {
        window.location.href = mainUrl;
      }
    }
  } catch (error) {
    console.error('Error in logoutFromAppBySlug:', error);
    // Even if there's an error, try to navigate away
    const organization = useAuthStore.getState().organization;
    const mainUrl = getMainDomainUrl();
    const isLocalhost = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname);

    if (organization?.slug) {
      window.location.href = `${mainUrl}/org/${organization.slug}`;
    } else {
      window.location.href = mainUrl;
    }
    throw error;
  }
}

/**
 * Check if user has an active app session
 */
export function hasAppSession(appId: number): boolean {
  const { getAppSession, isAppSessionValid } = require('@frontend/services/appSessionService');
  const token = getAppSession(appId);
  return !!(token && isAppSessionValid(appId));
}

