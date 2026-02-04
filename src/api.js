import { saveOfflineRequest } from './main.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function api(path, opts = {}){
  const headers = opts.headers || {};
  if(localStorage.token) headers['Authorization'] = 'Bearer ' + localStorage.token;
  
  const method = opts.method || 'GET';
  const fullUrl = API_BASE + path;
  const fetchOptions = Object.assign({ headers, credentials: 'include' }, opts);
  
  try {
    const res = await fetch(fullUrl, fetchOptions);
    
    // Si la petición fue exitosa, devolver el resultado
    if (res.ok) {
      return res.json();
    }
    
    // Si falla la petición y NO es GET, intentar guardar para sincronización
    if (method !== 'GET') {
      console.warn('⚠️ Petición fallida, guardando para sincronización offline');
      await saveOfflineRequest(fullUrl, fetchOptions);
      throw new Error('Petición guardada para sincronización offline');
    }
    
    return res.json();
  } catch (error) {
    // Si hay error de red (offline) y NO es GET, guardar para sincronización
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || !navigator.onLine) {
      if (method !== 'GET') {
        console.warn('🔌 Sin conexión, guardando petición para sincronización:', path);
        await saveOfflineRequest(fullUrl, fetchOptions);
        throw new Error('Sin conexión. La petición se sincronizará automáticamente cuando vuelva la conexión.');
      }
    }
    
    throw error;
  }
}

export function login(token, user){
  localStorage.token = token;
  localStorage.user = JSON.stringify(user||{});
}

export function logout(){
  delete localStorage.token;
  delete localStorage.user;
}

export function currentUser(){
  try{
    if(!localStorage.token) return null;
    const userData = localStorage.user;
    if(!userData || userData === '{}') return null;
    const parsed = JSON.parse(userData);
    if(!parsed.email) return null;
    return parsed;
  }catch(e){
    return null;
  }
}
