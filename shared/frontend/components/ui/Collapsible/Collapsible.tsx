import { ReactNode, useState, createContext, useContext, HTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/helpers/classNames';

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue | undefined>(undefined);

const useCollapsibleContext = () => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('Collapsible components must be used within Collapsible');
  }
  return context;
};

export interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export const Collapsible = ({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  children,
  ...props
}: CollapsibleProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className={cn('', className)} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
};

export interface CollapsibleTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const CollapsibleTrigger = ({ className, children, onClick, ...props }: CollapsibleTriggerProps) => {
  const { open, onOpenChange } = useCollapsibleContext();

  return (
    <button
      type="button"
      onClick={(e) => {
        onOpenChange(!open);
        onClick?.(e);
      }}
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          open && 'rotate-180'
        )}
      />
    </button>
  );
};

export interface CollapsibleContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

export const CollapsibleContent = ({ className, children, ...props }: CollapsibleContentProps) => {
  const { open } = useCollapsibleContext();

  if (!open) return null;

  return (
    <div
      className={cn(
        'overflow-hidden transition-all',
        'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
        className
      )}
      data-state={open ? 'open' : 'closed'}
      {...props}
    >
      {children}
    </div>
  );
};

