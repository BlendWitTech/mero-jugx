import { ReactNode, useState, useEffect } from 'react';
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
}

export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  cancelText?: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  theme?: { colors: ThemeColors };
}

export const AlertDialog = ({
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  children,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  variant = 'default',
  onConfirm,
  onCancel,
  theme,
}: AlertDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (isControlled) {
      setInternalOpen(controlledOpen || false);
    }
  }, [controlledOpen, isControlled]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
        handleOpenChange(false);
      } catch (error) {
        console.error('AlertDialog confirm error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      handleOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    handleOpenChange(false);
  };

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className="relative z-[101] w-full max-w-lg mx-4">
        <div 
          className={cn(
            'rounded-lg shadow-xl border p-6',
            !theme && 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          )}
          style={theme ? {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          } : undefined}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 
                className={cn(
                  'text-lg font-semibold',
                  !theme && 'text-gray-900 dark:text-gray-100'
                )}
                style={theme ? { color: theme.colors.text } : undefined}
              >
                {title}
              </h3>
              {description && (
                <p 
                  className={cn(
                    'mt-2 text-sm',
                    !theme && 'text-gray-600 dark:text-gray-400'
                  )}
                  style={theme ? { color: theme.colors.textSecondary } : undefined}
                >
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={handleCancel}
              className={cn(
                'ml-4 transition-colors',
                !theme && 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
              style={theme ? {
                color: theme.colors.textSecondary,
              } : undefined}
              onMouseEnter={(e: any) => {
                if (theme) {
                  e.currentTarget.style.color = theme.colors.text;
                }
              }}
              onMouseLeave={(e: any) => {
                if (theme) {
                  e.currentTarget.style.color = theme.colors.textSecondary;
                }
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          {children && (
            <div 
              className="mb-6"
              style={theme ? { color: theme.colors.text } : undefined}
            >
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
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
              variant={variant === 'destructive' ? 'danger' : 'primary'}
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
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

