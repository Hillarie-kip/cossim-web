const CACHE_NAME = 'cossim-shell-v2'
const APP_SHELL = ['/', '/manifest.json', '/favicon.png', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  // Next.js manages route payloads. Never cache them or replace them with HTML.
  if (url.searchParams.has('_rsc') || event.request.headers.get('RSC') === '1' || url.pathname.startsWith('/api/')) return
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.destination !== 'document') {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() => caches.match(event.request).then(async (cached) => {
        if (cached) return cached
        // A script request must never receive the offline HTML page.
        if (event.request.mode === 'navigate') return (await caches.match('/')) || Response.error()
        return Response.error()
      }))
  )
})
