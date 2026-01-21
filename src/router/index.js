import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import PokemonDetail from '../views/PokemonDetail.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Favorites from '../views/Favorites.vue'
import Teams from '../views/Teams.vue'
import Friends from '../views/Friends.vue'
import Battle from '../views/Battle.vue'
import AuthCallback from '../views/AuthCallback.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/pokemon/:id', name: 'PokemonDetail', component: PokemonDetail },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/favorites', name: 'Favorites', component: Favorites },
  { path: '/teams', name: 'Teams', component: Teams },
  { path: '/friends', name: 'Friends', component: Friends },
  { path: '/battle', name: 'Battle', component: Battle },
  { path: '/auth/callback', name: 'AuthCallback', component: AuthCallback }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
