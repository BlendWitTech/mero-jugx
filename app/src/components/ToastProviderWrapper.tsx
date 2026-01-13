import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ToastProvider } from '@shared';

export default function ToastProviderWrapper() {
  const { theme } = useTheme();

  return <ToastProvider theme={theme} />;
}

