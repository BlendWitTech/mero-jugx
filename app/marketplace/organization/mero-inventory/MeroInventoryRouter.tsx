import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';

interface MeroInventoryRouterProps {
    appSlug: string;
}

export default function MeroInventoryRouter({ appSlug }: MeroInventoryRouterProps) {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
    );
}
