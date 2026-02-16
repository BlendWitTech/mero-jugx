import { Routes, Route } from 'react-router-dom';
import MeroInventoryLayout from './layouts/MeroInventoryLayout';
import DashboardPage from './pages/DashboardPage';
import { AppProvider } from './contexts/AppContext';
import { useAuthStore } from '@frontend/store/authStore';

import ProductsListPage from './pages/products/ProductsListPage';
import ProductFormPage from './pages/products/ProductFormPage';
import WarehousesListPage from './pages/warehouses/WarehousesListPage';
import StockMovementsPage from './pages/stock/StockMovementsPage';
import StockAdjustmentPage from './pages/stock/StockAdjustmentPage';
import SuppliersListPage from './pages/suppliers/SuppliersListPage';
import SupplierFormPage from './pages/suppliers/SupplierFormPage';
import PurchaseOrdersListPage from './pages/purchase-orders/PurchaseOrdersListPage';
import PurchaseOrderFormPage from './pages/purchase-orders/PurchaseOrderFormPage';

export default function MeroInventoryRouter() {
    const { organization } = useAuthStore();

    if (!organization) {
        return null; // Or a loading spinner
    }

    return (
        <AppProvider appSlug="mero-inventory" organizationId={organization.id}>
            <Routes>
                <Route element={<MeroInventoryLayout />}>
                    <Route index element={<DashboardPage />} />

                    {/* Products Routes */}
                    <Route path="products" element={<ProductsListPage />} />
                    <Route path="products/new" element={<ProductFormPage />} />
                    <Route path="products/:id/edit" element={<ProductFormPage />} />

                    {/* Warehouses Routes */}
                    <Route path="warehouses" element={<WarehousesListPage />} />

                    {/* Stock Routes */}
                    <Route path="movements" element={<StockMovementsPage />} />
                    <Route path="adjustments" element={<StockAdjustmentPage />} />

                    {/* Suppliers Routes */}
                    <Route path="suppliers" element={<SuppliersListPage />} />
                    <Route path="suppliers/new" element={<SupplierFormPage />} />
                    <Route path="suppliers/:id/edit" element={<SupplierFormPage />} />

                    {/* Purchase Orders Routes */}
                    <Route path="purchase-orders" element={<PurchaseOrdersListPage />} />
                    <Route path="purchase-orders/new" element={<PurchaseOrderFormPage />} />
                    <Route path="purchase-orders/:id" element={<PurchaseOrderFormPage />} />
                </Route>
            </Routes>
        </AppProvider>
    );
}
