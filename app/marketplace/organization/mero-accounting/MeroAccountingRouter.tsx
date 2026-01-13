import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';

interface MeroAccountingRouterProps {
    appSlug: string;
}

export default function MeroAccountingRouter({ appSlug }: MeroAccountingRouterProps) {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
    );
}
