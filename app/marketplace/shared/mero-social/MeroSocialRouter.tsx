import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';

interface MeroSocialRouterProps {
    appSlug: string;
}

export default function MeroSocialRouter({ appSlug }: MeroSocialRouterProps) {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
    );
}
