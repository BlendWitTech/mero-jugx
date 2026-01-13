import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../utils/helpers/classNames';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangular', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-gray-200 dark:bg-gray-700',
          variant === 'circular' && 'rounded-full',
          variant === 'text' && 'rounded',
          variant === 'rectangular' && 'rounded',
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

