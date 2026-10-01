<template>
  <div class="flex flex-col gap-5 animate-fade-in">
    <!-- Başlık -->
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Genel Bakış</h1>
        <p class="text-ink-2 text-sm mt-0.5">Hoş geldin, {{ authStore.user?.name || 'Yatırımcı' }}.</p>
      </div>
      <router-link to="/markets" class="btn btn-accent">Piyasalara git</router-link>
    </div>

    <Banner location="HOME_TOP" />

    <!-- Yükleniyor -->
    <div v-if="loading" class="panel p-10 text-center text-ink-2">Veriler yükleniyor…</div>

    <template v-else-if="summary">
      <!-- Özet kartları -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="panel panel-pad">
          <div class="label">Toplam Değer</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ money(summary.totalValue) }}</div>
        </div>
        <div class="panel panel-pad">
          <div class="label">Nakit</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ money(summary.cash) }}</div>
          <div class="text-2xs text-ink-3 mt-1">Bloke: <span class="num">{{ money(summary.lockedCash) }}</span></div>
        </div>
        <div class="panel panel-pad">
          <div class="label">Hisse Değeri</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ money(summary.totalMarketValue) }}</div>
        </div>
        <div class="panel panel-pad">
          <div class="label">Toplam K/Z</div>
          <div class="num text-2xl font-semibold mt-1.5" :class="plClass(summary.totalPL)">{{ money(summary.totalPL) }}</div>
          <div class="num text-sm mt-1" :class="plClass(summary.totalPL)">{{ pct(summary.totalPLPct) }}</div>
        </div>
      </div>

      <!-- Pozisyonlar -->
      <div class="panel overflow-hidden">
        <div class="panel-head">
          <span>Pozisyonlarım</span>
          <span class="text-ink-3">{{ summary.positions.length }}</span>
        </div>

        <div v-if="summary.positions.length === 0" class="p-10 text-center text-ink-2">
          Henüz pozisyonun yok. İlk alımını piyasalar ekranından yapabilirsin.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Sembol</th>
                <th class="text-right">Adet</th>
                <th class="text-right">Ort. Maliyet</th>
                <th class="text-right">Güncel</th>
                <th class="text-right">Değer</th>
                <th class="text-right">K/Z</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pos in summary.positions" :key="pos.id">
                <td>
                  <div class="flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded grid place-items-center text-2xs font-bold bg-accent-bg text-accent-ink">
                      {{ pos.symbol.substring(0, 2) }}
                    </span>
                    <div>
                      <div class="font-semibold">{{ pos.symbol }}</div>
                      <div class="text-2xs text-ink-3">{{ pos.name }}</div>
                    </div>
                  </div>
                </td>
                <td class="col-num">{{ pos.quantity }}</td>
                <td class="col-num text-ink-2">{{ money(pos.avgPrice) }}</td>
                <td class="col-num">{{ money(pos.currentPrice) }}</td>
                <td class="col-num">{{ money(pos.marketValue) }}</td>
                <td class="col-num">
                  <span :class="plClass(pos.unrealizedPL)">{{ money(pos.unrealizedPL) }}</span>
                  <span class="block text-2xs" :class="plClass(pos.unrealizedPL)">{{ pct(pos.unrealizedPLPct) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import Banner from '@/components/Banner.vue'
import { money, pct } from '@/composables/useFormat'

const authStore = useAuthStore()
const loading = ref(false)
const summary = ref<any>(null)

const plClass = (v: number) => (Number(v) >= 0 ? 'text-up' : 'text-down')

onMounted(async () => {
  loading.value = true
  try {
    summary.value = await api.getPortfolioSummary()
  } catch (error) {
    console.error('Portföy özeti yüklenemedi', error)
  } finally {
    loading.value = false
  }
})
</script>
