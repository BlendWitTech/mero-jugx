import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  component?: React.ReactNode;
}

export interface SystemAnnouncement {
  id: string;
  steps: OnboardingStep[];
  targetAudience?: 'all' | 'new_users' | 'existing_users';
  isActive: boolean;
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Mero Jugx!',
    description:
      'Your organization-based collaboration platform. Let\'s get you started with a quick tour.',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description:
      'The dashboard is your command center. Here you can see all your organizations, recent activity, and quick actions.',
  },
  {
    id: 'organizations',
    title: 'Manage Organizations',
    description:
      'Create and manage multiple organizations. Switch between them easily to work with different teams.',
  },
  {
    id: 'users',
    title: 'User Management',
    description:
      'Invite team members, assign roles, and manage permissions. Keep your team organized and secure.',
  },
  {
    id: 'chat',
    title: 'Real-time Chat',
    description:
      'Communicate with your team in real-time. Create group chats, share files, and stay connected.',
  },
];

export function useOnboarding() {
  const { user, organization, isAuthenticated, _hasHydrated } = useAuthStore();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);
  const [announcementId, setAnnouncementId] = useState<string | undefined>();

  useEffect(() => {
    // Only check onboarding on dashboard page
    const currentPath = location.pathname.toLowerCase();
    const isRoot = currentPath === '/' || currentPath === '';
    const isDashboardRoute = currentPath.endsWith('/dashboard');
    const isOrgRoot = /^\/org\/[^/]+\/?$/.test(currentPath);
    const isOrgDashboard = /^\/org\/[^/]+\/dashboard\/?$/.test(currentPath);
    const isDashboard = isRoot || isDashboardRoute || isOrgRoot || isOrgDashboard;

    // Don't show onboarding if not on dashboard
    if (!isDashboard) {
      setShowOnboarding(false);
      return;
    }

    // Wait for auth to hydrate
    if (!_hasHydrated || !isAuthenticated || !user || !organization) {
      setShowOnboarding(false);
      return;
    }

    const checkOnboarding = async () => {
      try {
        // Check if user has seen first-time welcome (only show on first login/register)
        const hasSeenWelcome = localStorage.getItem(`onboarding_completed_${user.id}`);
        const isFirstTime = !hasSeenWelcome;

        // First, check for system admin announcements (multi-step announcements)
        try {
          const response = await api.get('/announcements/active');
          const activeAnnouncements = response.data?.announcements || response.data || [];
          
          // Find relevant announcement for this user
          const relevantAnnouncement = activeAnnouncements.find((ann: SystemAnnouncement) => {
            if (!ann.isActive) return false;
            
            // Check target audience
            if (ann.targetAudience === 'new_users' && !isFirstTime) return false;
            if (ann.targetAudience === 'existing_users' && isFirstTime) return false;
            
            // Check if user has already seen this announcement
            const seenKey = `announcement_seen_${ann.id}_${user.id}`;
            return !localStorage.getItem(seenKey);
          });

          if (relevantAnnouncement && relevantAnnouncement.steps && relevantAnnouncement.steps.length > 0) {
            // Use system admin announcement steps
            setSteps(relevantAnnouncement.steps);
            setAnnouncementId(relevantAnnouncement.id);
            setShowOnboarding(true);
            return;
          } else {
            setAnnouncementId(undefined);
          }
        } catch (error: any) {
          // Silently handle 404 - endpoint doesn't exist yet
          // No logging needed - this is expected behavior
        }

        // If no system announcement, check for first-time welcome
        if (isFirstTime) {
          // Show default welcome steps for first-time users
          setSteps(defaultSteps);
          setAnnouncementId(undefined); // No announcement ID for default welcome
          setShowOnboarding(true);
        } else {
          // User has already seen welcome - don't show unless there's a system announcement
          setAnnouncementId(undefined);
          setShowOnboarding(false);
        }
      } catch (error) {
        // Fallback: check localStorage for first-time users
        const onboardingCompleted = localStorage.getItem(`onboarding_completed_${user.id}`);
        if (!onboardingCompleted) {
          setSteps(defaultSteps);
          setAnnouncementId(undefined);
          setShowOnboarding(true);
        } else {
          setAnnouncementId(undefined);
          setShowOnboarding(false);
        }
      }
    };

    checkOnboarding();
  }, [user, organization, isAuthenticated, _hasHydrated, location.pathname]);

  const completeOnboarding = async (announcementId?: string) => {
    if (!user) return;

    try {
      // Mark onboarding as completed for this user
      await api.put('/users/me', { onboarding_completed: true });
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      
      // If this was a system announcement, mark it as seen
      if (announcementId) {
        localStorage.setItem(`announcement_seen_${announcementId}_${user.id}`, 'true');
      }
    } catch (error) {
      // Fallback to localStorage
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      if (announcementId) {
        localStorage.setItem(`announcement_seen_${announcementId}_${user.id}`, 'true');
      }
    }
    setShowOnboarding(false);
  };

  const skipOnboarding = (announcementId?: string) => {
    if (!user) return;
    
    localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    if (announcementId) {
      localStorage.setItem(`announcement_seen_${announcementId}_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    steps,
    announcementId,
    completeOnboarding,
    skipOnboarding,
  };
}

