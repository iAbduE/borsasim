<template>
  <div class="min-h-screen flex flex-col bg-bg text-ink">
    <!-- FİYAT ŞERİDİ -->
    <div class="tape" aria-hidden="true">
      <div class="tape-track" v-if="ticker.length">
        <span
          v-for="(t, i) in tickerLoop"
          :key="i"
          class="text-xs"
        >
          <span class="text-ink-2 tracking-wide">{{ t.symbol }}</span>
          <span class="num mx-1.5">{{ fmt(t.price) }}</span>
          <span class="num" :class="t.change >= 0 ? 'text-up' : 'text-down'">
            {{ fmtPct(t.change) }}
          </span>
        </span>
      </div>
    </div>

    <!-- ÜST BAR -->
    <header class="flex items-center gap-5 px-4 sm:px-5 py-2.5 border-b border-line bg-panel sticky top-0 z-40">
      <router-link to="/" class="flex items-baseline gap-2.5 shrink-0">
        <span class="font-extrabold text-lg tracking-[0.14em]">BORSA<span class="text-accent-ink">SİM</span></span>
        <span class="hidden sm:inline label border border-line rounded px-1.5 py-0.5">Simülasyon</span>
      </router-link>

      <!-- Masaüstü nav -->
      <nav class="hidden lg:flex items-center gap-0.5 ml-2">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="px-3 py-1.5 rounded text-sm text-ink-2 hover:text-ink hover:bg-panel-2 transition-colors"
          :class="{ 'text-ink bg-elev shadow-[inset_0_-2px_0_var(--c-accent)]': isActive(item.to) }"
        >{{ item.label }}</router-link>
        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          class="px-3 py-1.5 rounded text-sm text-ink-2 hover:text-ink hover:bg-panel-2 transition-colors ml-1 border border-line"
          :class="{ 'text-accent-ink bg-accent-bg border-accent': isActive('/admin') }"
        >Yönetim</router-link>
      </nav>

      <div class="flex-1"></div>

      <!-- KPI'lar -->
      <div class="hidden md:block text-right leading-tight">
        <div class="label">Portföy Değeri</div>
        <div class="num text-[15px] font-semibold">
          {{ money(summary?.totalValue) }}
          <span
            v-if="summary"
            class="text-xs"
            :class="(summary.totalPLPct ?? 0) >= 0 ? 'text-up' : 'text-down'"
          >{{ fmtPct(summary.totalPLPct ?? 0) }}</span>
        </div>
      </div>
      <div class="hidden xl:block text-right leading-tight">
        <div class="label">Nakit</div>
        <div class="num text-[15px] font-semibold">{{ money(summary?.cash) }}</div>
      </div>

      <!-- Kullanıcı -->
      <div class="flex items-center gap-2.5 pl-4 border-l border-line">
        <div class="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white"
          style="background: linear-gradient(135deg, var(--c-accent), var(--c-accent-ink));">
          {{ initials }}
        </div>
        <div class="hidden sm:block leading-tight">
          <div class="text-xs font-medium max-w-[130px] truncate">{{ displayName }}</div>
          <div class="text-2xs text-ink-3">{{ authStore.isAdmin ? 'Yönetici' : 'Katılımcı' }}</div>
        </div>
      </div>

      <button class="btn btn-ghost px-2.5 py-2 text-base" @click="toggleTheme" title="Tema değiştir" aria-label="Tema değiştir">
        <span v-if="theme === 'dark'">☀</span><span v-else>☾</span>
      </button>
      <button class="btn btn-ghost hidden sm:inline-flex text-ink-2 hover:text-down" @click="handleLogout">Çıkış</button>

      <!-- Mobil menü butonu -->
      <button class="lg:hidden btn btn-ghost px-2.5 py-2" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Menü">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'" />
        </svg>
      </button>
    </header>

    <!-- Mobil menü -->
    <div v-if="mobileMenuOpen" class="lg:hidden border-b border-line bg-panel">
      <nav class="px-3 py-2 flex flex-col">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="mobileMenuOpen = false"
          class="px-3 py-2.5 rounded text-sm text-ink-2 hover:text-ink hover:bg-panel-2"
          :class="{ 'text-ink bg-panel-2': isActive(item.to) }"
        >{{ item.label }}</router-link>
        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          @click="mobileMenuOpen = false"
          class="px-3 py-2.5 rounded text-sm text-accent-ink hover:bg-panel-2"
        >Yönetim</router-link>
        <button class="px-3 py-2.5 rounded text-sm text-down text-left hover:bg-panel-2" @click="handleLogout">Çıkış Yap</button>
      </nav>
    </div>

    <!-- İÇERİK -->
    <main class="flex-1 w-full max-w-[1680px] mx-auto px-3 sm:px-5 py-5">
      <router-view />
    </main>

    <!-- Alt reklam + footer -->
    <div class="w-full max-w-[1680px] mx-auto px-3 sm:px-5 mb-4">
      <Banner location="FOOTER" />
    </div>
    <footer>
      <div class="max-w-[1680px] mx-auto px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-ink-3">
        <div>&copy; {{ new Date().getFullYear() }} BorsaSim — Eğitim amaçlı borsa simülasyonu</div>
        <div class="flex w-full justify-center sm:w-auto">
          <PoweredByAbdusselam />
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import Banner from '@/components/Banner.vue'
import PoweredByAbdusselam from '@/components/PoweredByAbdusselam.vue'
import { api } from '@/services/api'
import { useTheme } from '@/composables/useTheme'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { theme, toggleTheme } = useTheme()

const mobileMenuOpen = ref(false)
const ticker = ref<Array<{ symbol: string; price: number; change: number }>>([])
const summary = ref<any>(null)

const navItems = [
  { to: '/', label: 'Genel Bakış' },
  { to: '/markets', label: 'Piyasalar' },
  { to: '/portfolio', label: 'Portföy' },
  { to: '/ipo', label: 'Halka Arz' },
  { to: '/leaderboard', label: 'Sıralama' },
  { to: '/news', label: 'Haberler' },
]

// Şerit sonsuz döngü için iki kez tekrar edilir
const tickerLoop = computed(() => [...ticker.value, ...ticker.value])

const displayName = computed(
  () => authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Kullanıcı'
)
const initials = computed(() => {
  const n = displayName.value.trim()
  const parts = n.split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'K'
})

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function fmt(n: number) {
  return (Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(n: number) {
  const v = Number(n) || 0
  return (v >= 0 ? '+' : '') + v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
}
function money(n: number | undefined) {
  return '₺' + (Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadTicker() {
  try {
    const companies = await api.getCompanies()
    ticker.value = (companies || []).map((c: any) => ({
      symbol: c.symbol,
      price: Number(c.currentPrice || c.lastPrice || 0),
      change: Number(c.change || 0),
    }))
  } catch { /* sessiz */ }
}
async function loadSummary() {
  if (authStore.isAdmin) return
  try {
    summary.value = await api.getPortfolioSummary()
  } catch { /* sessiz */ }
}

onMounted(async () => {
  if (!authStore.user && authStore.isAuthenticated) {
    await authStore.fetchUser()
  }
  loadTicker()
  loadSummary()
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
