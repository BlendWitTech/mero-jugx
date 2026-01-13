import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../utils/helpers/classNames';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  className = '',
  size = 'md',
  text,
}) => {
  const sizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizes[size])} />
      {text && <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
}) => {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700 animate-pulse',
        rounded ? 'rounded-full' : 'rounded',
        className,
      )}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <Skeleton height="1.5rem" width="60%" />
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="80%" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Skeleton height="1.5rem" width="200px" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} height="1rem" width="100%" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const UserCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
      <Skeleton width="48px" height="48px" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton height="1rem" width="60%" />
        <Skeleton height="0.875rem" width="40%" />
      </div>
    </div>
  );
};

