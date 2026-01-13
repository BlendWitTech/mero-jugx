import { ReactNode, useState, useRef, useEffect, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/helpers/classNames';
import { ChevronRight } from 'lucide-react';

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end' | 'center';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const DropdownMenu = ({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  className,
}: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (open && triggerRef.current && menuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      // Calculate position based on side
      if (side === 'bottom') {
        top = triggerRect.bottom + 4;
      } else if (side === 'top') {
        top = triggerRect.top - menuRect.height - 4;
      } else {
        top = triggerRect.top;
      }

      // Calculate position based on align
      if (align === 'start') {
        left = triggerRect.left;
      } else if (align === 'end') {
        left = triggerRect.right - menuRect.width;
      } else {
        left = triggerRect.left + (triggerRect.width - menuRect.width) / 2;
      }

      // Keep within viewport
      const padding = 8;
      if (top + menuRect.height > window.innerHeight - padding) {
        top = window.innerHeight - menuRect.height - padding;
      }
      if (top < padding) {
        top = padding;
      }
      if (left + menuRect.width > window.innerWidth - padding) {
        left = window.innerWidth - menuRect.width - padding;
      }
      if (left < padding) {
        left = padding;
      }

      menuRef.current.style.top = `${top}px`;
      menuRef.current.style.left = `${left}px`;
    }
  }, [open, align, side]);

  const content = open ? (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-1',
        className
      )}
      style={{ position: 'fixed' }}
    >
      {children}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="inline-block"
      >
        {trigger}
      </div>
      {open && createPortal(content, document.body)}
    </>
  );
};

export interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  icon?: ReactNode;
  shortcut?: string;
  className?: string;
  children?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

export const DropdownMenuItem = ({
  className,
  disabled,
  icon,
  shortcut,
  children,
  onClick,
  ...props
}: DropdownMenuItemProps) => {
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:bg-gray-100 dark:focus:bg-gray-700',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={(e) => {
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {shortcut}
        </span>
      )}
    </div>
  );
};

export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const DropdownMenuSeparator = ({ className, ...props }: DropdownMenuSeparatorProps) => {
  return (
    <div
      className={cn('my-1 h-px bg-gray-200 dark:bg-gray-700', className)}
      {...props}
    />
  );
};

export interface DropdownMenuSubProps {
  trigger: ReactNode;
  children: ReactNode;
}

export const DropdownMenuSub = ({ trigger, children }: DropdownMenuSubProps) => {
  const [open, setOpen] = useState(false);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-center">
        {trigger}
        <ChevronRight className="ml-auto h-4 w-4" />
      </div>
      {open && (
        <div
          ref={subMenuRef}
          className="absolute left-full top-0 ml-1 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-1 z-50"
        >
          {children}
        </div>
      )}
    </div>
  );
};

