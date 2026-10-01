<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Sıralama</h1>
        <p class="text-ink-2 text-sm mt-0.5">En başarılı yatırımcılar</p>
      </div>
      <select v-model="sortBy" @change="loadLeaderboard" class="input max-w-[200px] py-2">
        <option value="totalValue">Toplam Değer</option>
        <option value="profitLoss">Kar/Zarar</option>
        <option value="profitPct">Getiri %</option>
      </select>
    </div>

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Sıralama yükleniyor…</div>

    <div v-else-if="leaderboard.length" class="panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="grid-table">
          <thead>
            <tr>
              <th class="w-16 text-center">Sıra</th>
              <th>Kullanıcı</th>
              <th class="text-right">Nakit</th>
              <th class="text-right">Hisse</th>
              <th class="text-right">Toplam</th>
              <th class="text-right">Kar/Zarar</th>
              <th class="text-right">Getiri</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(user, index) in leaderboard"
              :key="user.id"
              :class="{ 'bg-accent-bg': user.isMe }"
            >
              <td class="text-center">
                <span
                  class="num inline-grid place-items-center w-7 h-7 rounded font-bold text-2xs"
                  :class="rankClass(index)"
                >{{ index + 1 }}</span>
              </td>
              <td>
                <div class="flex items-center gap-2.5">
                  <span class="w-8 h-8 rounded-full grid place-items-center text-2xs font-bold text-white"
                    style="background: linear-gradient(135deg, var(--c-accent), var(--c-accent-ink));">
                    {{ (user.name || user.email || '?').charAt(0).toUpperCase() }}
                  </span>
                  <div>
                    <div class="font-semibold flex items-center gap-1.5">
                      {{ user.name || 'İsimsiz' }}
                      <span v-if="user.isMe" class="pill-accent">SİZ</span>
                    </div>
                    <div class="text-2xs text-ink-3">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="col-num text-ink-2">{{ money(user.cash, 0) }}</td>
              <td class="col-num text-ink-2">{{ money(user.stockValue, 0) }}</td>
              <td class="col-num font-semibold">{{ money(user.totalValue, 0) }}</td>
              <td class="col-num" :class="plClass(user.profitLoss)">{{ money(user.profitLoss, 0) }}</td>
              <td class="col-num font-semibold" :class="plClass(user.profitPct)">{{ pct(user.profitPct) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="panel p-10 text-center text-ink-2">Henüz sıralama yok.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { money, pct } from '@/composables/useFormat'

const authStore = useAuthStore()
const loading = ref(true)
const leaderboard = ref<any[]>([])
const sortBy = ref('totalValue')

const plClass = (v: number) => (Number(v) >= 0 ? 'text-up' : 'text-down')
const rankClass = (i: number) =>
  i === 0
    ? 'bg-warn-bg text-warn'
    : i === 1
    ? 'bg-panel-2 text-ink'
    : i === 2
    ? 'bg-down-bg text-down'
    : 'bg-panel-2 text-ink-2'

const loadLeaderboard = async () => {
  try {
    loading.value = true
    const data = await api.getLeaderboard({ sortBy: sortBy.value })
    leaderboard.value = data.map((u: any) => ({ ...u, isMe: u.id === authStore.user?.id }))
  } catch (error: any) {
    console.error('Sıralama yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadLeaderboard)
</script>
