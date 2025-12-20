import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { marketplaceService } from '../../services/marketplaceService';
import { useEffect, useState, useRef } from 'react';
import AppAuthModal from '../../components/AppAuthModal';
import MeroBoard from '../../components/MeroBoard';
import { 
  getAppSession, 
  setAppSession, 
  removeAppSession, 
  updateAppActivity, 
  isAppSessionValid
} from '../../services/appSessionService';

export default function AppViewPage() {
  const { appId } = useParams<{ appId: string }>();
  const { organization, user } = useAuthStore();
  const navigate = useNavigate();
  const appIdNum = appId ? parseInt(appId, 10) : null;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasAppSession, setHasAppSession] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing app session token and validate timeout
  useEffect(() => {
    if (!appIdNum) return;

    // Clean up expired sessions
    const token = getAppSession(appIdNum);
    if (token && isAppSessionValid(appIdNum)) {
      setHasAppSession(true);
      setNeedsReauth(false);
      setShowAuthModal(false);
      updateAppActivity(appIdNum);
      // Set token in API headers
      api.defaults.headers.common['X-App-Session'] = token;
    } else {
      setHasAppSession(false);
      removeAppSession(appIdNum);
    }
  }, [appIdNum]);

  // Track user activity in the app (mouse movements, clicks, keyboard)
  useEffect(() => {
    if (!appIdNum || !hasAppSession) return;

    const handleActivity = () => {
      updateAppActivity(appIdNum);
    };

    // Update activity on user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Also update activity periodically (every 5 minutes) to ensure it stays active
    activityIntervalRef.current = setInterval(() => {
      if (isAppSessionValid(appIdNum)) {
        updateAppActivity(appIdNum);
      } else {
      // Session expired, require re-auth
      setHasAppSession(false);
      setNeedsReauth(true);
      setShowAuthModal(true);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [appIdNum, hasAppSession]);

  // Fetch user data to check MFA status
  const { data: userData } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data;
    },
    enabled: !!appIdNum,
  });

  const hasMfa = userData?.mfa_enabled || userData?.has_mfa || false;

  // Fetch app details
  const { data: app, isLoading, error } = useQuery({
    queryKey: ['app', appId],
    queryFn: async () => {
      if (!appIdNum) throw new Error('Invalid app ID');
      const response = await api.get(`/marketplace/apps/${appIdNum}`);
      return response.data;
    },
    enabled: !!appIdNum,
  });

  // Fetch organization app subscription
  const { data: orgApp } = useQuery({
    queryKey: ['organization-app', organization?.id, appId],
    queryFn: async () => {
      if (!organization?.id || !appIdNum) return null;
      const response = await api.get(`/organizations/${organization.id}/apps`);
      const orgApps = response.data.data || [];
      return orgApps.find((oa: any) => oa.app_id === appIdNum);
    },
    enabled: !!organization?.id && !!appIdNum,
  });

  // Check if user has access
  const hasAccess = orgApp && (orgApp.status === 'active' || orgApp.status === 'trial');

  // Check if authentication is needed when app loads
  useEffect(() => {
    if (appIdNum && hasAccess && !isLoading) {
      // Check if session is valid (not expired)
      if (!isAppSessionValid(appIdNum)) {
        setHasAppSession(false);
        setNeedsReauth(true);
        setShowAuthModal(true);
      } else {
        const token = getAppSession(appIdNum);
        if (token) {
          setHasAppSession(true);
          setNeedsReauth(false);
          setShowAuthModal(false);
          updateAppActivity(appIdNum);
          api.defaults.headers.common['X-App-Session'] = token;
        } else {
          setHasAppSession(false);
          setNeedsReauth(true);
          setShowAuthModal(true);
        }
      }
    }
  }, [appIdNum, hasAccess, isLoading]);

  // Record app usage
  useEffect(() => {
    if (appIdNum && hasAppSession) {
      marketplaceService.recordUsage(appIdNum).catch(console.error);
    }
  }, [appIdNum, hasAppSession]);

  // Handler functions (must be defined before early returns)
  const handleAuthSuccess = (token: string) => {
    if (appIdNum && token) {
      setAppSession(appIdNum, token);
      setHasAppSession(true);
      setNeedsReauth(false);
      setShowAuthModal(false);
      updateAppActivity(appIdNum);
      // Add token to API headers for subsequent requests
      api.defaults.headers.common['X-App-Session'] = token;
      // App is now authenticated and will automatically load (no need to click Enter)
    }
  };

  const handleLogout = () => {
    if (appIdNum) {
      removeAppSession(appIdNum);
      setHasAppSession(false);
      setNeedsReauth(true);
      setShowAuthModal(true);
      delete api.defaults.headers.common['X-App-Session'];
    }
  };

  const handleAuthClose = () => {
    // If user closes modal without authenticating, redirect back
    navigate(`/org/${organization?.slug}/apps`);
  };

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#36393f]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5865f2]" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex items-center justify-center h-full bg-[#36393f]">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">App Not Found</h2>
          <p className="text-[#b9bbbe]">The app you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full bg-[#36393f]">
        <div className="text-center max-w-md p-8 bg-[#2f3136] rounded-xl border border-[#202225]">
          <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Required</h2>
          <p className="text-[#b9bbbe] mb-6">
            You need to subscribe to this app to access it. Please go to the Apps page to purchase a subscription.
          </p>
          <a
            href={`/org/${organization?.slug}/apps`}
            className="inline-block px-6 py-3 bg-[#5865f2] text-white rounded-lg font-medium hover:bg-[#4752c4] transition-colors"
          >
            Go to Apps
          </a>
        </div>
      </div>
    );
  }

  // Show locked screen (auth modal) if no session token or needs re-auth
  if (!hasAppSession || needsReauth) {
    return (
      <div className="h-full bg-[#36393f] flex items-center justify-center">
        <AppAuthModal
          isOpen={showAuthModal || needsReauth}
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
          appName={app?.name || 'App'}
          hasMfa={hasMfa}
          userEmail={user?.email || ''}
          appId={appIdNum || undefined}
        />
      </div>
    );
  }

  // Load the appropriate app component based on slug
  if (app.slug === 'mero-board') {
    return <MeroBoard onLogout={handleLogout} />;
  }

  // Default placeholder for other apps
  return (
    <div className="h-full bg-[#36393f] flex flex-col">
      <div className="bg-[#2f3136] border-b border-[#202225] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{app.name}</h1>
          <p className="text-[#b9bbbe] mt-1">{app.description}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-[#ed4245] hover:bg-[#c03537] text-white rounded-lg transition-colors text-sm font-medium"
          title="Logout from app"
        >
          Logout
        </button>
      </div>
      <div className="flex-1 p-6">
        <div className="bg-[#2f3136] rounded-lg p-8 border border-[#202225] text-center">
          <h2 className="text-xl font-semibold text-white mb-4">App Interface</h2>
          <p className="text-[#b9bbbe] mb-6">
            The app interface for {app.name} will be loaded here. This is a placeholder for the actual app component.
          </p>
        </div>
      </div>
    </div>
  );
}

