/* ESSOR Agenda — service worker minimal pour notifications persistantes. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/?agenda=1";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      for (const client of windows) {
        if ("navigate" in client) {
          try {
            await client.navigate(target);
          } catch {
            // Le focus reste utile même si le navigateur refuse la navigation.
          }
        }
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    }),
  );
});
