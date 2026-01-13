import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '../../../utils/helpers/classNames';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: 'horizontal' | 'vertical';
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value: controlledValue,
      defaultValue = [0],
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      orientation = 'horizontal',
      disabled,
      ...props
    }: SliderProps,
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<number[]>(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    const currentValue = value[0] || 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [Number(e.target.value)];
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    const percentage = ((currentValue - min) / (max - min)) * 100;

    return (
      <div
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          orientation === 'vertical' && 'h-full w-6 flex-col',
          className
        )}
      >
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
            orientation === 'vertical' && 'h-full w-2',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div
            className={cn(
              'absolute h-full bg-primary-600',
              orientation === 'vertical' ? 'w-full' : 'w-0'
            )}
            style={
              orientation === 'horizontal'
                ? { width: `${percentage}%` }
                : { height: `${percentage}%`, bottom: 0 }
            }
          />
        </div>
        <div
          className={cn(
            'absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-primary-600 bg-white dark:bg-gray-800 shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500',
            orientation === 'vertical' && 'translate-x-0 -translate-y-1/2 left-1/2',
            disabled && 'cursor-not-allowed'
          )}
          style={
            orientation === 'horizontal'
              ? { left: `${percentage}%` }
              : { bottom: `${percentage}%` }
          }
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

