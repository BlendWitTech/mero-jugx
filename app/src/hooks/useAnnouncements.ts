import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type?: 'welcome' | 'info' | 'announcement';
  image?: string;
  actionText?: string;
  actionUrl?: string;
  isFirstTime?: boolean; // For first-time user welcome
  targetAudience?: 'all' | 'new_users' | 'existing_users';
}

export function useAnnouncements() {
  const { user, organization, isAuthenticated, _hasHydrated } = useAuthStore();
  const location = useLocation();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !user || !organization) {
      setAnnouncement(null);
      setIsLoading(false);
      return;
    }

    // Only show announcements on the dashboard page
    // Exclude tickets and chat with admin pages - check FIRST before anything else
    const currentPath = location.pathname.toLowerCase();
    const isTicketsPage = currentPath.includes('/tickets') || currentPath.includes('ticket');
    const isChatAdminPage = currentPath.includes('/chat/admin') || currentPath.includes('chat/admin');
    
    // CRITICAL: Don't show announcements on tickets or chat admin pages - clear immediately
    if (isTicketsPage || isChatAdminPage) {
      if (announcement) {
        setAnnouncement(null);
      }
      setIsLoading(false);
      return;
    }
    
    // Only show on actual dashboard routes (explicitly check)
    const isRoot = currentPath === '/' || currentPath === '';
    const isDashboardRoute = currentPath.endsWith('/dashboard');
    const isOrgRoot = /^\/org\/[^/]+\/?$/.test(currentPath);
    const isOrgDashboard = /^\/org\/[^/]+\/dashboard\/?$/.test(currentPath);
    const isDashboard = isRoot || isDashboardRoute || isOrgRoot || isOrgDashboard;
    
    // Don't show announcements if not on dashboard
    if (!isDashboard) {
      if (announcement) {
        setAnnouncement(null);
      }
      setIsLoading(false);
      return;
    }

    const checkAnnouncements = async () => {
      try {
        // Check if user has seen first-time welcome (only show on first login)
        const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user.id}`);
        const isFirstTime = !hasSeenWelcome;

        // Check for system announcements first (admin-created announcements)
        try {
          const response = await api.get('/announcements/active');
          const activeAnnouncements = response.data?.announcements || [];
          
          // Find announcement for this user type
          const relevantAnnouncement = activeAnnouncements.find((ann: Announcement) => {
            if (ann.targetAudience === 'new_users' && !isFirstTime) return false;
            if (ann.targetAudience === 'existing_users' && isFirstTime) return false;
            
            // Check if user has already seen this announcement
            const seenKey = `announcement_seen_${ann.id}_${user.id}`;
            return !localStorage.getItem(seenKey);
          });

          if (relevantAnnouncement) {
            setAnnouncement(relevantAnnouncement);
            setIsLoading(false);
            return;
          }
        } catch (error: any) {
          // Silently handle 404 - endpoint doesn't exist yet, which is expected
          // No logging needed - this is expected behavior
          // Continue with first-time welcome if endpoint doesn't exist
        }

        // Show first-time welcome ONLY on first login (if user hasn't seen it)
        // After first login, don't show again unless there's a system admin announcement
        if (isFirstTime) {
          setAnnouncement({
            id: 'first-time-welcome',
            title: 'Welcome to Mero Jugx!',
            message: `Welcome, ${user.first_name}! We're excited to have you here.\n\nGet started by exploring your dashboard, managing your organization, and collaborating with your team.`,
            type: 'welcome',
            isFirstTime: true,
            targetAudience: 'new_users',
          });
        } else {
          // User has already seen welcome - don't show anything unless there's a system announcement
          setAnnouncement(null);
        }
      } catch (error) {
        // Silently handle errors - no logging needed
        setAnnouncement(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAnnouncements();
  }, [user, organization, isAuthenticated, _hasHydrated, location.pathname]);

  const dismissAnnouncement = (announcementId: string, permanent: boolean = false) => {
    if (!user) return;

    if (permanent) {
      // Mark as permanently dismissed
      localStorage.setItem(`announcement_seen_${announcementId}_${user.id}`, 'true');
    }

    // Mark first-time welcome as seen
    if (announcementId === 'first-time-welcome') {
      localStorage.setItem(`welcome_seen_${user.id}`, 'true');
    }

    setAnnouncement(null);
  };

  return {
    announcement,
    isLoading,
    dismissAnnouncement,
  };
}

