import { Toaster } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeAwareToaster() {
  const { theme, isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
        },
        success: {
          iconTheme: {
            primary: '#23a55a',
            secondary: theme.colors.surface,
          },
          style: {
            background: theme.colors.surface,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
          },
        },
        error: {
          iconTheme: {
            primary: isDark ? '#ff6b6b' : '#dc2626',
            secondary: theme.colors.surface,
          },
          style: {
            background: theme.colors.surface,
            color: theme.colors.text,
            border: `1px solid ${isDark ? '#ff6b6b' : '#dc2626'}`,
          },
        },
        loading: {
          iconTheme: {
            primary: theme.colors.primary,
            secondary: theme.colors.surface,
          },
          style: {
            background: theme.colors.surface,
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
          },
        },
      }}
    />
  );
}

