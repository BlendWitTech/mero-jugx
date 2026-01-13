import { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../utils/helpers/classNames';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = 'vertical', ...props }: ScrollAreaProps, ref) => {
    const orientationClasses: Record<'vertical' | 'horizontal' | 'both', string> = {
      vertical: 'overflow-y-auto',
      horizontal: 'overflow-x-auto',
      both: 'overflow-auto',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          orientationClasses[orientation],
          'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

export interface ScrollBarProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const ScrollBar = forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = 'vertical', ...props }: ScrollBarProps, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex touch-none select-none transition-colors',
          orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent p-[1px]',
          orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent p-[1px]',
          className
        )}
        {...props}
      />
    );
  }
);

ScrollBar.displayName = 'ScrollBar';

