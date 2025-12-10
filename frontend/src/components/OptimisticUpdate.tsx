import React, { ReactNode } from 'react';

interface OptimisticUpdateProps {
  children: ReactNode;
  isPending?: boolean;
  fallback?: ReactNode;
}

/**
 * Wrapper component for optimistic updates
 * Shows optimistic state while request is pending
 */
export const OptimisticUpdate: React.FC<OptimisticUpdateProps> = ({
  children,
  isPending = false,
  fallback,
}) => {
  if (isPending && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (current: T, optimistic: T) => T,
) {
  const [data, setData] = React.useState<T>(initialData);
  const [isPending, setIsPending] = React.useState(false);

  const updateOptimistically = React.useCallback(
    async (optimisticData: T, asyncFn: () => Promise<T>) => {
      // Apply optimistic update immediately
      setData((current) => updateFn(current, optimisticData));
      setIsPending(true);

      try {
        // Perform actual update
        const result = await asyncFn();
        setData(result);
        return result;
      } catch (error) {
        // Revert on error
        setData(initialData);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [initialData, updateFn],
  );

  return { data, isPending, updateOptimistically };
}

