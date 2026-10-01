<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <!-- Başlık + arama -->
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Piyasalar</h1>
        <p class="text-ink-2 text-sm mt-0.5">Canlı fiyatlar ve şirket bilgileri</p>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="q" type="search" class="input max-w-[220px] py-2" placeholder="Sembol veya firma ara…" />
        <span class="label whitespace-nowrap">{{ filtered.length }} / {{ companies.length }}</span>
      </div>
    </div>

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Piyasa verileri yükleniyor…</div>

    <template v-else>
      <div v-if="companies.length === 0" class="panel p-10 text-center text-ink-2">
        Henüz firma yok. Yönetim panelinden firma ekleyebilirsiniz.
      </div>

      <!-- Masaüstü tablo -->
      <div v-else class="panel overflow-hidden hidden md:block">
        <div class="overflow-x-auto">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Sembol</th>
                <th>Firma</th>
                <th>Sektör</th>
                <th class="text-right">Fiyat</th>
                <th class="text-right">Değişim</th>
                <th class="text-right">Yüksek / Düşük</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="company in filtered"
                :key="company.id"
                class="cursor-pointer"
                @click="goDetail(company.id)"
              >
                <td>
                  <div class="flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded grid place-items-center text-2xs font-bold bg-accent-bg text-accent-ink">
                      {{ company.symbol.substring(0, 2) }}
                    </span>
                    <span class="font-semibold">{{ company.symbol }}</span>
                  </div>
                </td>
                <td class="text-ink-2">{{ company.name }}</td>
                <td><span class="pill-muted">{{ company.sector || '—' }}</span></td>
                <td class="col-num font-semibold">{{ money(company.currentPrice) }}</td>
                <td class="col-num">
                  <span :class="company.change > 0 ? 'pill-up' : (company.change < 0 ? 'pill-down' : 'pill-muted')">
                    {{ pct(company.change) }}
                  </span>
                </td>
                <td class="col-num text-ink-2 text-2xs">
                  <span class="text-up">{{ num(company.highPrice) }}</span> /
                  <span class="text-down">{{ num(company.lowPrice) }}</span>
                </td>
                <td class="text-right">
                  <span class="text-accent-ink text-sm">Detay →</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobil kartlar -->
      <div v-if="companies.length" class="grid grid-cols-1 gap-2.5 md:hidden">
        <router-link
          v-for="company in filtered"
          :key="company.id"
          :to="`/markets/${company.id}`"
          class="panel panel-pad block"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-9 h-9 rounded grid place-items-center text-2xs font-bold bg-accent-bg text-accent-ink">
                {{ company.symbol.substring(0, 2) }}
              </span>
              <div>
                <div class="font-semibold">{{ company.symbol }}</div>
                <div class="text-2xs text-ink-3">{{ company.name }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="num font-semibold">{{ money(company.currentPrice) }}</div>
              <div class="num text-2xs" :class="company.change >= 0 ? 'text-up' : 'text-down'">{{ pct(company.change) }}</div>
            </div>
          </div>
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { money, num, pct } from '@/composables/useFormat'

const router = useRouter()
const loading = ref(true)
const companies = ref<any[]>([])
const q = ref('')

const filtered = computed(() => {
  const s = q.value.trim().toLocaleUpperCase('tr-TR')
  if (!s) return companies.value
  return companies.value.filter(
    (c) =>
      c.symbol.toLocaleUpperCase('tr-TR').includes(s) ||
      (c.name || '').toLocaleUpperCase('tr-TR').includes(s)
  )
})

function goDetail(id: string) {
  router.push(`/markets/${id}`)
}

const loadCompanies = async () => {
  try {
    loading.value = true
    const data = await api.getCompanies()
    companies.value = data.map((c: any) => {
      let change = c.change
      if (change === undefined || change === null) {
        const current = Number(c.currentPrice || c.lastPrice || 0)
        const open = Number(c.openPrice || current)
        change = open > 0 ? ((current - open) / open) * 100 : 0
      }
      return { ...c, change, volume: c.volume ?? 0 }
    })
  } catch (error: any) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(loadCompanies)
</script>
