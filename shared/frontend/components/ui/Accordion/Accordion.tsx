import { ReactNode, useState, createContext, useContext, HTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/helpers/classNames';

interface AccordionContextValue {
  value: string | string[];
  onValueChange: (value: string) => void;
  type: 'single' | 'multiple';
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within Accordion');
  }
  return context;
};

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  className?: string;
  children?: ReactNode;
}

export const Accordion = ({
  type = 'single',
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  collapsible = true,
  className,
  children,
  ...props
}: AccordionProps) => {
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue || (type === 'multiple' ? [] : '')
  );

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = (itemValue: string) => {
    if (type === 'single') {
      const newValue = value === itemValue && collapsible ? '' : itemValue;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      controlledOnValueChange?.(newValue as string);
    } else {
      const currentArray = Array.isArray(value) ? value : [];
      const newValue = currentArray.includes(itemValue)
        ? currentArray.filter((v) => v !== itemValue)
        : [...currentArray, itemValue];
      if (!isControlled) {
        setInternalValue(newValue);
      }
      controlledOnValueChange?.(newValue);
    }
  };

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type, collapsible }}>
      <div className={cn('space-y-1', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
  children?: ReactNode;
}

export const AccordionItem = ({ className, value, children, ...props }: AccordionItemProps) => {
  return (
    <div
      className={cn('border border-gray-200 dark:border-gray-700 rounded-md', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
  children?: ReactNode;
}

export const AccordionTrigger = ({ className, value, children, ...props }: AccordionTriggerProps) => {
  const { value: selectedValue, onValueChange } = useAccordionContext();
  const isOpen = Array.isArray(selectedValue)
    ? selectedValue.includes(value)
    : selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        'flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-all hover:bg-gray-50 dark:hover:bg-gray-800 [&[data-state=open]>svg]:rotate-180',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
};

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
  children?: ReactNode;
}

export const AccordionContent = ({ className, value, children, ...props }: AccordionContentProps) => {
  const { value: selectedValue } = useAccordionContext();
  const isOpen = Array.isArray(selectedValue)
    ? selectedValue.includes(value)
    : selectedValue === value;

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'overflow-hidden text-sm transition-all',
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
      {...props}
    >
      <div className="px-4 py-3 pt-0">{children}</div>
    </div>
  );
};

