/**
 * Utility functions for app-specific routing and URL handling
 * 
 * Note: Most URL utilities have been moved to @/config/urlConfig
 * This file maintains backward compatibility and provides routing-specific helpers
 */

import { 
  getAppNameFromSubdomain as getAppNameFromConfig,
  isAppSubdomain,
  getMainDomainUrl,
  buildAppSubdomainUrl,
  redirectToAppSubdomain as redirectToAppSubdomainConfig
} from '../config/urlConfig';

/**
 * Extract app name from subdomain (e.g., appname.dev.merojugx.com -> appname)
 * @deprecated Use getAppNameFromSubdomain from @/config/urlConfig instead
 */
export function getAppNameFromSubdomain(): string | null {
  return getAppNameFromConfig();
}

/**
 * Check if current URL is an app-specific URL
 */
export function isAppSpecificUrl(): boolean {
  return isAppSubdomain();
}

/**
 * Get base URL for the application
 */
export function getBaseUrl(): string {
  return getMainDomainUrl();
}

/**
 * Get app route from app slug
 */
export function getAppRouteFromSlug(appSlug: string, orgSlug: string): string {
  return `/org/${orgSlug}/app/${appSlug}`;
}

/**
 * Check if we should redirect to app after login
 */
export function getRedirectToAppAfterLogin(): { appName: string; orgSlug?: string } | null {
  const appName = getAppNameFromSubdomain();
  if (appName) {
    return { appName };
  }
  return null;
}

/**
 * Redirect to app-specific subdomain
 */
export function redirectToAppSubdomain(appSlug: string, orgSlug: string): void {
  redirectToAppSubdomainConfig(appSlug, orgSlug);
}

/**
 * Build app subdomain URL
 */
export function buildAppUrl(appSlug: string, path: string = ''): string {
  return buildAppSubdomainUrl(appSlug, path);
}

