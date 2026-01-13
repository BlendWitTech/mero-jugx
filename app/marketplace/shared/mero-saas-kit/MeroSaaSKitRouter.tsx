import { Routes, Route } from 'react-router-dom';
import ComingSoonPage from './pages/ComingSoonPage';

interface MeroSaaSKitRouterProps {
  appId: number;
}

export default function MeroSaaSKitRouter({ appId }: MeroSaaSKitRouterProps) {
  return (
    <Routes>
      <Route path="*" element={<ComingSoonPage />} />
    </Routes>
  );
}

