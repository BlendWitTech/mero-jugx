import React, { createContext, useContext, useState, ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../../utils/helpers/classNames';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
};

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: ReactNode;
}

export const Tabs = ({
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  orientation = 'horizontal',
  className,
  children,
  ...props
}: TabsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    controlledOnValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange, orientation }}>
      <div
        className={cn(
          orientation === 'horizontal' ? 'flex flex-col' : 'flex',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
}

export const TabsList = ({ className, ...props }: TabsListProps) => {
  const { orientation } = useTabsContext();

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 p-1',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
      role="tablist"
      {...props}
    />
  );
};

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
  children?: ReactNode;
}

export const TabsTrigger = ({ className, value, children, ...props }: TabsTriggerProps) => {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
  children?: ReactNode;
}

export const TabsContent = ({ className, value, children, ...props }: TabsContentProps) => {
  const { value: selectedValue } = useTabsContext();

  if (selectedValue !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

