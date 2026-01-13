import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@frontend/store/authStore';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Loading } from '@shared';
import LoginPage from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ClientsListPage from './pages/clients/ClientsListPage';
import ClientFormPage from './pages/clients/ClientFormPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import InvoicesListPage from './pages/invoices/InvoicesListPage';
import InvoiceFormPage from './pages/invoices/InvoiceFormPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import PaymentsListPage from './pages/payments/PaymentsListPage';
import PaymentFormPage from './pages/payments/PaymentFormPage';
import PaymentDetailPage from './pages/payments/PaymentDetailPage';
import { useEffect, useState, useCallback } from 'react';
import api from '@frontend/services/api';
import { getAppSession, isAppSessionValid, removeAppSession, updateAppActivity } from '@frontend/services/appSessionService';
import LockScreen from './components/LockScreen';
import { Button } from '@shared';
import { getMainDomainUrl } from '@frontend/config/urlConfig';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();

    if (!_hasHydrated) {
        return <Loading fullScreen text="Checking authentication..." />;
    }

    if (!isAuthenticated || !accessToken) {
        const returnUrl = encodeURIComponent(window.location.href);
        const mainUrl = getMainDomainUrl();
        window.location.href = `${mainUrl}/login?returnUrl=${returnUrl}`;
        return null;
    }

    return <>{children}</>;
}

function RegisterRedirect() {
    const handleRegisterRedirect = useCallback(() => {
        const mainUrl = getMainDomainUrl();
        window.location.href = `${mainUrl}/register`;
    }, []);

    useEffect(() => {
        handleRegisterRedirect();
    }, [handleRegisterRedirect]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Loading text="Redirecting to registration..." />
        </div>
    );
}

function App() {
    const { theme } = useTheme();
    const { user, organization, isAuthenticated, accessToken } = useAuthStore();
    const [appId, setAppId] = useState<number | null>(null);
    const [hasAppSession, setHasAppSession] = useState(false);
    const [isLoadingAppData, setIsLoadingAppData] = useState(true);

    useEffect(() => {
        // Fetch Mero CRM app to get its ID for session management
        api.get('/marketplace/apps/slug/mero-crm')
            .then(res => {
                const id = res.data.id;
                setAppId(id);

                // Check if session exists and is valid
                const token = getAppSession(id);
                if (token && isAppSessionValid(id)) {
                    setHasAppSession(true);
                    api.defaults.headers.common['X-App-Session'] = token;
                }
                setIsLoadingAppData(false);
            })
            .catch(() => setIsLoadingAppData(false));
    }, []);

    // Registration redirect
    const handleRegisterRedirect = useCallback(() => {
        const mainUrl = getMainDomainUrl();
        window.location.href = `${mainUrl}/register`;
    }, []);

    if (isLoadingAppData) {
        return <Loading fullScreen text="Loading Mero CRM..." />;
    }

    return (
        <div style={{ backgroundColor: theme.colors.background, color: theme.colors.text, minHeight: '100vh' }}>
            <Routes>
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<RegisterRedirect />} />
                <Route path="/forgot-password" element={<Navigate to={`${getMainDomainUrl()}/forgot-password`} replace />} />

                {/* Protected Routes with Dashboard Layout */}
                <Route
                    path="/*"
                    element={
                        <PrivateRoute>
                            {!hasAppSession && appId ? (
                                <LockScreen
                                    appName="Mero CRM"
                                    userEmail={user?.email || ''}
                                    hasMfa={organization?.mfa_enabled || false}
                                    appId={appId}
                                    onSuccess={(token) => {
                                        setHasAppSession(true);
                                        api.defaults.headers.common['X-App-Session'] = token;
                                        updateAppActivity(appId);
                                    }}
                                />
                            ) : (
                                <DashboardLayout />
                            )}
                        </PrivateRoute>
                    }
                >
                    <Route index element={<DashboardPage />} />

                    {/* Client Routes */}
                    <Route path="clients" element={<ClientsListPage />} />
                    <Route path="clients/new" element={<ClientFormPage />} />
                    <Route path="clients/:id" element={<ClientDetailPage />} />
                    <Route path="clients/:id/edit" element={<ClientFormPage />} />

                    {/* Invoice Routes */}
                    <Route path="invoices" element={<InvoicesListPage />} />
                    <Route path="invoices/new" element={<InvoiceFormPage />} />
                    <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                    <Route path="invoices/:id/edit" element={<InvoiceFormPage />} />

                    {/* Payment Routes */}
                    <Route path="payments" element={<PaymentsListPage />} />
                    <Route path="payments/new" element={<PaymentFormPage />} />
                    <Route path="payments/:id" element={<PaymentDetailPage />} />
                    <Route path="payments/:id/edit" element={<PaymentFormPage />} />
                </Route>
            </Routes>
        </div>
    );
}

export default App;
