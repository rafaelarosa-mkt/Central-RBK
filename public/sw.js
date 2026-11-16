// Service worker mínimo: permite instalar a Central como aplicativo.
// Não guarda dados em cache; tudo vem sempre do servidor.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
