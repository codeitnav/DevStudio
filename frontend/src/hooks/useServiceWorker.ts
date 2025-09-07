import { useState, useEffect, useCallback } from 'react';
import { registerSW, addConnectivityListeners } from '../utils/serviceWorker';

// Hook for React components to use service worker features
export function useServiceWorker() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const cleanup = addConnectivityListeners(
      () => setIsOffline(false),
      () => setIsOffline(true)
    );

    registerSW({
      onSuccess: (reg) => setRegistration(reg),
      onUpdate: (reg) => {
        setRegistration(reg);
        setUpdateAvailable(true);
      },
      onOfflineReady: () => console.log('App is ready to work offline'),
    });

    return cleanup;
  }, []);

  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  return {
    isOffline,
    updateAvailable,
    updateApp,
    registration,
  };
}

export default useServiceWorker;