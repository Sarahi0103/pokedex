<script setup>
import { ref } from 'vue'
import { login } from '../api'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const err = ref('')
const loading = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

async function submit(){
  if(!email.value || !password.value || !name.value){
    err.value = 'Por favor completa todos los campos'
    return
  }
  
  if(password.value.length < 6){
    err.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  
  if(password.value !== confirmPassword.value){
    err.value = 'Las contraseñas no coinciden'
    return
  }
  
  loading.value = true
  err.value = ''
  
  try{
    const res = await fetch((import.meta.env.VITE_API_BASE||'http://localhost:4000') + '/auth/register', { 
      method: 'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ email: email.value, password: password.value, name: name.value }) 
    })
    const data = await res.json()
    
    if(data.token){ 
      login(data.token, data.user)
      router.push('/')
    } else {
      err.value = data.error || 'Error al registrarse'
    }
  }catch(e){
    err.value = 'Error de conexión'
  }finally{
    loading.value = false
  }
}

function registerWithGoogle() {
  window.location.href = `${API_BASE}/auth/google`
}
</script>

<template>
  <div class="register-container">
    <div class="card register-card">
      <div class="register-header">
        <h1>Crear Cuenta</h1>
        <p class="muted">Únete a PokeMinimal y comienza tu aventura</p>
      </div>

      <form @submit.prevent="submit" class="register-form">
        <div class="form-group">
          <label for="name">Nombre</label>
          <input 
            id="name"
            v-model="name" 
            type="text"
            placeholder="Tu nombre"
            :disabled="loading"
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="email" 
            type="email"
            placeholder="tu@email.com"
            :disabled="loading"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            placeholder="Mínimo 6 caracteres"
            :disabled="loading"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input 
            id="confirmPassword"
            v-model="confirmPassword" 
            type="password" 
            placeholder="Repite tu contraseña"
            :disabled="loading"
            autocomplete="new-password"
          />
        </div>

        <div v-if="err" class="error">{{ err }}</div>

        <button type="submit" class="btn btn-accent" :disabled="loading" style="width:100%">
          {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
        </button>

        <div class="divider">
          <span>o regístrate con</span>
        </div>

        <button 
          type="button" 
          class="btn btn-google" 
          @click="registerWithGoogle"
          :disabled="loading"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Registrarse con Google
        </button>

        <div class="register-footer">
          <p class="muted small">
            ¿Ya tienes cuenta? 
            <router-link to="/login" style="color:var(--blue); font-weight:600; text-decoration:none">
              Inicia sesión aquí
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-container{
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:calc(100vh - 200px);
}

.register-card{
  max-width:450px;
  width:100%;
  margin:0 auto;
}

.register-header{
  text-align:center;
  margin-bottom:32px;
}

.register-header h1{
  color:var(--black);
  margin-bottom:8px;
}

.register-form{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.register-footer{
  text-align:center;
  margin-top:24px;
  padding-top:24px;
  border-top:1px solid var(--border);
}

.divider{
  position:relative;
  text-align:center;
  margin:24px 0;
}

.divider::before{
  content:'';
  position:absolute;
  top:50%;
  left:0;
  right:0;
  height:1px;
  background:var(--border);
}

.divider span{
  position:relative;
  background:var(--card-bg);
  padding:0 16px;
  color:var(--text-muted);
  font-size:0.9rem;
}

.btn-google{
  width:100%;
  background:white;
  color:#333;
  border:2px solid var(--border);
  display:flex;
  align-items:center;
  justify-content:center;
  gap:12px;
  font-weight:600;
}

.btn-google:hover:not(:disabled){
  background:#f8f9fa;
  border-color:#dadce0;
  transform:translateY(-1px);
  box-shadow:0 2px 8px rgba(0,0,0,0.1);
}

.btn-google svg{
  flex-shrink:0;
}
</style>
