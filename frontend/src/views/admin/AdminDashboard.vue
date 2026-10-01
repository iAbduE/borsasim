<template>
  <div class="flex flex-col gap-5 animate-fade-in">
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Yönetim Paneli</h1>
        <p class="text-ink-2 text-sm mt-0.5">Sistem yönetimi ve istatistikler</p>
      </div>
      <button class="btn" @click="loadStats">Yenile</button>
    </div>

    <AdminNav />

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Yükleniyor…</div>

    <template v-else-if="stats">
      <!-- Sistem kontrolü -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="panel overflow-hidden">
          <div class="panel-head">
            <span>Borsa Durumu</span>
            <span :class="systemStatus === 'OPEN' ? 'pill-up' : 'pill-down'">{{ systemStatus === 'OPEN' ? 'AÇIK' : 'KAPALI' }}</span>
          </div>
          <div class="p-4 flex flex-col gap-3">
            <p class="text-sm text-ink-2">Alım/satım işlemlerini açar veya kapatır.</p>
            <div v-if="systemStatus === 'CLOSED' && resumeDate" class="text-2xs text-accent-ink bg-accent-bg rounded px-3 py-2">
              Otomatik açılış: {{ new Date(resumeDate).toLocaleString('tr-TR') }}
            </div>
            <div v-if="systemStatus === 'OPEN'">
              <label class="field-label"><span>Otomatik kapanış (opsiyonel)</span></label>
              <input type="datetime-local" v-model="resumeDateInput" class="input" />
            </div>
            <button
              class="btn w-full"
              :class="systemStatus === 'OPEN' ? 'btn-sell' : 'btn-buy'"
              @click="toggleSystemStatus"
            >{{ systemStatus === 'OPEN' ? 'Borsayı Kapat' : 'Borsayı Aç' }}</button>
          </div>
        </div>

        <div class="panel overflow-hidden">
          <div class="panel-head">
            <span>Kayıt Durumu</span>
            <span :class="registrationStatus === 'OPEN' ? 'pill-up' : 'pill-down'">{{ registrationStatus === 'OPEN' ? 'AÇIK' : 'KAPALI' }}</span>
          </div>
          <div class="p-4 flex flex-col gap-3">
            <p class="text-sm text-ink-2">
              {{ registrationStatus === 'OPEN' ? 'Yeni kullanıcılar kayıt olabilir.' : 'Yeni kayıtlar durduruldu.' }}
            </p>
            <button
              class="btn w-full mt-auto"
              :class="registrationStatus === 'OPEN' ? 'btn-sell' : 'btn-buy'"
              @click="toggleRegistrationStatus"
            >{{ registrationStatus === 'OPEN' ? 'Kayıtları Kapat' : 'Kayıtları Aç' }}</button>
          </div>
        </div>
      </div>

      <!-- İstatistikler -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="panel panel-pad">
          <div class="label">Toplam Kullanıcı</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ stats.totalUsers }}</div>
          <div class="text-2xs text-up mt-1">{{ stats.activeUsers }} aktif</div>
        </div>
        <div class="panel panel-pad">
          <div class="label">İşlem Hacmi</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ money(stats.totalVolume, 0) }}</div>
          <div class="text-2xs text-ink-3 mt-1">{{ stats.totalTrades }} işlem</div>
        </div>
        <div class="panel panel-pad">
          <div class="label">Firma</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ stats.companies }}</div>
        </div>
        <div class="panel panel-pad">
          <div class="label">Açık Emir</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ stats.openOrders || 0 }}</div>
        </div>
      </div>

      <!-- Tablolar -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="panel overflow-hidden">
          <div class="panel-head"><span>En Aktif Firmalar</span></div>
          <table class="grid-table">
            <thead><tr><th>Sembol</th><th class="text-right">İşlem</th></tr></thead>
            <tbody>
              <tr v-for="c in stats.topCompanies" :key="c.id">
                <td><span class="font-semibold">{{ c.symbol }}</span> <span class="text-2xs text-ink-3">{{ c.name }}</span></td>
                <td class="col-num">{{ c._count?.trades || 0 }}</td>
              </tr>
              <tr v-if="!stats.topCompanies?.length"><td colspan="2" class="text-center text-ink-3 py-6">Veri yok</td></tr>
            </tbody>
          </table>
        </div>

        <div class="panel overflow-hidden">
          <div class="panel-head"><span>En Aktif Kullanıcılar</span></div>
          <table class="grid-table">
            <thead><tr><th>Kullanıcı</th><th class="text-right">İşlem</th><th class="text-right">Bakiye</th></tr></thead>
            <tbody>
              <tr v-for="u in stats.topUsers" :key="u.id">
                <td><span class="font-semibold">{{ u.name || 'İsimsiz' }}</span><span class="block text-2xs text-ink-3">{{ u.email }}</span></td>
                <td class="col-num">{{ u._count?.orders || 0 }}</td>
                <td class="col-num text-up">{{ money(u.account?.cash || 0, 0) }}</td>
              </tr>
              <tr v-if="!stats.topUsers?.length"><td colspan="3" class="text-center text-ink-3 py-6">Veri yok</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else class="panel p-8 text-center">
      <p class="text-down font-semibold">Veriler yüklenemedi</p>
      <button class="btn mt-3" @click="loadStats">Tekrar Dene</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import AdminNav from '@/components/AdminNav.vue'
import { money } from '@/composables/useFormat'

const loading = ref(true)
const stats = ref<any>(null)
const systemStatus = ref('OPEN')
const registrationStatus = ref('OPEN')
const resumeDate = ref<string | null>(null)
const resumeDateInput = ref('')

const loadStats = async () => {
  try {
    loading.value = true
    const [dashboardData, statusData, regStatusData] = await Promise.all([
      api.get('/admin/dashboard'),
      api.getSystemStatus(),
      api.getRegistrationStatus(),
    ])
    stats.value = dashboardData.data
    systemStatus.value = statusData.status
    resumeDate.value = statusData.resumeDate
    registrationStatus.value = regStatusData.status
  } catch (error: any) {
    console.error('Dashboard yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

const toggleRegistrationStatus = async () => {
  const newStatus = registrationStatus.value === 'OPEN' ? 'CLOSED' : 'OPEN'
  if (!confirm(newStatus === 'CLOSED' ? 'Kayıtları kapatmak istediğinize emin misiniz?' : 'Kayıtları açmak istediğinize emin misiniz?')) return
  try {
    const data = await api.updateRegistrationStatus(newStatus)
    registrationStatus.value = data.status
  } catch (error: any) {
    alert(error.response?.data?.error || 'Durum güncellenemedi')
  }
}

const toggleSystemStatus = async () => {
  const newStatus = systemStatus.value === 'OPEN' ? 'CLOSED' : 'OPEN'
  if (!confirm(newStatus === 'CLOSED' ? 'Borsayı kapatmak istediğinize emin misiniz?' : 'Borsayı açmak istediğinize emin misiniz?')) return
  try {
    let dateToSend = undefined
    if (newStatus === 'CLOSED' && resumeDateInput.value) dateToSend = new Date(resumeDateInput.value).toISOString()
    const data = await api.updateSystemStatus(newStatus, dateToSend)
    systemStatus.value = data.status
    resumeDate.value = data.resumeDate
    if (newStatus === 'OPEN') resumeDateInput.value = ''
  } catch (error: any) {
    alert(error.response?.data?.error || 'Durum güncellenemedi')
  }
}

onMounted(loadStats)
</script>
