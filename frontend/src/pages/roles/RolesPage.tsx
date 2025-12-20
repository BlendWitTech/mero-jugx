import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { PermissionsReviewTab } from './PermissionsReviewPage';

export default function RolesPage() {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const { theme } = useTheme();

  if (!_hasHydrated || !isAuthenticated || !accessToken) {
    return null;
  }

  return (
    <div className="w-full p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <PermissionsReviewTab />
    </div>
  );
}
