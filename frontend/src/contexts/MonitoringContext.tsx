import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useMonitoring } from '@/hooks/useMonitoring';
import { useAuth } from '@/contexts/AuthContext';

interface MonitoringContextType {
  trackAction: (action: string, metadata?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  addBreadcrumb: (message: string, category?: string, level?: 'info' | 'warning' | 'error') => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

interface MonitoringProviderProps {
  children: ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  const { trackAction, trackError, addBreadcrumb, setUserId } = useMonitoring();
  const { user } = useAuth();

  // Set user ID when user changes
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user?.id, setUserId]);

  const contextValue: MonitoringContextType = {
    trackAction,
    trackError,
    addBreadcrumb,
  };

  return (
    <MonitoringContext.Provider value={contextValue}>
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoringContext(): MonitoringContextType {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoringContext must be used within a MonitoringProvider');
  }
  return context;
}