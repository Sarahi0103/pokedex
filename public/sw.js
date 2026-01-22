// Service Worker - Pokedex PWA
const CACHE_NAME = 'pokedex-v8';
const CACHE_DYNAMIC_NAME = 'pokedex-dynamic-v8';
const CACHE_IMAGES_NAME = 'pokedex-images-v8';

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
            // Eliminar caches que no sean el actual ni el dinámico ni el de imágenes
            if (cacheName !== CACHE_NAME && 
                cacheName !== CACHE_DYNAMIC_NAME && 
                cacheName !== CACHE_IMAGES_NAME) {
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

// FETCH - Estrategia: Network First para API, Cache First para estáticos
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Filtrar extensiones de Chrome y URLs no HTTP/HTTPS al inicio
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }
  
  try {
    const url = new URL(request.url);
    
    // NO cachear peticiones que no sean GET
    if (request.method !== 'GET') {
      return;
    }

    // Network First para endpoints de API que cambian frecuentemente
    const isDynamicAPI = url.pathname.includes('/api/favorites') || 
                         url.pathname.includes('/api/friends') || 
                         url.pathname.includes('/api/teams');

  if (isDynamicAPI) {
    // Estrategia Network First: Primero red, luego cache si falla
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Actualizar cache con la respuesta más reciente
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_DYNAMIC_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red, servir desde cache
          console.log('[SW] Red no disponible, sirviendo desde cache:', request.url);
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First para imágenes de Pokémon (PokeAPI)
  const isPokemonImage = url.hostname.includes('pokeapi.co') || 
                         url.hostname.includes('raw.githubusercontent.com');
  
  if (isPokemonImage) {
    event.respondWith(
      caches.match(request)
        .then(cacheResponse => {
          if (cacheResponse) {
            return cacheResponse;
          }
          
          return fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_IMAGES_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
    );
    return;
  }

  // Cache First para recursos estáticos (APP SHELL y archivos estáticos)
  event.respondWith(
    caches.match(request)
      .then(cacheResponse => {
        if (cacheResponse) {
          return cacheResponse;
        }

        // Si no está en cache, hacer fetch a la red
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
                // Solo cachear si no es extensión de Chrome
                if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
                  cache.put(request, responseToCache);
                }
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
  } catch (error) {
    // Ignorar errores de URLs no soportadas
    console.log('[SW] Error procesando fetch:', error);
  }
});

// Mensaje desde el cliente para actualizar el SW
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});