import { useToast } from '../../../hooks/useToast';
import { ToastContainer } from './Toast';

interface ToastProviderProps {
  theme?: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      accent: string;
    };
  };
}

export function ToastProvider({ theme }: ToastProviderProps = {}) {
  const { toasts } = useToast();
  
  return <ToastContainer toasts={toasts} position="top-right" theme={theme} />;
}

