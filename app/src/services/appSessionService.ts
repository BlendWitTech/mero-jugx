/**
 * Service to manage per-app sessions with timeout tracking
 * Each app has its own session token and last activity timestamp
 */

const APP_SESSION_PREFIX = 'app_session_';
const APP_ACTIVITY_PREFIX = 'app_activity_';
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

interface AppSession {
  token: string;
  appId: number;
  timestamp: number;
}

/**
 * Store app session token for a specific app
 */
export function setAppSession(appId: number, token: string): void {
  const sessionData: AppSession = {
    token,
    appId,
    timestamp: Date.now(),
  };
  localStorage.setItem(`${APP_SESSION_PREFIX}${appId}`, JSON.stringify(sessionData));
  updateAppActivity(appId);
}

/**
 * Get app session token for a specific app
 */
export function getAppSession(appId: number): string | null {
  const sessionDataStr = localStorage.getItem(`${APP_SESSION_PREFIX}${appId}`);
  if (!sessionDataStr) return null;

  try {
    const sessionData: AppSession = JSON.parse(sessionDataStr);
    
    // Check if session is expired
    const now = Date.now();
    const lastActivity = getAppActivity(appId);
    const timeSinceActivity = lastActivity ? now - lastActivity : Infinity;
    
    if (timeSinceActivity > SESSION_TIMEOUT) {
      // Session expired, remove it
      removeAppSession(appId);
      return null;
    }

    // Check token expiry
    try {
      const payload = JSON.parse(atob(sessionData.token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < now) {
        removeAppSession(appId);
        return null;
      }
    } catch {
      // Invalid token format, remove it
      removeAppSession(appId);
      return null;
    }

    return sessionData.token;
  } catch {
    // Invalid session data, remove it
    removeAppSession(appId);
    return null;
  }
}

/**
 * Remove app session for a specific app
 */
export function removeAppSession(appId: number): void {
  localStorage.removeItem(`${APP_SESSION_PREFIX}${appId}`);
  localStorage.removeItem(`${APP_ACTIVITY_PREFIX}${appId}`);
}

/**
 * Remove all app sessions (logout from all apps)
 */
export function removeAllAppSessions(): void {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(APP_SESSION_PREFIX) || key.startsWith(APP_ACTIVITY_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  // Also remove legacy single app_session_token
  localStorage.removeItem('app_session_token');
}

/**
 * Update last activity timestamp for an app
 */
export function updateAppActivity(appId: number): void {
  localStorage.setItem(`${APP_ACTIVITY_PREFIX}${appId}`, Date.now().toString());
}

/**
 * Get last activity timestamp for an app
 */
export function getAppActivity(appId: number): number | null {
  const activityStr = localStorage.getItem(`${APP_ACTIVITY_PREFIX}${appId}`);
  if (!activityStr) return null;
  return parseInt(activityStr, 10);
}

/**
 * Check if app session is valid (not expired)
 */
export function isAppSessionValid(appId: number): boolean {
  const token = getAppSession(appId);
  if (!token) return false;

  const lastActivity = getAppActivity(appId);
  if (!lastActivity) return false;

  const now = Date.now();
  const timeSinceActivity = now - lastActivity;
  
  return timeSinceActivity <= SESSION_TIMEOUT;
}

/**
 * Get all active app IDs
 */
export function getActiveAppIds(): number[] {
  const keys = Object.keys(localStorage);
  const appIds: number[] = [];
  
  keys.forEach((key) => {
    if (key.startsWith(APP_SESSION_PREFIX)) {
      const appIdStr = key.replace(APP_SESSION_PREFIX, '');
      const appId = parseInt(appIdStr, 10);
      if (!isNaN(appId) && isAppSessionValid(appId)) {
        appIds.push(appId);
      }
    }
  });
  
  return appIds;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(APP_SESSION_PREFIX)) {
      const appIdStr = key.replace(APP_SESSION_PREFIX, '');
      const appId = parseInt(appIdStr, 10);
      if (!isNaN(appId) && !isAppSessionValid(appId)) {
        removeAppSession(appId);
      }
    }
  });
}

