import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for browser push notifications using the Notifications API.
 * Registers the service worker and manages permission state.
 */
export function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [supported] = useState(
    typeof Notification !== 'undefined' && 'serviceWorker' in navigator
  );

  // Register service worker on mount
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, [supported]);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!supported) return 'unsupported';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [supported]);

  // Show a local notification (no server push needed)
  const notify = useCallback(async (title, options = {}) => {
    if (!supported) return;
    if (permission !== 'granted') {
      const result = await requestPermission();
      if (result !== 'granted') return;
    }
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      icon:    '/favicon.svg',
      badge:   '/favicon.svg',
      vibrate: [200, 100, 200],
      ...options,
    });
  }, [supported, permission, requestPermission]);

  return { supported, permission, requestPermission, notify };
}
