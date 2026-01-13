import { ReactNode, useState, useRef, useEffect, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/helpers/classNames';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
  className?: string;
}

export const Tooltip = ({
  content,
  children,
  side = 'top',
  delayDuration = 200,
  className,
}: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (open) {
      timeoutRef.current = setTimeout(() => setShow(true), delayDuration);
    } else {
      setShow(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, delayDuration]);

  useEffect(() => {
    if (show && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      if (side === 'top') {
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      } else if (side === 'bottom') {
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      } else if (side === 'left') {
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 8;
      } else {
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;
      }

      // Keep within viewport
      const padding = 8;
      if (top + tooltipRect.height > window.innerHeight - padding) {
        top = window.innerHeight - tooltipRect.height - padding;
      }
      if (top < padding) {
        top = padding;
      }
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }
      if (left < padding) {
        left = padding;
      }

      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  }, [show, side]);

  const contentElement = show ? (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-50 px-3 py-1.5 text-sm rounded-md bg-gray-900 dark:bg-gray-700 text-white shadow-lg pointer-events-none',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      style={{ position: 'fixed' }}
    >
      {content}
      <div
        className={cn(
          'absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45',
          side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
          side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
          side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
          side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
        )}
      />
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-block"
      >
        {children}
      </div>
      {show && createPortal(contentElement, document.body)}
    </>
  );
};

