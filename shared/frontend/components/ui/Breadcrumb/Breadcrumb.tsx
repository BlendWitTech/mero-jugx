import { ReactNode, HTMLAttributes } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../utils/helpers/classNames';

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  separator?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export const Breadcrumb = ({ className, separator, children, ...props }: BreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400', className)}
      {...props}
    >
      {children}
    </nav>
  );
};

export interface BreadcrumbListProps extends HTMLAttributes<HTMLOListElement> {
  className?: string;
  children?: ReactNode;
}

export const BreadcrumbList = ({ className, children, ...props }: BreadcrumbListProps) => {
  return (
    <ol className={cn('flex flex-wrap items-center gap-1.5 break-words', className)} {...props}>
      {children}
    </ol>
  );
};

export interface BreadcrumbItemProps extends HTMLAttributes<HTMLLIElement> {
  className?: string;
  children?: ReactNode;
}

export const BreadcrumbItem = ({ className, children, ...props }: BreadcrumbItemProps) => {
  return (
    <li className={cn('inline-flex items-center gap-1.5', className)} {...props}>
      {children}
    </li>
  );
};

export interface BreadcrumbLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  to?: string;
  asChild?: boolean;
  className?: string;
  children?: ReactNode;
}

export const BreadcrumbLink = ({
  className,
  href,
  to,
  asChild,
  children,
  ...props
}: BreadcrumbLinkProps) => {
  const commonClasses = 'transition-colors hover:text-gray-900 dark:hover:text-gray-100';

  if (to) {
    return (
      <Link
        to={to}
        className={cn(commonClasses, className)}
        {...props}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={cn(commonClasses, className)}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <span
      className={cn(commonClasses, className)}
      {...props}
    >
      {children}
    </span>
  );
};

export interface BreadcrumbPageProps extends HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children?: ReactNode;
}

export const BreadcrumbPage = ({ className, children, ...props }: BreadcrumbPageProps) => {
  return (
    <span
      role="link"
      aria-current="page"
      aria-disabled="true"
      className={cn('font-normal text-gray-900 dark:text-gray-100', className)}
      {...props}
    >
      {children}
    </span>
  );
};

export interface BreadcrumbSeparatorProps {
  children?: ReactNode;
  className?: string;
}

export const BreadcrumbSeparator = ({ children, className }: BreadcrumbSeparatorProps) => {
  return (
    <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)}>
      {children || <ChevronRight className="h-4 w-4" />}
    </li>
  );
};

export interface BreadcrumbEllipsisProps extends HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

export const BreadcrumbEllipsis = ({ className, ...props }: BreadcrumbEllipsisProps) => {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <span className="text-gray-400">...</span>
      <span className="sr-only">More</span>
    </span>
  );
};

