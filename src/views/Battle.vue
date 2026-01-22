<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const route = useRoute()
const myTeams = ref([])
const friends = ref([])
const selectedTeam = ref(null)
const selectedFriend = ref(null)
const selectedEnemyTeam = ref(null)
const myPokemon = ref(null)
const enemyPokemon = ref(null)
const battleResult = ref(null)
const loading = ref(false)
const battling = ref(false)
const battleLog = ref([])

onMounted(async () => {
  if(!localStorage.token){
    router.push('/login')
    return
  }
  
  loading.value = true
  try{
    const [teamsData, friendsData] = await Promise.all([
      api('/api/teams'),
      api('/api/friends')
    ])
    myTeams.value = teamsData.teams || []
    friends.value = friendsData.friends || []
    
    const friendCode = route.query.friend
    if(friendCode){
      const friend = friends.value.find(f => f.code === friendCode)
      if(friend) selectedFriend.value = friend
    }
  }catch(e){
    console.error(e)
  }finally{
    loading.value = false
  }
})

const myTeamPokemons = computed(() => {
  if(selectedTeam.value === null || selectedTeam.value === undefined) return []
  const team = myTeams.value[selectedTeam.value]
  return team?.pokemons || []
})

const mockEnemyPokemons = computed(() => {
  return [
    { id: 6, name: 'Charizard', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png' },
    { id: 25, name: 'Pikachu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png' },
    { id: 3, name: 'Venusaur', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png' },
  ]
})

async function startBattle(){
  if(!myPokemon.value || !enemyPokemon.value){
    alert('Selecciona ambos Pokémon para la batalla')
    return
  }
  
  battling.value = true
  battleLog.value = []
  battleResult.value = null
  
  addLog(`⚔️ ¡Comienza la batalla!`)
  addLog(`${myPokemon.value.name} VS ${enemyPokemon.value.name}`)
  
  try{
    const [myStats, enemyStats] = await Promise.all([
      api(`/api/pokemon/${myPokemon.value.id}`),
      api(`/api/pokemon/${enemyPokemon.value.id}`)
    ])
    
    const battleData = {
      attacker: {
        pokemon: myPokemon.value.name,
        stats: {
          hp: myStats.stats.find(s => s.stat.name === 'hp').base_stat,
          attack: myStats.stats.find(s => s.stat.name === 'attack').base_stat,
          defense: myStats.stats.find(s => s.stat.name === 'defense').base_stat,
          speed: myStats.stats.find(s => s.stat.name === 'speed').base_stat,
        },
        types: myStats.types.map(t => t.type.name)
      },
      defender: {
        pokemon: enemyPokemon.value.name,
        stats: {
          hp: enemyStats.stats.find(s => s.stat.name === 'hp').base_stat,
          attack: enemyStats.stats.find(s => s.stat.name === 'attack').base_stat,
          defense: enemyStats.stats.find(s => s.stat.name === 'defense').base_stat,
          speed: enemyStats.stats.find(s => s.stat.name === 'speed').base_stat,
        },
        types: enemyStats.types.map(t => t.type.name)
      }
    }
    
    addLog(`💪 ${myPokemon.value.name} - ATK: ${battleData.attacker.stats.attack}, DEF: ${battleData.attacker.stats.defense}`)
    addLog(`💪 ${enemyPokemon.value.name} - ATK: ${battleData.defender.stats.attack}, DEF: ${battleData.defender.stats.defense}`)
    
    const result = await api('/api/battle/simulate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(battleData)
    })
    
    setTimeout(() => {
      addLog(`⚡ Puntuación ${myPokemon.value.name}: ${result.aScore.toFixed(1)}`)
      addLog(`⚡ Puntuación ${enemyPokemon.value.name}: ${result.dScore.toFixed(1)}`)
      addLog(`🏆 ¡${result.winner} gana la batalla!`)
      battleResult.value = result
    }, 500)
    
  }catch(e){
    console.error(e)
    addLog('❌ Error en la batalla')
  }finally{
    setTimeout(() => {
      battling.value = false
    }, 1000)
  }
}

function addLog(text){
  battleLog.value.push({
    text,
    time: new Date().toLocaleTimeString()
  })
}

function resetBattle(){
  myPokemon.value = null
  enemyPokemon.value = null
  battleResult.value = null
  battleLog.value = []
}
</script>

<template>
  <div class="battle-page">
    <div class="battle-header">
      <div class="header-content">
        <div class="header-title">
          <span class="battle-icon">⚔️</span>
          <h1>ARENA DE BATALLA</h1>
        </div>
        <p class="header-subtitle">¡Prepara tus Pokémon para la batalla épica!</p>
      </div>
    </div>

    <div v-if="loading" class="pokemon-loading">
      <div class="loading-pokeball">
        <div class="pokeball-spin">⚪</div>
      </div>
      <p class="loading-text">Cargando datos de batalla...</p>
    </div>

    <div v-else class="battle-container">
      <div class="selection-section">
        <h3>1️⃣ Selecciona tu Equipo</h3>
        <div v-if="myTeams.length === 0" class="empty-state" style="padding:20px">
          <p class="muted">No tienes equipos. Crea uno primero.</p>
          <button class="btn btn-primary btn-sm" @click="router.push('/teams')">
            Crear Equipo
          </button>
        </div>
        <div v-else class="team-selector">
          <select v-model="selectedTeam">
            <option :value="null">-- Selecciona un equipo --</option>
            <option v-for="(team, index) in myTeams" :key="index" :value="index">
              {{ team.name || 'Equipo ' + (index + 1) }} ({{ (team.pokemons || []).length }} Pokémon)
            </option>
          </select>
        </div>
      </div>

      <div class="battle-grid">
        <div class="battle-side">
          <h3>Tu Pokémon</h3>
          <div v-if="selectedTeam === null" class="empty-state" style="padding:40px">
            <p class="muted">Selecciona un equipo primero</p>
          </div>
          <div v-else-if="myTeamPokemons.length === 0" class="empty-state" style="padding:40px">
            <p class="muted">El equipo está vacío</p>
          </div>
          <div v-else class="pokemon-grid">
            <div 
              v-for="pokemon in myTeamPokemons" 
              :key="pokemon.id"
              class="pokemon-selector-card"
              :class="{ selected: myPokemon?.id === pokemon.id }"
              @click="myPokemon = pokemon"
            >
              <img 
                :src="pokemon.sprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + pokemon.id + '.png'"
                :alt="pokemon.name"
              />
              <div class="pokemon-name">{{ pokemon.name }}</div>
              <div v-if="myPokemon?.id === pokemon.id" class="selected-badge">✓</div>
            </div>
          </div>
        </div>

        <div class="vs-indicator">
          <div class="vs-text">VS</div>
        </div>

        <div class="battle-side">
          <h3>Pokémon Rival</h3>
          <div v-if="selectedFriend" class="friend-indicator">
            <p class="small">Batalla contra: <strong>{{ selectedFriend.name }}</strong></p>
          </div>
          <div class="pokemon-grid">
            <div 
              v-for="pokemon in mockEnemyPokemons" 
              :key="pokemon.id"
              class="pokemon-selector-card"
              :class="{ selected: enemyPokemon?.id === pokemon.id }"
              @click="enemyPokemon = pokemon"
            >
              <img 
                :src="pokemon.sprite"
                :alt="pokemon.name"
              />
              <div class="pokemon-name">{{ pokemon.name }}</div>
              <div v-if="enemyPokemon?.id === pokemon.id" class="selected-badge">✓</div>
            </div>
          </div>
        </div>
      </div>

      <div class="battle-controls">
        <button 
          class="btn btn-accent" 
          @click="startBattle"
          :disabled="!myPokemon || !enemyPokemon || battling"
          style="font-size:1.2rem; padding:16px 32px"
        >
          {{ battling ? '⚡ Batallando...' : '⚔️ ¡Iniciar Batalla!' }}
        </button>
        <button 
          v-if="battleResult"
          class="btn btn-outline" 
          @click="resetBattle"
        >
          🔄 Nueva Batalla
        </button>
      </div>

      <div v-if="battleLog.length > 0" class="battle-log">
        <h3>📜 Registro de Batalla</h3>
        <div class="log-entries">
          <div 
            v-for="(entry, index) in battleLog" 
            :key="index"
            class="log-entry"
          >
            <span class="log-time">{{ entry.time }}</span>
            <span class="log-text">{{ entry.text }}</span>
          </div>
        </div>
      </div>

      <div v-if="battleResult" class="battle-result">
        <div class="result-content">
          <div class="result-icon">
            {{ battleResult.winner === myPokemon.name ? '🏆' : '💔' }}
          </div>
          <h2>
            {{ battleResult.winner === myPokemon.name ? '¡Victoria!' : 'Derrota' }}
          </h2>
          <p class="result-winner">
            <strong>{{ battleResult.winner }}</strong> gana la batalla
          </p>
          <div class="result-stats">
            <div class="stat-box">
              <div class="stat-label">{{ myPokemon.name }}</div>
              <div class="stat-value" style="color:var(--blue)">{{ battleResult.aScore.toFixed(1) }}</div>
            </div>
            <div class="stat-divider">VS</div>
            <div class="stat-box">
              <div class="stat-label">{{ enemyPokemon.name }}</div>
              <div class="stat-value" style="color:var(--red)">{{ battleResult.dScore.toFixed(1) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-page{
  max-width: 1400px;
  margin: 0 auto;
}

.battle-header{
  background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 50%, #FF6B6B 100%);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
  border: 4px solid #FFCB05;
  position: relative;
  overflow: hidden;
}

.battle-header::before{
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 203, 5, 0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content{
  position: relative;
  z-index: 1;
  text-align: center;
}

.header-title{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.battle-icon{
  font-size: 36px;
  animation: battle-pulse 2s ease-in-out infinite;
}

@keyframes battle-pulse{
  0%, 100%{ transform: scale(1) rotate(-5deg); }
  50%{ transform: scale(1.1) rotate(5deg); }
}

.header-title h1{
  color: #FFCB05;
  font-size: 36px;
  font-weight: 900;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  margin: 0;
}

.header-subtitle{
  color: white;
  font-size: 1.1rem;
  opacity: 0.95;
  margin: 0;
}

.pokemon-loading{
  text-align: center;
  padding: 60px 20px;
}

.loading-pokeball{
  font-size: 3rem;
  margin-bottom: 16px;
}

.pokeball-spin{
  animation: spin 2s linear infinite;
}

@keyframes spin{
  from{ transform: rotate(0deg); }
  to{ transform: rotate(360deg); }
}

.loading-text{
  color: var(--text-muted);
  font-size: 1.1rem;
}

.battle-container{
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.selection-section{
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 3px solid var(--blue);
}

.selection-section h3{
  color: var(--blue);
  margin-bottom: 16px;
  font-size: 1.3rem;
}

.team-selector select{
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.battle-grid{
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: start;
}

.battle-side{
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 3px solid var(--red);
}

.battle-side h3{
  color: var(--red);
  margin-bottom: 16px;
  text-align: center;
  font-size: 1.2rem;
}

.pokemon-grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.pokemon-selector-card{
  background: var(--bg);
  border: 3px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  text-align: center;
}

.pokemon-selector-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  border-color: var(--blue);
}

.pokemon-selector-card.selected{
  border-color: var(--blue);
  background: linear-gradient(135deg, rgba(59, 76, 202, 0.1) 0%, rgba(42, 117, 187, 0.1) 100%);
  box-shadow: 0 4px 12px rgba(59, 76, 202, 0.3);
}

.pokemon-selector-card img{
  width: 100%;
  height: auto;
  max-width: 100px;
  margin: 0 auto;
  display: block;
}

.pokemon-name{
  text-transform: capitalize;
  font-weight: 600;
  margin-top: 8px;
  color: var(--black);
  font-size: 0.9rem;
}

.selected-badge{
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--blue);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.empty-state{
  text-align: center;
  color: var(--text-muted);
  padding: 40px 20px;
}

.vs-indicator{
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.vs-text{
  font-size: 3rem;
  font-weight: 900;
  color: var(--red);
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  animation: vs-pulse 2s ease-in-out infinite;
}

@keyframes vs-pulse{
  0%, 100%{ transform: scale(1); }
  50%{ transform: scale(1.1); }
}

.friend-indicator{
  padding: 8px 12px;
  background: var(--blue-light);
  color: white;
  border-radius: 6px;
  margin-bottom: 12px;
  text-align: center;
}

.battle-controls{
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.battle-log{
  background: var(--black);
  color: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  border: 3px solid #FFCB05;
}

.battle-log h3{
  color: #FFCB05;
  margin-bottom: 16px;
  font-size: 1.2rem;
}

.log-entries{
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
}

.log-entry{
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  display: flex;
  gap: 12px;
}

.log-time{
  color: var(--text-muted);
  font-size: 0.85rem;
  min-width: 80px;
}

.log-text{
  flex: 1;
}

.battle-result{
  background: linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(59, 76, 202, 0.4);
  border: 4px solid #FFCB05;
  text-align: center;
}

.result-content{
  padding: 20px;
}

.result-icon{
  font-size: 5rem;
  margin-bottom: 16px;
  animation: result-bounce 1s ease-in-out;
}

@keyframes result-bounce{
  0%, 100%{ transform: scale(1); }
  50%{ transform: scale(1.2); }
}

.result-content h2{
  color: white;
  margin-bottom: 12px;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.result-winner{
  font-size: 1.3rem;
  margin-bottom: 24px;
  color: rgba(255,255,255,0.9);
}

.result-stats{
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-top: 24px;
}

.stat-box{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  min-width: 150px;
}

.stat-label{
  font-weight: 600;
  text-transform: capitalize;
  font-size: 1.1rem;
}

.stat-value{
  font-size: 2.5rem;
  font-weight: 900;
}

.stat-divider{
  font-size: 1.5rem;
  font-weight: 700;
  opacity: 0.5;
}

@media (max-width: 968px){
  .battle-grid{
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .vs-indicator{
    padding: 20px 0;
  }
  
  .vs-text{
    font-size: 2rem;
  }
  
  .result-stats{
    flex-direction: column;
    gap: 16px;
  }
}
</style>
