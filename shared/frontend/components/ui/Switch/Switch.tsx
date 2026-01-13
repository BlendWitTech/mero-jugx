import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '../../../utils/helpers/classNames';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = 'md', checked, onChange, disabled, ...props }, ref) => {
    const [isChecked, setIsChecked] = useState(checked || false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(e.target.checked);
      onChange?.(e);
    };

    const sizes: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'h-4 w-7',
      md: 'h-5 w-9',
      lg: 'h-6 w-11',
    };

    const dotSizes: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    const translateSizes: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'translate-x-3',
      md: 'translate-x-4',
      lg: 'translate-x-5',
    };

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="flex items-center">
          <input
            type="checkbox"
            ref={ref}
            checked={isChecked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <button
            type="button"
            role="switch"
            aria-checked={isChecked}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                const syntheticEvent = {
                  target: { checked: !isChecked },
                } as React.ChangeEvent<HTMLInputElement>;
                handleChange(syntheticEvent);
              }
            }}
            className={cn(
              'relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              sizes[size],
              isChecked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600',
              'focus-visible:ring-primary-500'
            )}
          >
            <span
              className={cn(
                'inline-block rounded-full bg-white transition-transform',
                dotSizes[size],
                isChecked ? translateSizes[size] : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label className="text-sm font-medium leading-none cursor-pointer" onClick={() => {
                if (!disabled) {
                  const syntheticEvent = {
                    target: { checked: !isChecked },
                  } as React.ChangeEvent<HTMLInputElement>;
                  handleChange(syntheticEvent);
                }
              }}>
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

