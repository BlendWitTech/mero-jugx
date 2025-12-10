import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import LoginPage from './pages/auth/LoginPage';
import RegisterOrganizationPage from './pages/auth/RegisterOrganizationPage';
import OrganizationDashboardLayout from './layouts/OrganizationDashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import OrganizationsPage from './pages/organizations/OrganizationsPage';
import InvitationsPage from './pages/invitations/InvitationsPage';
import RolesPage from './pages/roles/RolesPage';
import PackagesPage from './pages/packages/PackagesPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';
import MfaSetupPage from './pages/mfa/MfaSetupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AcceptInvitationPage from './pages/invitations/AcceptInvitationPage';
import AuditLogsPage from './pages/audit-logs/AuditLogsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';
import PaymentFailurePage from './pages/payment/PaymentFailurePage';
import MockEsewaPage from './pages/payment/MockEsewaPage';
import DocumentationPage from './pages/documentation/DocumentationPage';
import ChatPage from './pages/chat/ChatPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import { OnboardingProvider } from './components/Onboarding/OnboardingProvider';
import api from './services/api';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  
  // Wait for hydration before checking authentication
  if (!_hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-[#36393f] text-white">Loading...</div>;
  }
  
  // Check both isAuthenticated flag and actual token presence
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function NotFoundRoute() {
  const { isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  
  // Wait for hydration before checking authentication
  if (!_hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-[#36393f] text-white">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, redirect to dashboard with organization slug
  if (organization?.slug) {
    return <Navigate to={`/org/${organization.slug}`} replace />;
  }
  
  return <Navigate to="/" replace />;
}

// Route wrapper to validate organization slug
function OrganizationRoute({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const { organization, isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !accessToken) return;

    // If we have a slug in URL but it doesn't match current organization, fetch and redirect
    if (slug && organization?.slug && slug !== organization.slug) {
      // Fetch current organization to get the correct slug
      api.get('/organizations/me')
        .then((response) => {
          const currentOrg = response.data;
          if (currentOrg.slug && currentOrg.slug !== slug) {
            // Redirect to correct slug
            const currentPath = window.location.pathname;
            const newPath = currentPath.replace(`/org/${slug}`, `/org/${currentOrg.slug}`);
            navigate(newPath, { replace: true });
          }
        })
        .catch(() => {
          // If fetch fails, just redirect to root
          navigate('/', { replace: true });
        });
    } else if (!slug && organization?.slug) {
      // If no slug in URL but we have one, redirect to include it
      const currentPath = window.location.pathname;
      navigate(`/org/${organization.slug}${currentPath === '/' ? '' : currentPath}`, { replace: true });
    }
  }, [slug, organization?.slug, isAuthenticated, accessToken, _hasHydrated, navigate]);

  return <>{children}</>;
}

// Legacy redirect component - redirects to organization slug route
function LegacyRedirect() {
  const { organization, _hasHydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (organization?.slug) {
      navigate(`/org/${organization.slug}`, { replace: true });
    } else {
      // If no organization slug, try to fetch it
      api.get('/organizations/me')
        .then((response) => {
          const org = response.data;
          if (org.slug) {
            navigate(`/org/${org.slug}`, { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        })
        .catch(() => {
          navigate('/login', { replace: true });
        });
    }
  }, [organization?.slug, _hasHydrated, navigate]);

  return <div className="min-h-screen flex items-center justify-center bg-[#36393f] text-white">Loading...</div>;
}

function App() {
  return (
    <OnboardingProvider>
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOrganizationPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/mfa/setup" element={<MfaSetupPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/failure" element={<PaymentFailurePage />} />
      <Route path="/payment/mock-esewa" element={<MockEsewaPage />} />

      {/* Protected Routes with Organization Slug */}
      <Route
        path="/org/:slug"
        element={
          <PrivateRoute>
            <OrganizationRoute>
              <OrganizationDashboardLayout />
            </OrganizationRoute>
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="invitations" element={<InvitationsPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="documentation" element={<DocumentationPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Legacy route without slug - redirect to slug route if organization exists */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <LegacyRedirect />
          </PrivateRoute>
        }
      />

      {/* 404 - Redirect to login if not authenticated, otherwise to dashboard */}
      <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </OnboardingProvider>
  );
}

export default App;

