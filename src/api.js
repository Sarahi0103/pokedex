const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function api(path, opts = {}){
  const headers = opts.headers || {};
  if(localStorage.token) headers['Authorization'] = 'Bearer ' + localStorage.token;
  const res = await fetch(API_BASE + path, Object.assign({ headers, credentials: 'include' }, opts));
  return res.json();
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
  return JSON.parse(localStorage.user || '{}');
}
