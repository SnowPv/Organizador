// Guarda la "cáscara" de la app para que abra rápido y sin conexión.
// Los datos siempre se piden a tu Sheet (nunca se guardan aquí).
const CACHE = 'organizador-v8';
const COMPARTIDO = 'compartido';   // chat de WhatsApp compartido con la app, mientras la app lo lee
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== COMPARTIDO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // «Compartir» desde WhatsApp (Exportar chat → Organizador): guarda el archivo y abre la app.
  if (req.method === 'POST' && url.origin === self.location.origin && url.searchParams.has('compartir')) {
    e.respondWith((async () => {
      const fd = await req.formData();
      const f = fd.get('chat'), cache = await caches.open(COMPARTIDO);
      if (f && typeof f !== 'string') {
        // Se guarda tal cual (puede ser .txt o .zip); la app lo descomprime al abrirse.
        await cache.put('chat.bin', new Response(f, { headers: { 'x-nombre': encodeURIComponent(f.name || '') } }));
      } else {
        await cache.put('chat.json', new Response(JSON.stringify({ txt: String(fd.get('text') || ''), nombre: String(fd.get('title') || '') })));
      }
      return Response.redirect(new URL('./?compartido=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
