import React from 'react';

export interface MainContentAreaProps {
  children: React.ReactNode;
  theme: {
    colors: {
      background: string;
    };
  };
  className?: string;
}

export function MainContentArea({ children, theme, className = '' }: MainContentAreaProps) {
  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      {children}
    </div>
  );
}

