import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { AppHeader } from '@shared';

interface AppHeaderWrapperProps {
  appName: string;
  organizationSlug?: string;
  onClose?: () => void;
}

const AppHeaderWrapper: React.FC<AppHeaderWrapperProps> = (props) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <AppHeader
      {...props}
      theme={theme}
      navigate={navigate}
    />
  );
};

export default AppHeaderWrapper;

