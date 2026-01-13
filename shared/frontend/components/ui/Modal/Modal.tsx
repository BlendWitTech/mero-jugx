import { ReactNode, useEffect, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../utils/helpers/classNames';
import { Button } from '../Button';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  secondary: string;
  danger?: string;
  error?: string;
  warning?: string;
  info?: string;
  success?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  showCloseButton?: boolean;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  theme?: { colors: ThemeColors };
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
  closeOnOverlayClick = true,
  theme,
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-5xl',
    '4xl': 'max-w-7xl',
    '5xl': 'max-w-[90rem]',
    full: 'max-w-full mx-4',
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          !theme && 'bg-white dark:bg-gray-800',
          'relative rounded-lg shadow-xl',
          'w-full mx-4',
          sizeClasses[size],
          'max-h-[85vh] md:max-h-[90vh] flex flex-col',
        )}
        style={theme ? {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              'flex items-center justify-between p-4 border-b',
              !theme && 'border-gray-200 dark:border-gray-700'
            )}
            style={theme ? { borderColor: theme.colors.border } : undefined}
          >
            {title && (
              <h2
                id="modal-title"
                className={cn(
                  'text-lg font-semibold',
                  !theme && 'text-gray-900 dark:text-gray-100'
                )}
                style={theme ? { color: theme.colors.text } : undefined}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-auto"
                aria-label="Close modal"
                style={theme ? {
                  color: theme.colors.text,
                } : undefined}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={theme ? { color: theme.colors.text } : undefined}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              'border-t p-4',
              !theme && 'border-gray-200 dark:border-gray-700'
            )}
            style={theme ? { borderColor: theme.colors.border } : undefined}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render modal using portal to ensure it appears above all other elements
  return createPortal(modalContent, document.body);
}

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function ModalHeader({ title, children, className, ...props }: ModalHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700', className)}
      {...props}
    >
      {title && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function ModalContent({ children, className, ...props }: ModalContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto p-4', className)} {...props}>
      {children}
    </div>
  );
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn('border-t border-gray-200 dark:border-gray-700 p-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

