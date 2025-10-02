/**
 * Offline support hooks and utilities
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore, useOfflineState } from '../store';
import { GenerationParams } from '../types/api';

// Hook for managing offline state
export function useOfflineSupport() {
  const { isOnline, pendingActions, syncStatus } = useOfflineState();
  const { setOnlineStatus, addOfflineAction, syncOfflineActions } = useAppStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      // Trigger sync after coming back online
      if (pendingActions.length > 0) {
        syncTimeoutRef.current = setTimeout(() => {
          syncOfflineActions();
        }, 1000);
      }
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };

    // Set initial status
    setOnlineStatus(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [setOnlineStatus, pendingActions.length, syncOfflineActions]);

  // Queue action for offline execution
  const queueOfflineAction = useCallback((
    type: string,
    payload: any
  ) => {
    addOfflineAction({ type, payload });
  }, [addOfflineAction]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (isOnline && pendingActions.length > 0) {
      await syncOfflineActions();
    }
  }, [isOnline, pendingActions.length, syncOfflineActions]);

  return {
    isOnline,
    pendingActions,
    syncStatus,
    queueOfflineAction,
    triggerSync,
    hasPendingActions: pendingActions.length > 0,
  };
}

// Hook for offline-aware generation
export function useOfflineGeneration() {
  const { isOnline, queueOfflineAction } = useOfflineSupport();
  const { showNotification } = useAppStore();

  const generateOfflineAware = useCallback(async (
    params: GenerationParams,
    generateFn: (params: GenerationParams) => Promise<any>
  ) => {
    if (isOnline) {
      // Online - execute immediately
      try {
        return await generateFn(params);
      } catch (error) {
        // If request fails due to network, queue for offline
        if (error instanceof Error && error.message.includes('network')) {
          queueOfflineAction('generate', params);
          showNotification({
            type: 'warning',
            title: 'Queued for Later',
            message: 'Generation queued for when connection is restored',
            duration: 5000,
          });
        }
        throw error;
      }
    } else {
      // Offline - queue for later
      queueOfflineAction('generate', params);
      showNotification({
        type: 'info',
        title: 'Offline Mode',
        message: 'Generation queued for when connection is restored',
        duration: 5000,
      });
    }
  }, [isOnline, queueOfflineAction, showNotification]);

  return {
    generateOfflineAware,
    isOnline,
  };
}

// Service Worker registration for offline support
export function useServiceWorker() {
  const { showNotification } = useAppStore();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showNotification({
                    type: 'info',
                    title: 'App Updated',
                    message: 'A new version is available. Refresh to update.',
                    duration: 10000,
                    actions: [
                      {
                        label: 'Refresh',
                        action: () => window.location.reload(),
                        variant: 'primary',
                      },
                    ],
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          showNotification({
            type: 'success',
            title: 'Content Cached',
            message: 'App is now available offline',
            duration: 3000,
          });
        }
      });
    }
  }, [showNotification]);
}

// Hook for background sync
export function useBackgroundSync() {
  const { pendingActions } = useOfflineState();
  const { syncOfflineActions } = useAppStore();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register background sync
        if (pendingActions.length > 0) {
          registration.sync.register('background-sync').catch((error) => {
            console.error('Background sync registration failed:', error);
          });
        }
      });

      // Listen for sync events
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'BACKGROUND_SYNC') {
          syncOfflineActions();
        }
      });
    }
  }, [pendingActions.length, syncOfflineActions]);
}

// Hook for offline storage management
export function useOfflineStorage() {
  const estimateStorage = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota ? estimate.quota - (estimate.usage || 0) : 0,
          usagePercentage: estimate.quota && estimate.usage ? 
            (estimate.usage / estimate.quota) * 100 : 0,
        };
      } catch (error) {
        console.error('Storage estimation failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  const clearOfflineData = useCallback(async () => {
    try {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear IndexedDB (if used)
      if ('indexedDB' in window) {
        // Implementation depends on your IndexedDB usage
      }

      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }, []);

  return {
    estimateStorage,
    clearOfflineData,
  };
}

// Hook for network quality detection
export function useNetworkQuality() {
  const { showNotification } = useAppStore();

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        const { effectiveType, downlink, rtt } = connection;
        
        // Notify about poor connection
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          showNotification({
            type: 'warning',
            title: 'Slow Connection',
            message: 'Your connection is slow. Some features may be limited.',
            duration: 5000,
          });
        }
        
        // Log connection info
        console.log('Network quality:', {
          effectiveType,
          downlink: `${downlink} Mbps`,
          rtt: `${rtt} ms`,
        });
      };

      connection.addEventListener('change', handleConnectionChange);
      
      // Initial check
      handleConnectionChange();

      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, [showNotification]);
}
