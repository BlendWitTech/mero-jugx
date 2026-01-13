import { NotificationDropdown } from '@shared/components/notifications/NotificationDropdown';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function NotificationDropdownWrapper() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  const navigate = useNavigate();

  return (
    <NotificationDropdown
      theme={theme}
      isDark={isDark}
      organization={organization}
      isAuthenticated={isAuthenticated}
      accessToken={accessToken}
      _hasHydrated={_hasHydrated}
      navigate={navigate}
      api={api}
    />
  );
}

