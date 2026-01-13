import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/helpers/classNames';
import { Loading } from '../../ui/Loading';
import { TableSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../feedback/EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> extends HTMLAttributes<HTMLDivElement> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (item: T, index: number) => void;
  keyExtractor?: (item: T, index: number) => string | number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  onRowClick,
  keyExtractor,
  className,
  ...props
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={5} cols={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        icon={emptyIcon}
      />
    );
  }

  const getKey = (item: T, index: number) => {
    if (keyExtractor) return keyExtractor(item, index);
    return item.id || item.key || index;
  };

  return (
    <div className={cn('overflow-x-auto', className)} {...props}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={getKey(item, index)}
              onClick={() => onRowClick?.(item, index)}
              className={cn(
                'border-b border-gray-100 dark:border-gray-800',
                onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-sm text-gray-900 dark:text-gray-100',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  {column.render
                    ? column.render(item, index)
                    : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

