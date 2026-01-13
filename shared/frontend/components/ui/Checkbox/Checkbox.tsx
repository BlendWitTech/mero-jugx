import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../utils/helpers/classNames';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      id,
      ...props
    }: CheckboxProps,
    ref,
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border-gray-300 dark:border-gray-600',
              'text-blue-600 focus:ring-2 focus:ring-blue-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500',
              className,
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 ml-6">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

