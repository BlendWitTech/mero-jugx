import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Get API URL from environment, ensuring it ends with /api/v1
const getApiBaseUrl = () => {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    // If VITE_API_URL is set, use it (it should already include /api/v1)
    // Remove trailing slash if present
    return viteApiUrl.endsWith('/') ? viteApiUrl.slice(0, -1) : viteApiUrl;
  }
  // If not set, use relative URL (will use Vite proxy)
  return '/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queue to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore.getState();
    const token = authStore.accessToken;
    
    // Skip adding Authorization header for MFA setup endpoints
    // These endpoints use temp_setup_token in headers instead
    const isMfaSetupEndpoint = config.url?.includes('/mfa/setup') || 
                               config.url?.includes('mfa/setup') ||
                               (config.baseURL && config.url && `${config.baseURL}${config.url}`.includes('/mfa/setup'));
    
    // Don't add Authorization header for MFA setup endpoints
    // They use X-MFA-Setup-Token header instead
    if (isMfaSetupEndpoint && config.headers) {
      // Explicitly remove Authorization header if present for MFA setup endpoints
      delete config.headers.Authorization;
      delete config.headers.authorization;
    } else if (!isMfaSetupEndpoint && token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip refresh logic for auth endpoints (login, refresh, register) and MFA setup endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/refresh') ||
                          originalRequest.url?.includes('/auth/organization/register');
    
    // Skip refresh logic for MFA setup endpoints (they use temp_setup_token)
    const isMfaSetupEndpoint = originalRequest.url?.includes('/mfa/setup');

    // For login endpoint errors, check if it's actually an MFA setup requirement
    if (isAuthEndpoint && originalRequest.url?.includes('/auth/login')) {
      const errorData = error.response?.data;
      // If it's a 200 response that got here somehow, or if it contains MFA setup info, let it through
      if (error.response?.status === 200 || (errorData as any)?.requires_mfa_setup || (errorData as any)?.temp_setup_token) {
        // This shouldn't happen, but if it does, return the data as if it was successful
        return Promise.resolve({ data: errorData, status: 200 });
      }
      // Otherwise, let the error propagate normally
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isMfaSetupEndpoint) {
      // Check if MFA setup is required
      const errorData = error.response?.data;
      if ((errorData as any)?.code === 'MFA_SETUP_REQUIRED' || (errorData as any)?.requires_mfa_setup) {
        const currentPath = window.location.pathname;
        if (currentPath !== '/mfa/setup') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[MFA Setup] Redirecting to MFA setup page');
          }
          window.location.href = '/mfa/setup';
        }
        return Promise.reject(error);
      }

      const authStore = useAuthStore.getState();
      const refreshToken = authStore.refreshToken;

      // If no refresh token, logout immediately
      if (!refreshToken) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Token Refresh] No refresh token available, logging out');
        }
        authStore.logout();
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && !currentPath.startsWith('/verify-email') && !currentPath.startsWith('/reset-password') && !currentPath.startsWith('/accept-invitation') && currentPath !== '/mfa/setup') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Token Refresh] Attempting to refresh token...', {
            hasRefreshToken: !!refreshToken,
            refreshTokenLength: refreshToken?.length || 0,
            originalUrl: originalRequest.url,
          });
        }

        // Try to refresh the token (use plain axios to avoid interceptor loop)
        // Use the same baseURL as the api instance
        const baseUrl = api.defaults.baseURL || '/api/v1';
        const refreshUrl = baseUrl.endsWith('/') 
          ? `${baseUrl}auth/refresh`
          : `${baseUrl}/auth/refresh`;
        const response = await axios.post(refreshUrl, {
          refresh_token: refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const { access_token } = response.data;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[Token Refresh] Token refreshed successfully', {
            hasNewAccessToken: !!access_token,
            newTokenLength: access_token?.length || 0,
          });
        }
        
        if (!access_token) {
          throw new Error('No access token received from refresh endpoint');
        }

        // Update the store with new token
        if (authStore.user && authStore.organization) {
          authStore.setAuth(
            { access_token, refresh_token: refreshToken },
            authStore.user,
            authStore.organization
          );
        } else {
          authStore.updateToken(access_token);
        }

        // Process queued requests
        processQueue(null, access_token);

        // Retry the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed, process queue with error and logout
        isRefreshing = false;
        processQueue(refreshError, null);
        
        if (process.env.NODE_ENV === 'development') {
          console.error('[Token Refresh] Failed to refresh token', {
            error: refreshError?.response?.data || refreshError?.message,
            status: refreshError?.response?.status,
          });
        }
        
        const authStore = useAuthStore.getState();
        authStore.logout();
        
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && !currentPath.startsWith('/verify-email') && !currentPath.startsWith('/reset-password') && !currentPath.startsWith('/accept-invitation') && currentPath !== '/mfa/setup') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Show user-friendly error messages for non-401 errors
    // Skip showing errors for auth endpoints (they handle their own errors)
    if (error.response?.status && error.response.status !== 401 && !isAuthEndpoint && !isMfaSetupEndpoint) {
      const errorMessage = (error.response?.data as any)?.message || error.message || 'An error occurred';
      const status = error.response.status;
      
      // Convert technical error messages to user-friendly ones
      let userFriendlyMessage = errorMessage;
      
      // Role hierarchy errors
      if (errorMessage.includes('cannot view users with the same or higher role level') || 
          errorMessage.includes('cannot view users with higher role level') ||
          errorMessage.includes('You cannot view users with the same or higher role level')) {
        userFriendlyMessage = 'You do not have permission to view this user. You can only view users with lower roles than yours.';
      } else if (errorMessage.includes('Organization Owner cannot be edited') ||
                 errorMessage.includes('Organization Owner cannot be edited by any other user')) {
        userFriendlyMessage = 'Organization owners can only edit their own profile. You cannot edit another organization owner\'s profile.';
      } else if (errorMessage.includes('cannot edit users with the same or higher role level') ||
                 errorMessage.includes('cannot edit users with higher role level')) {
        userFriendlyMessage = 'You do not have permission to edit this user. You can only edit users with lower roles than yours.';
      } else if (errorMessage.includes('cannot revoke access') ||
                 errorMessage.includes('cannot revoke access for users')) {
        userFriendlyMessage = 'You do not have permission to revoke this user\'s access. You can only revoke access for users with lower roles than yours.';
      } else if (errorMessage.includes('Chat feature is not available')) {
        userFriendlyMessage = errorMessage; // Already user-friendly
      } else if (errorMessage.includes('do not have permission') ||
                 errorMessage.includes('Insufficient permissions')) {
        userFriendlyMessage = errorMessage; // Already user-friendly
      } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        userFriendlyMessage = 'The requested resource was not found.';
      } else if (errorMessage.includes('already exists') || errorMessage.includes('already taken')) {
        userFriendlyMessage = errorMessage || 'This resource already exists. Please use a different value.';
      } else if (status === 403) {
        userFriendlyMessage = errorMessage || 'You do not have permission to perform this action.';
      } else if (status === 404) {
        userFriendlyMessage = 'The requested resource was not found.';
      } else if (status === 400) {
        userFriendlyMessage = errorMessage || 'Invalid request. Please check your input and try again.';
      } else if (status === 409) {
        userFriendlyMessage = errorMessage || 'This resource already exists. Please use a different value.';
      } else if (status === 422) {
        userFriendlyMessage = errorMessage || 'Validation error. Please check your input and try again.';
      } else if (status === 500) {
        userFriendlyMessage = 'A server error occurred. Please try again later or contact support if the problem persists.';
      } else if (status >= 500) {
        userFriendlyMessage = 'A server error occurred. Please try again later or contact support if the problem persists.';
      }
      
      // Show toast notification
      toast.error(userFriendlyMessage, {
        duration: 5000,
        position: 'top-right',
      });
    }

    return Promise.reject(error);
  },
);

export default api;

