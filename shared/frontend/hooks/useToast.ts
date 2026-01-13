import { useState, useEffect } from 'react';
import { ToastProps, ToastVariant } from '../components/ui/Toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

let toastIdCounter = 0;
let toastListeners: Array<(toasts: ToastProps[]) => void> = [];
let currentToasts: ToastProps[] = [];

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...currentToasts]));
};

const toast = {
  show: (options: ToastOptions): string => {
    const id = `toast-${++toastIdCounter}`;
    const toast: ToastProps = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      duration: options.duration ?? 5000,
      onClose: () => {
        currentToasts = currentToasts.filter(t => t.id !== id);
        notifyListeners();
      },
    };
    
    currentToasts.push(toast);
    notifyListeners();
    
    return id;
  },
  
  success: (message: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
    return toast.show({
      ...options,
      description: message,
      variant: 'success',
    });
  },
  
  error: (message: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
    return toast.show({
      ...options,
      description: message,
      variant: 'error',
    });
  },
  
  warning: (message: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
    return toast.show({
      ...options,
      description: message,
      variant: 'warning',
    });
  },
  
  info: (message: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
    return toast.show({
      ...options,
      description: message,
      variant: 'info',
    });
  },
  
  dismiss: (id: string) => {
    const toast = currentToasts.find(t => t.id === id);
    if (toast) {
      toast.onClose?.();
    }
  },
  
  dismissAll: () => {
    currentToasts.forEach(toast => toast.onClose?.());
    currentToasts = [];
    notifyListeners();
  },
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>(currentToasts);
  
  useEffect(() => {
    const listener = (newToasts: ToastProps[]) => {
      setToasts(newToasts);
    };
    
    toastListeners.push(listener);
    listener(currentToasts);
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);
  
  return {
    toasts,
    toast,
  };
};

export default toast;

