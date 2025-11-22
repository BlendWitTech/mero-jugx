import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import RegisterOrganizationPage from './pages/auth/RegisterOrganizationPage';
import DashboardLayout from './layouts/DashboardLayout';
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
import PaymentPage from './pages/payment/PaymentPage';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';
import PaymentFailurePage from './pages/payment/PaymentFailurePage';
import MockEsewaPage from './pages/payment/MockEsewaPage';
import DocumentationPage from './pages/documentation/DocumentationPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  
  // Wait for hydration before checking authentication
  if (!_hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  // Check both isAuthenticated flag and actual token presence
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
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

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
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
        <Route path="payment" element={<PaymentPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

