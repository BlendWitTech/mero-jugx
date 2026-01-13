import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import LockScreenPage from './pages/auth/LockScreenPage';

export default function CreatorPortalRouter() {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/lock" element={<LockScreenPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
