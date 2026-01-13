import { Skeleton } from './Skeleton';

export function CardSkeleton() {
  return (
    <div className="p-6 space-y-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <Skeleton height="1.5rem" width="60%" />
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="80%" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
}

export function UserCardSkeleton() {
  return (
    <div className="p-4 flex items-center gap-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <Skeleton width="48px" height="48px" variant="circular" />
      <div className="flex-1 space-y-2">
        <Skeleton height="1rem" width="60%" />
        <Skeleton height="0.875rem" width="40%" />
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton width="40px" height="40px" variant="circular" />
      <div className="flex-1 space-y-2">
        <Skeleton height="0.875rem" width="100px" />
        <Skeleton height="1rem" width="100%" />
        <Skeleton height="1rem" width="80%" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton height="2rem" width="200px" />
        <Skeleton height="1rem" width="400px" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

