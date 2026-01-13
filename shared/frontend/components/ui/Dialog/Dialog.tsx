import { ReactNode, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../utils/helpers/classNames';
import { Button } from '../Button';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog = ({ open: controlledOpen, onOpenChange, children }: DialogProps) => {
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

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => handleOpenChange(false)}
      />
      <div className="relative z-[101] w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export interface DialogContentProps {
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const DialogContent = ({
  children,
  className,
  showCloseButton = true,
  onClose,
}: DialogContentProps) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6',
        className
      )}
    >
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      {children}
    </div>
  );
};

export interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export const DialogHeader = ({ children, className }: DialogHeaderProps) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}>
      {children}
    </div>
  );
};

export interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export const DialogTitle = ({ children, className }: DialogTitleProps) => {
  return (
    <h2
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
        className
      )}
    >
      {children}
    </h2>
  );
};

export interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const DialogDescription = ({ children, className }: DialogDescriptionProps) => {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-400', className)}>{children}</p>
  );
};

export interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export const DialogFooter = ({ children, className }: DialogFooterProps) => {
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

