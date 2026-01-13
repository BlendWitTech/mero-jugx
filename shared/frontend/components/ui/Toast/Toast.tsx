import { ReactNode, useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../../utils/helpers/classNames';
import { createPortal } from 'react-dom';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  info?: string;
  success?: string;
}

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  theme?: {
    colors: ThemeColors;
  };
}

const variantIcons = {
  default: null,
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

// Get variant colors based on theme
const getVariantColors = (variant: ToastVariant, theme: ThemeColors) => {
  const isDark = theme.background === '#36393f' || theme.background.includes('36') || theme.background.includes('2f');

  switch (variant) {
    case 'success':
      return {
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
        border: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
        icon: '#22c55e',
        text: isDark ? '#4ade80' : '#16a34a',
      };
    case 'error':
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
        border: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
        icon: '#ef4444',
        text: isDark ? '#f87171' : '#dc2626',
      };
    case 'warning':
      return {
        bg: isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)',
        border: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.2)',
        icon: '#eab308',
        text: isDark ? '#facc15' : '#ca8a04',
      };
    case 'info':
      return {
        bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
        border: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
        icon: '#3b82f6',
        text: isDark ? '#60a5fa' : '#2563eb',
      };
    default:
      return {
        bg: isDark ? `${theme.surface}E6` : `${theme.surface}F5`,
        border: `${theme.border}80`,
        icon: theme.primary,
        text: theme.text,
      };
  }
};

export const Toast = ({ id, title, description, variant = 'default', duration = 5000, onClose, theme }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = (variantIcons as Record<ToastVariant, any>)[variant];

  // Default theme if not provided
  const defaultTheme: ThemeColors = {
    primary: '#5865f2',
    secondary: '#4752c4',
    background: '#36393f',
    surface: '#2f3136',
    text: '#ffffff',
    textSecondary: '#b9bbbe',
    border: '#202225',
    accent: '#5865f2',
  };

  const themeColors = theme?.colors || defaultTheme;
  const variantColors = getVariantColors(variant, themeColors);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'group pointer-events-auto relative flex w-[380px] items-start gap-3 overflow-hidden rounded-xl border backdrop-blur-xl p-4 pr-10 shadow-2xl transition-all',
        'animate-in slide-in-from-top-full data-[swipe=end]:animate-out data-[swipe=end]:fade-out-0 data-[swipe=end]:slide-out-to-top-full'
      )}
      style={{
        backgroundColor: variantColors.bg,
        borderColor: variantColors.border,
        boxShadow: `0 10px 40px -10px ${variantColors.icon}20, 0 0 0 1px ${variantColors.border}`,
      }}
    >
      {Icon && (
        <div
          className="flex-shrink-0 rounded-lg p-1.5"
          style={{
            backgroundColor: `${variantColors.icon}20`,
          }}
        >
          <Icon
            className="h-5 w-5"
            style={{
              color: variantColors.icon,
            }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1.5">
        {title && (
          <div
            className="text-sm font-semibold leading-tight"
            style={{
              color: variantColors.text,
            }}
          >
            {title}
          </div>
        )}
        {description && (
          <div
            className="text-sm leading-relaxed break-words"
            style={{
              color: themeColors.textSecondary,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="absolute right-2 top-2 rounded-lg p-1.5 opacity-0 transition-all hover:opacity-100 focus:opacity-100 focus:outline-none group-hover:opacity-70"
        style={{
          color: themeColors.textSecondary,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = themeColors.border;
          e.currentTarget.style.color = themeColors.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = themeColors.textSecondary;
        }}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  theme?: {
    colors: ThemeColors;
  };
}

export const ToastContainer = ({ toasts, position = 'top-right', theme }: ToastContainerProps) => {
  const positionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const content = (
    <div
      className={cn(
        'fixed z-[100] flex max-h-[calc(100vh-2rem)] flex-col gap-3 overflow-y-auto p-0',
        (positionClasses as Record<string, string>)[position]
      )}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: `${theme?.colors.border || '#202225'} transparent`,
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} theme={theme} />
      ))}
    </div>
  );

  return createPortal(content, document.body);
};

