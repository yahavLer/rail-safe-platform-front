import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OrganizationContextType {
  orgId: string | null;
  setOrgId: (id: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [orgId, setOrgIdState] = useState<string | null>(() => {
    // Load from localStorage on init
    return localStorage.getItem('orgId');
  });

  const setOrgId = (id: string) => {
    setOrgIdState(id);
    localStorage.setItem('orgId', id);
  };

  return (
    <OrganizationContext.Provider value={{ orgId, setOrgId }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrgId(): string {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrgId must be used within OrganizationProvider');
  }
  return context.orgId || '';
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizationContext must be used within OrganizationProvider');
  }
  return context;
}
