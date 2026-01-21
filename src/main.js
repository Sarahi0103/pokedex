import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Verificar si hay actualizaciones cada 60 segundos
        setInterval(() => {
          registration.update();
        }, 60000);

        // Escuchar cambios en el Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Nueva versión del Service Worker detectada');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay un nuevo SW listo, activar automáticamente
              console.log('🚀 Activando nuevo Service Worker...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              
              // Recargar la página para usar el nuevo SW
              window.location.reload();
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  });
  
  // Recargar cuando el nuevo SW tome control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('🔄 Nuevo Service Worker activado, recargando...');
      window.location.reload();
    }
  });
}
