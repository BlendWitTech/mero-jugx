import Taskbar from '@shared/components/layouts/Taskbar/Taskbar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { getActiveAppIds, removeAppSession } from '../../services/appSessionService';

interface TaskbarWrapperProps {
  position?: 'top' | 'bottom' | 'left' | 'right';
  visibility?: 'always' | 'hover';
  onAppClick?: (appId: number) => void;
  onAppClose?: (appId: number) => void;
}

export default function TaskbarWrapper(props: TaskbarWrapperProps) {
  const { theme } = useTheme();
  const { organization } = useAuthStore();
  const navigate = useNavigate();

  return (
    <Taskbar
      {...props}
      theme={theme}
      organization={organization}
      navigate={navigate}
      getActiveAppIds={getActiveAppIds}
      removeAppSession={removeAppSession}
    />
  );
}

