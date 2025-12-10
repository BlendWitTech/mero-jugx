import React from 'react';

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
      className={`bg-[#2f3136] animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card p-6 space-y-4">
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
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-[#202225]">
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
    <div className="card p-4 flex items-center gap-4">
      <Skeleton width="48px" height="48px" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton height="1rem" width="60%" />
        <Skeleton height="0.875rem" width="40%" />
      </div>
    </div>
  );
};

export const ChatMessageSkeleton: React.FC = () => {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton width="40px" height="40px" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton height="0.875rem" width="100px" />
        <Skeleton height="1rem" width="100%" />
        <Skeleton height="1rem" width="80%" />
      </div>
    </div>
  );
};

