import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../../utils/helpers/classNames';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  accent: string;
  info?: string;
  success?: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  theme?: {
    colors: ThemeColors;
  };
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      className,
      fullWidth = false,
      leftIcon,
      id,
      theme,
      style,
      ...props
    }: SelectProps,
    ref,
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const selectStyle = theme
      ? {
        backgroundColor: theme.colors.surface,
        borderColor: error ? '#ef4444' : theme.colors.border,
        color: theme.colors.text,
        paddingRight: '2.5rem',
        ...style,
      }
      : { paddingRight: '2.5rem', ...style };

    const labelStyle = theme
      ? { color: theme.colors.text }
      : undefined;

    const arrowStyle = theme
      ? { color: theme.colors.textSecondary }
      : undefined;

    const errorStyle = theme
      ? { color: '#ef4444' }
      : undefined;

    const helperTextStyle = theme
      ? { color: theme.colors.textSecondary }
      : undefined;

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium"
            style={labelStyle}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={arrowStyle}
            >
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'flex h-10 w-full rounded-md border px-3 py-2 pr-10 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'appearance-none cursor-pointer',
              'flex items-center',
              !theme && 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800',
              !theme && 'focus-visible:ring-blue-500',
              !theme && error && 'border-red-500 focus-visible:ring-red-500 dark:border-red-500',
              theme && error && 'focus-visible:ring-red-500',
              !theme && !error && 'text-gray-900 dark:text-gray-100',
              leftIcon && 'pl-10',
              className,
            )}
            style={selectStyle}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option: SelectOption) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                style={theme ? { backgroundColor: theme.colors.surface, color: theme.colors.text } : undefined}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={arrowStyle}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-sm" style={errorStyle}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm" style={helperTextStyle}>
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

