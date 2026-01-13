import React, { createContext, useContext, ReactNode } from 'react';

interface AppContextType {
  appSlug: string;
  organizationId: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ 
  children, 
  appSlug, 
  organizationId 
}: { 
  children: ReactNode; 
  appSlug: string; 
  organizationId: string;
}) {
  return (
    <AppContext.Provider value={{ appSlug, organizationId }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

