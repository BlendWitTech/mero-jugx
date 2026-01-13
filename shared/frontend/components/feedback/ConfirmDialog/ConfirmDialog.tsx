import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, ThemeColors } from '../../ui/Modal';
import { Button } from '../../ui/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  theme?: { colors: ThemeColors };
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
  theme,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const variantColors = theme ? {
    danger: theme.colors.danger || theme.colors.error || theme.colors.primary || '#ef4444',
    warning: theme.colors.warning || theme.colors.primary || '#f59e0b',
    info: theme.colors.info || theme.colors.primary || '#3b82f6',
  } : {
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const variantStyles = !theme ? {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  } : {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      theme={theme}
      footer={
        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            style={theme ? {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
            } : undefined}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={isLoading}
            style={theme ? {
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
            } : undefined}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4">
        <div 
          className={!theme ? `flex-shrink-0 ${variantStyles[variant]}` : 'flex-shrink-0'}
          style={theme ? { color: variantColors[variant] } : undefined}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div 
          className={!theme ? 'flex-1 text-sm text-gray-700 dark:text-gray-300' : 'flex-1 text-sm'}
          style={theme ? { color: theme.colors.text } : undefined}
        >
          {message}
        </div>
      </div>
    </Modal>
  );
}

