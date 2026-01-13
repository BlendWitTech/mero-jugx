import { Routes, Route } from 'react-router-dom';
import MeroCrmLayout from './layouts/MeroCrmLayout';
import DashboardPage from './pages/DashboardPage';
import ClientsListPage from './pages/clients/ClientsListPage';
import ClientFormPage from './pages/clients/ClientFormPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import InvoicesListPage from './pages/invoices/InvoicesListPage';
import InvoiceFormPage from './pages/invoices/InvoiceFormPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import PaymentDetailPage from './pages/payments/PaymentDetailPage';
import PaymentFormPage from './pages/payments/PaymentFormPage';
import PaymentsListPage from './pages/payments/PaymentsListPage';
import QuotesListPage from './pages/quotes/QuotesListPage';
import QuoteFormPage from './pages/quotes/QuoteFormPage';
import QuoteDetailPage from './pages/quotes/QuoteDetailPage';
import CrmSettingsPage from './pages/settings/CrmSettingsPage';
import { AppProvider } from './contexts/AppContext';
import { useAuthStore } from '@frontend/store/authStore';
import { Loading } from '@shared';

export default function MeroCrmRouter({ appSlug }: { appSlug: string }) {
    const { organization } = useAuthStore();

    if (!organization?.id) {
        return <Loading fullScreen text="Loading organization..." />;
    }

    return (
        <AppProvider appSlug={appSlug} organizationId={organization.id}>
            <Routes>
                <Route element={<MeroCrmLayout />}>
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

                    {/* Quote Routes */}
                    <Route path="quotes" element={<QuotesListPage />} />
                    <Route path="quotes/new" element={<QuoteFormPage />} />
                    <Route path="quotes/:id" element={<QuoteDetailPage />} />
                    <Route path="quotes/:id/edit" element={<QuoteFormPage />} />

                    {/* Settings Routes */}
                    <Route path="settings" element={<CrmSettingsPage />} />
                </Route>
            </Routes>
        </AppProvider>
    );
}
