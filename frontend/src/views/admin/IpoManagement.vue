<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Halka Arz Yönetimi</h1>
        <p class="text-ink-2 text-sm mt-0.5">IPO penceresi aç ve tahsis yap</p>
      </div>
      <button class="btn btn-accent" @click="showCreateModal = true">+ Yeni IPO Penceresi</button>
    </div>

    <AdminNav />

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Yükleniyor…</div>

    <template v-else>
      <!-- Aktif -->
      <div class="panel overflow-hidden">
        <div class="panel-head"><span>Aktif IPO'lar</span><span class="text-ink-3">{{ activeIPOs.length }}</span></div>
        <div v-if="activeIPOs.length" class="grid grid-cols-1 md:grid-cols-2 gap-px bg-line-soft">
          <div v-for="ipo in activeIPOs" :key="ipo.id" class="bg-panel p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded grid place-items-center text-2xs font-bold bg-accent-bg text-accent-ink">{{ ipo.company.symbol.slice(0, 2) }}</span>
                <div>
                  <div class="font-bold">{{ ipo.company.symbol }}</div>
                  <div class="text-2xs text-ink-3">{{ ipo.company.name }}</div>
                </div>
              </div>
              <span class="pill-open">AKTİF</span>
            </div>
            <dl class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex justify-between bg-panel-2 rounded px-3 py-2 col-span-2">
                <dt class="text-ink-3">Fiyat Aralığı</dt><dd class="num">{{ num(ipo.company.ipoMinPrice) }}–{{ num(ipo.company.ipoMaxPrice) }}</dd>
              </div>
              <div class="flex justify-between bg-panel-2 rounded px-3 py-2">
                <dt class="text-ink-3">Talep</dt><dd class="num text-accent-ink">{{ ipo.stats?.totalDemands || 0 }}</dd>
              </div>
              <div class="flex justify-between bg-panel-2 rounded px-3 py-2">
                <dt class="text-ink-3">Bitiş</dt><dd class="num text-2xs">{{ formatDate(ipo.endsAt) }}</dd>
              </div>
            </dl>
            <button class="btn btn-buy w-full" @click="openAllocationModal(ipo)">Tahsis Yap ve Piyasaya Aç</button>
          </div>
        </div>
        <div v-else class="p-8 text-center text-ink-2 text-sm">Aktif IPO yok.</div>
      </div>

      <!-- Tamamlanan -->
      <div v-if="completedIPOs.length" class="panel overflow-hidden">
        <div class="panel-head"><span>Tamamlanan IPO'lar</span></div>
        <table class="grid-table">
          <thead>
            <tr><th>Firma</th><th class="text-right">Tahsis Fiyatı</th><th>Tahsis Tarihi</th><th>Durum</th></tr>
          </thead>
          <tbody>
            <tr v-for="ipo in completedIPOs" :key="ipo.id">
              <td><span class="font-semibold">{{ ipo.company.symbol }}</span> <span class="text-2xs text-ink-3">{{ ipo.company.name }}</span></td>
              <td class="col-num">{{ money(ipo.allocationPrice || 0) }}</td>
              <td class="num text-2xs text-ink-2">{{ formatDate(ipo.allocationDate) }}</td>
              <td><span class="pill-up">Tahsis edildi</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!activeIPOs.length && !completedIPOs.length" class="panel p-10 text-center text-ink-2">
        Henüz IPO penceresi yok.
      </div>
    </template>

    <!-- IPO penceresi oluştur -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showCreateModal = false">
      <div class="panel w-full max-w-md shadow-pop">
        <div class="panel-head"><span>Yeni IPO Penceresi</span><button class="text-ink-3 hover:text-ink" @click="showCreateModal = false">✕</button></div>
        <form @submit.prevent="createIPOWindow" class="p-4 flex flex-col gap-3">
          <div>
            <label class="field-label"><span>Firma</span></label>
            <select v-model="createForm.companyId" required class="input">
              <option value="">Firma seçin…</option>
              <option v-for="c in availableCompanies" :key="c.id" :value="c.id">{{ c.symbol }} — {{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="field-label"><span>Başlangıç</span></label>
            <input v-model="createForm.startsAt" type="datetime-local" required class="input" />
          </div>
          <div>
            <label class="field-label"><span>Bitiş</span></label>
            <input v-model="createForm.endsAt" type="datetime-local" required class="input" />
          </div>
          <p class="text-2xs text-ink-2 bg-panel-2 rounded px-3 py-2">Firmanın Min/Max fiyat bilgileri otomatik kullanılır.</p>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="btn" @click="showCreateModal = false">İptal</button>
            <button type="submit" class="btn btn-accent" :disabled="createSubmitting">{{ createSubmitting ? 'Oluşturuluyor…' : 'Oluştur' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tahsis -->
    <div v-if="showAllocationModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showAllocationModal = false">
      <div class="panel w-full max-w-md shadow-pop">
        <div class="panel-head"><span>IPO Tahsis</span><button class="text-ink-3 hover:text-ink" @click="showAllocationModal = false">✕</button></div>
        <div v-if="allocationIPO" class="p-4 flex flex-col gap-3">
          <div class="flex items-center gap-3 bg-panel-2 rounded p-3">
            <span class="w-10 h-10 rounded grid place-items-center text-2xs font-bold bg-accent-bg text-accent-ink">{{ allocationIPO.company.symbol.slice(0, 2) }}</span>
            <div>
              <div class="font-semibold">{{ allocationIPO.company.symbol }}</div>
              <div class="num text-2xs text-ink-3">{{ allocationIPO.stats?.totalDemands || 0 }} talep · {{ num(allocationIPO.company.ipoMinPrice) }}–{{ num(allocationIPO.company.ipoMaxPrice) }}</div>
            </div>
          </div>
          <form @submit.prevent="performAllocation" class="flex flex-col gap-3">
            <div>
              <label class="field-label"><span>Tahsis Fiyatı (₺)</span></label>
              <input v-model.number="allocationForm.allocationPrice" type="number" step="0.01"
                :min="allocationIPO.company.ipoMinPrice" :max="allocationIPO.company.ipoMaxPrice" required class="input-num" />
            </div>
            <p class="text-2xs text-warn bg-warn-bg rounded px-3 py-2">
              Tahsis sonrası firma otomatik piyasaya açılır ve işlem görmeye başlar. Bu işlem geri alınamaz.
            </p>
            <div class="flex justify-end gap-2 pt-1">
              <button type="button" class="btn" @click="showAllocationModal = false">İptal</button>
              <button type="submit" class="btn btn-buy" :disabled="allocationSubmitting">{{ allocationSubmitting ? 'Tahsis ediliyor…' : 'Tahsis Yap' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import AdminNav from '@/components/AdminNav.vue'
import { money, num } from '@/composables/useFormat'

const loading = ref(true)
const activeIPOs = ref<any[]>([])
const completedIPOs = ref<any[]>([])
const availableCompanies = ref<any[]>([])

const showCreateModal = ref(false)
const createForm = ref({ companyId: '', startsAt: '', endsAt: '' })
const createSubmitting = ref(false)

const showAllocationModal = ref(false)
const allocationIPO = ref<any>(null)
const allocationForm = ref({ allocationPrice: 0 })
const allocationSubmitting = ref(false)

const formatDate = (d: string) =>
  !d ? '—' : new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const loadData = async () => {
  try {
    loading.value = true
    const response = await api.get('/admin/ipo')
    const allIPOs = response.data
    const now = new Date()
    activeIPOs.value = []
    completedIPOs.value = []
    for (const ipo of allIPOs) {
      if (!ipo.isAllocated && new Date(ipo.endsAt) >= now) {
        try { const stats = await api.getIPO(ipo.companyId); ipo.stats = stats.stats }
        catch { ipo.stats = { totalDemands: 0, totalQuantity: 0, totalValue: 0 } }
        activeIPOs.value.push(ipo)
      } else if (ipo.isAllocated) {
        completedIPOs.value.push(ipo)
      }
    }
    const companiesResponse = await api.get('/admin/companies')
    availableCompanies.value = companiesResponse.data.filter((c: any) => c.status === 'INACTIVE' || c.status === 'IPO')
  } catch (error: any) {
    console.error('IPO verileri yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

const createIPOWindow = async () => {
  try {
    createSubmitting.value = true
    await api.createIPOWindow({
      companyId: createForm.value.companyId,
      startsAt: new Date(createForm.value.startsAt).toISOString(),
      endsAt: new Date(createForm.value.endsAt).toISOString(),
    })
    showCreateModal.value = false
    createForm.value = { companyId: '', startsAt: '', endsAt: '' }
    await loadData()
  } catch (error: any) {
    alert(error.response?.data?.error || 'IPO penceresi oluşturulamadı')
  } finally {
    createSubmitting.value = false
  }
}

const openAllocationModal = (ipo: any) => {
  allocationIPO.value = ipo
  allocationForm.value.allocationPrice = Number(ipo.company.ipoMaxPrice || 0)
  showAllocationModal.value = true
}

const performAllocation = async () => {
  if (!allocationIPO.value) return
  if (!confirm(`${allocationIPO.value.company.symbol} için ${money(allocationForm.value.allocationPrice)} fiyatından tahsis yapılacak ve firma piyasaya açılacak. Onaylıyor musunuz?`)) return
  try {
    allocationSubmitting.value = true
    const result = await api.allocateIPO(allocationIPO.value.companyId, allocationForm.value.allocationPrice)
    alert(`Tahsis tamam — ${result.company} @ ${money(result.allocationPrice)} · ${result.totalDemands} talep · oran %${(parseFloat(result.allocationRatio) * 100).toFixed(2)}`)
    showAllocationModal.value = false
    allocationIPO.value = null
    await loadData()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Tahsis işlemi başarısız')
  } finally {
    allocationSubmitting.value = false
  }
}

onMounted(loadData)
</script>
