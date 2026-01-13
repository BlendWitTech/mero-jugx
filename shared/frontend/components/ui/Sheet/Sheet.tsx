import { ReactNode, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../utils/helpers/classNames';

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}

export const Sheet = ({ open: controlledOpen, onOpenChange, side = 'right', children }: SheetProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sideClasses: Record<'top' | 'right' | 'bottom' | 'left', string> = {
    top: 'inset-x-0 top-0 border-b',
    right: 'inset-y-0 right-0 border-l',
    bottom: 'inset-x-0 bottom-0 border-t',
    left: 'inset-y-0 left-0 border-r',
  };

  const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full', string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const content = (
    <div className="fixed inset-0 z-[100]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => handleOpenChange(false)}
      />
      <div
        className={cn(
          'fixed z-[101] bg-white dark:bg-gray-800 shadow-lg',
          sideClasses[side],
          side === 'top' || side === 'bottom' ? 'h-auto max-h-[90vh]' : 'w-auto max-w-[90vw]'
        )}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export interface SheetContentProps {
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const SheetContent = ({
  children,
  className,
  showCloseButton = true,
  onClose,
}: SheetContentProps) => {
  return (
    <div className={cn('relative flex h-full flex-col p-6', className)}>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      {children}
    </div>
  );
};

export interface SheetHeaderProps {
  children: ReactNode;
  className?: string;
}

export const SheetHeader = ({ children, className }: SheetHeaderProps) => {
  return (
    <div className={cn('flex flex-col space-y-2 text-center sm:text-left mb-4', className)}>
      {children}
    </div>
  );
};

export interface SheetTitleProps {
  children: ReactNode;
  className?: string;
}

export const SheetTitle = ({ children, className }: SheetTitleProps) => {
  return (
    <h2
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-gray-100',
        className
      )}
    >
      {children}
    </h2>
  );
};

export interface SheetDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const SheetDescription = ({ children, className }: SheetDescriptionProps) => {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-400', className)}>{children}</p>
  );
};

export interface SheetFooterProps {
  children: ReactNode;
  className?: string;
}

export const SheetFooter = ({ children, className }: SheetFooterProps) => {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6',
        className
      )}
    >
      {children}
    </div>
  );
};

