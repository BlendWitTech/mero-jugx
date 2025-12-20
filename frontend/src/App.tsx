import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import LoginPage from './pages/auth/LoginPage';
import RoleSelectionPage from './pages/auth/RoleSelectionPage';
import RegisterOrganizationPage from './pages/auth/RegisterOrganizationPage';
import OrganizationDashboardLayout from './layouts/OrganizationDashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import OrganizationsPage from './pages/organizations/OrganizationsPage';
import InvitationsPage from './pages/invitations/InvitationsPage';
import RolesPage from './pages/roles/RolesPage';
import PermissionsReviewPage from './pages/roles/PermissionsReviewPage';
import PackagesPage from './pages/packages/PackagesPage';
import AppsPage from './pages/apps/AppsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/profile/ProfilePage';
import MfaSetupPage from './pages/mfa/MfaSetupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import AcceptInvitationPage from './pages/invitations/AcceptInvitationPage';
import AuditLogsPage from './pages/audit-logs/AuditLogsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';
import PaymentFailurePage from './pages/payment/PaymentFailurePage';
import MockEsewaPage from './pages/payment/MockEsewaPage';
import DocumentationPage from './pages/documentation/DocumentationPage';
import ChatPage from './pages/chat/ChatPage';
import AdminChatPage from './pages/admin-chat/AdminChatPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import TicketsPage from './pages/tickets/TicketsPage';
import CreateTicketPage from './pages/tickets/CreateTicketPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import AppViewPage from './pages/apps/AppViewPage';
import ComingSoonPage from './pages/creator/ComingSoonPage';
import BillingPage from './pages/billing/BillingPage';
import { OnboardingProvider } from './components/Onboarding/OnboardingProvider';
import ErrorBoundary from './components/ErrorBoundary';
import api from './services/api';
import { ProtectedRoute } from './components/ProtectedRoute';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  
  // Wait for hydration before checking authentication
  if (!_hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-[#36393f] text-white">Loading...</div>;
  }
  
  // Check both isAuthenticated flag and actual token presence
  // Redirect to role selection instead of login
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function NotFoundRoute() {
  const { isAuthenticated, accessToken, _hasHydrated, organization } = useAuthStore();
  
  // Wait for hydration before checking authentication
  if (!_hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-[#36393f] text-white">Loading...</div>;
  }
  
  // If not authenticated, redirect to role selection
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/" replace />;
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

// Root route component - shows role selection for unauthenticated users, redirects for authenticated
function RootRoute() {
  const { isAuthenticated, accessToken, organization, _hasHydrated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!_hasHydrated) return;

    // If authenticated, redirect to organization dashboard
    if (isAuthenticated && accessToken) {
      if (organization?.slug) {
        navigate(`/org/${organization.slug}`, { replace: true });
      } else {
        // If no organization slug, try to fetch it
        api.get('/organizations/me')
          .then((response) => {
            const org = response.data;
            if (org.slug) {
              navigate(`/org/${org.slug}`, { replace: true });
            }
          })
          .catch(() => {
            // If fetch fails, stay on role selection
          });
      }
    }
    // If not authenticated, show role selection (no redirect needed)
  }, [isAuthenticated, accessToken, organization?.slug, _hasHydrated, navigate]);

  // Show loading while checking authentication
  if (!_hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-[#36393f] text-white">Loading...</div>;
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated && accessToken) {
    return <div className="min-h-screen flex items-center justify-center bg-[#36393f] text-white">Loading...</div>;
  }

  // Show role selection for unauthenticated users
  return <RoleSelectionPage />;
}

function App() {
  return (
    <ErrorBoundary>
      <OnboardingProvider>
        <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOrganizationPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/mfa/setup" element={<MfaSetupPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/failure" element={<PaymentFailurePage />} />
      <Route path="/payment/mock-esewa" element={<MockEsewaPage />} />
      
      {/* Creator Routes */}
      <Route path="/creator/coming-soon" element={<ComingSoonPage />} />

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
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredPermission="users.view" featureName="Users">
              <UsersPage />
            </ProtectedRoute>
          } 
        />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route 
          path="invitations" 
          element={
            <ProtectedRoute requiredPermission="invitations.view" featureName="Invitations">
              <InvitationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="roles" 
          element={
            <ProtectedRoute requiredPermission="roles.view" featureName="Roles">
              <RolesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="roles/permissions-review" 
          element={
            <ProtectedRoute requiredPermission="roles.view" featureName="Permissions Review">
              <PermissionsReviewPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="packages" 
          element={
            <ProtectedRoute requiredPermission="packages.view" featureName="Packages">
              <PackagesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="billing" 
          element={
            <ProtectedRoute requiredPermission="packages.view" featureName="Billing">
              <BillingPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="apps" 
          element={
            <ProtectedRoute requiredPermission="apps.view" featureName="Apps">
              <AppsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route 
          path="audit-logs" 
          element={
            <ProtectedRoute requiredPermission="audit.view" featureName="Audit Logs">
              <AuditLogsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="documentation" element={<DocumentationPage />} />
        <Route 
          path="chat" 
          element={
            <ProtectedRoute requiredPermission="chat.view" featureName="Chat">
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="chat/admin" 
          element={
            <ProtectedRoute requiredPermission="admin_chat.access" featureName="Admin Chat">
              <AdminChatPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="apps/:appId" 
          element={
            <ProtectedRoute requiredPermission="apps.view" featureName="App View">
              <AppViewPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="tickets" 
          element={
            <ProtectedRoute requiredPermission="tickets.view" featureName="Tickets">
              <TicketsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="tickets/new" 
          element={
            <ProtectedRoute requiredPermission="tickets.create" featureName="Create Ticket">
              <CreateTicketPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="tickets/:ticketId" 
          element={
            <ProtectedRoute requiredPermission="tickets.view" featureName="Ticket Details">
              <TicketDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="analytics" 
          element={
            <ProtectedRoute requiredPermission="organizations.view" featureName="Analytics">
              <AnalyticsPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Root route - show role selection for unauthenticated, redirect for authenticated */}
      <Route
        path="/"
        element={
          <RootRoute />
        }
      />

      {/* 404 - Redirect to login if not authenticated, otherwise to dashboard */}
      <Route path="*" element={<NotFoundRoute />} />
      </Routes>
      </OnboardingProvider>
    </ErrorBoundary>
  );
}

export default App;

