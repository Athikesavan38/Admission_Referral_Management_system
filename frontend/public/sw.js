// Service Worker — handles push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title   = data.title   || 'Admission Referral Portal';
  const options = {
    body:    data.body    || 'You have a new notification.',
    icon:    data.icon    || '/favicon.svg',
    badge:   '/favicon.svg',
    tag:     data.tag     || 'arp-notification',
    data:    { url: data.url || '/' },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(url) && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
