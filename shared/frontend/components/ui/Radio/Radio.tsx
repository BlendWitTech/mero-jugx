import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../utils/helpers/classNames';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      id,
      ...props
    }: RadioProps,
    ref,
  ) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            className={cn(
              'h-4 w-4 border-gray-300 dark:border-gray-600',
              'text-blue-600 focus:ring-2 focus:ring-blue-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500',
              className,
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={radioId}
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

Radio.displayName = 'Radio';

