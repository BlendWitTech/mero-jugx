import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  component?: React.ReactNode;
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
  const { user, organization } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      if (!user || !organization) return;

      try {
        // Check user preference or organization setting
        const response = await api.get('/users/me');
        const userData = response.data;

        // If user hasn't completed onboarding, show it
        if (!userData.onboarding_completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        // If endpoint doesn't exist, check localStorage
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (!onboardingCompleted) {
          setShowOnboarding(true);
        }
      }
    };

    checkOnboarding();
  }, [user, organization]);

  const completeOnboarding = async () => {
    try {
      // Mark onboarding as completed
      await api.put('/users/me', { onboarding_completed: true });
      localStorage.setItem('onboarding_completed', 'true');
    } catch (error) {
      // Fallback to localStorage
      localStorage.setItem('onboarding_completed', 'true');
    }
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    steps,
    completeOnboarding,
    skipOnboarding,
  };
}

