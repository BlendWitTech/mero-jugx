import React from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingModal } from './OnboardingModal';

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showOnboarding, steps, announcementId, completeOnboarding, skipOnboarding } = useOnboarding();

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingModal
          steps={steps}
          onComplete={() => completeOnboarding(announcementId)}
          onSkip={() => skipOnboarding(announcementId)}
        />
      )}
    </>
  );
};

