// Service Worker - Pokedex PWA
const CACHE_NAME = 'pokedex-v1';
const CACHE_DYNAMIC_NAME = 'pokedex-dynamic-v1';

// APP SHELL - Recursos estáticos necesarios para que la app funcione offline
const APP_SHELL = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/App.vue',
  '/src/styles.css',
  '/src/store.js',
  '/src/api.js',
  '/src/router/index.js',
  '/src/views/Home.vue',
  '/src/views/Login.vue',
  '/src/views/Register.vue',
  '/src/views/Favorites.vue',
  '/src/views/Teams.vue',
  '/src/views/Friends.vue',
  '/src/views/Battle.vue',
  '/src/views/PokemonDetail.vue',
  '/src/views/AuthCallback.vue'
];

// INSTALL - Cachear el APP SHELL
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...', event);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando APP SHELL');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        // Activar el nuevo SW automáticamente sin esperar
        return self.skipWaiting();
      })
  );
});

// ACTIVATE - Limpiar caches antiguos
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...', event);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Eliminar caches que no sean el actual ni el dinámico
            if (cacheName !== CACHE_NAME && cacheName !== CACHE_DYNAMIC_NAME) {
              console.log('[SW] Eliminando cache antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Tomar control de todas las páginas inmediatamente
        return self.clients.claim();
      })
  );
});

// FETCH - Estrategia: Cache First, falling back to Network
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Solo cachear peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cacheResponse => {
        // Si está en cache, retornar desde cache
        if (cacheResponse) {
          console.log('[SW] Sirviendo desde cache:', request.url);
          return cacheResponse;
        }

        // Si no está en cache, hacer fetch a la red
        console.log('[SW] Fetch desde red:', request.url);
        return fetch(request)
          .then(networkResponse => {
            // Solo cachear respuestas exitosas
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }

            // Clonar la respuesta porque solo se puede usar una vez
            const responseToCache = networkResponse.clone();

            // Guardar en cache dinámico
            caches.open(CACHE_DYNAMIC_NAME)
              .then(cache => {
                console.log('[SW] Guardando en cache dinámico:', request.url);
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch(error => {
            console.log('[SW] Error de red, buscando en cache dinámico:', error);
            // Si falla la red, intentar buscar en cache dinámico
            return caches.match(request);
          });
      })
  );
});

// Mensaje desde el cliente para actualizar el SW
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});