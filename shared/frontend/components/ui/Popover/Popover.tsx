import { ReactNode, useState, useRef, useEffect, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/helpers/classNames';
import { X } from 'lucide-react';

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showCloseButton?: boolean;
}

export const Popover = ({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  align = 'center',
  side = 'bottom',
  className,
  showCloseButton = false,
}: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        handleOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (open && triggerRef.current && popoverRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      if (side === 'bottom') {
        top = triggerRect.bottom + 4;
      } else if (side === 'top') {
        top = triggerRect.top - popoverRect.height - 4;
      } else if (side === 'left') {
        top = triggerRect.top;
        left = triggerRect.left - popoverRect.width - 4;
      } else {
        top = triggerRect.top;
        left = triggerRect.right + 4;
      }

      if (side === 'top' || side === 'bottom') {
        if (align === 'start') {
          left = triggerRect.left;
        } else if (align === 'end') {
          left = triggerRect.right - popoverRect.width;
        } else {
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        }
      } else {
        if (align === 'start') {
          top = triggerRect.top;
        } else if (align === 'end') {
          top = triggerRect.bottom - popoverRect.height;
        } else {
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        }
      }

      // Keep within viewport
      const padding = 8;
      if (top + popoverRect.height > window.innerHeight - padding) {
        top = window.innerHeight - popoverRect.height - padding;
      }
      if (top < padding) {
        top = padding;
      }
      if (left + popoverRect.width > window.innerWidth - padding) {
        left = window.innerWidth - popoverRect.width - padding;
      }
      if (left < padding) {
        left = padding;
      }

      popoverRef.current.style.top = `${top}px`;
      popoverRef.current.style.left = `${left}px`;
    }
  }, [open, align, side]);

  const content = open ? (
    <div
      ref={popoverRef}
      className={cn(
        'fixed z-50 w-72 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-4',
        className
      )}
      style={{ position: 'fixed' }}
    >
      {showCloseButton && (
        <button
          onClick={() => handleOpenChange(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => handleOpenChange(!open)}
        className="inline-block"
      >
        {trigger}
      </div>
      {open && createPortal(content, document.body)}
    </>
  );
};

export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export const PopoverContent = ({ className, children, ...props }: PopoverContentProps) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

