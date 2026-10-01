<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div>
      <h1 class="text-xl font-bold">Halka Arz (IPO)</h1>
      <p class="text-ink-2 text-sm mt-0.5">Halka arz duyuruları ve talepleriniz</p>
    </div>

    <div v-if="loading" class="panel p-10 text-center text-ink-2">IPO verileri yükleniyor…</div>

    <template v-else>
      <!-- Aktif IPO'lar -->
      <div class="panel overflow-hidden">
        <div class="panel-head"><span>Aktif Halka Arzlar</span><span class="text-ink-3">{{ activeIPOs.length }}</span></div>

        <div v-if="activeIPOs.length" class="grid grid-cols-1 md:grid-cols-2 gap-px bg-line-soft">
          <div v-for="ipo in activeIPOs" :key="ipo.id" class="bg-panel p-4 flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded grid place-items-center text-2xs font-bold bg-accent-bg text-accent-ink">
                {{ ipo.company.symbol.slice(0, 2) }}
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold">{{ ipo.company.symbol }}</h3>
                  <span class="pill-muted">{{ ipo.company.sector }}</span>
                </div>
                <p class="text-sm text-ink-2">{{ ipo.company.name }}</p>
              </div>
            </div>

            <dl class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex justify-between bg-panel-2 rounded px-3 py-2">
                <dt class="text-ink-3">Min Fiyat</dt><dd class="num text-up">{{ num(ipo.company.ipoMinPrice) }}</dd>
              </div>
              <div class="flex justify-between bg-panel-2 rounded px-3 py-2">
                <dt class="text-ink-3">Max Fiyat</dt><dd class="num text-down">{{ num(ipo.company.ipoMaxPrice) }}</dd>
              </div>
              <div class="flex justify-between bg-panel-2 rounded px-3 py-2 col-span-2">
                <dt class="text-ink-3">Bitiş</dt><dd class="num text-ink-2">{{ formatDate(ipo.endsAt) }}</dd>
              </div>
            </dl>

            <button class="btn btn-accent w-full" @click="openDemandForm(ipo)">Talep Ver</button>
          </div>
        </div>

        <div v-else class="p-10 text-center text-ink-2">Şu anda aktif halka arz yok.</div>
      </div>

      <!-- Taleplerim -->
      <div class="panel overflow-hidden">
        <div class="panel-head"><span>Taleplerim</span><span class="text-ink-3">{{ myDemands.length }}</span></div>
        <div v-if="myDemands.length" class="overflow-x-auto">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Firma</th>
                <th class="text-right">Talep Fiyatı</th>
                <th class="text-right">Adet</th>
                <th class="text-right">Toplam</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in myDemands" :key="d.id">
                <td>
                  <div class="font-semibold">{{ d.company?.symbol }}</div>
                  <div class="text-2xs text-ink-3">{{ d.company?.name }}</div>
                </td>
                <td class="col-num">{{ money(d.price) }}</td>
                <td class="col-num">{{ d.quantity }}</td>
                <td class="col-num font-semibold">{{ money(d.price * d.quantity) }}</td>
                <td class="num text-2xs text-ink-2">{{ formatDate(d.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="p-8 text-center text-ink-2 text-sm">Henüz talep vermediniz.</div>
      </div>
    </template>

    <!-- Talep formu (modal) -->
    <div
      v-if="demandForm.show"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4"
      @click.self="closeDemandForm"
    >
      <div class="panel w-full max-w-md shadow-pop">
        <div class="panel-head"><span>IPO Talebi</span><button class="text-ink-3 hover:text-ink" @click="closeDemandForm">✕</button></div>
        <div class="p-4 flex flex-col gap-4">
          <div class="flex items-center gap-3 bg-panel-2 rounded p-3">
            <span class="w-10 h-10 rounded grid place-items-center text-2xs font-bold bg-accent-bg text-accent-ink">
              {{ demandForm.ipo?.company.symbol.slice(0, 2) }}
            </span>
            <div>
              <div class="font-semibold">{{ demandForm.ipo?.company.symbol }}</div>
              <div class="text-2xs text-ink-3">{{ demandForm.ipo?.company.name }}</div>
            </div>
          </div>

          <form @submit.prevent="submitDemand" class="flex flex-col gap-3">
            <div>
              <label class="field-label">
                <span>Talep Fiyatı</span>
                <span class="num normal-case tracking-normal text-ink-3">
                  {{ num(demandForm.ipo?.company.ipoMinPrice) }}–{{ num(demandForm.ipo?.company.ipoMaxPrice) }}
                </span>
              </label>
              <input v-model.number="demandForm.price" type="number" step="0.01"
                :min="demandForm.ipo?.company.ipoMinPrice" :max="demandForm.ipo?.company.ipoMaxPrice" required
                class="input-num" placeholder="0,00" />
            </div>
            <div>
              <label class="field-label"><span>Adet</span></label>
              <input v-model.number="demandForm.quantity" type="number" min="1" required class="input-num" placeholder="0" />
            </div>

            <div class="flex justify-between text-sm bg-panel-2 rounded px-3 py-2">
              <span class="text-ink-2">Toplam Tutar</span>
              <span class="num font-semibold">{{ money((demandForm.price || 0) * (demandForm.quantity || 0)) }}</span>
            </div>

            <p class="text-2xs text-warn bg-warn-bg rounded px-3 py-2 leading-relaxed">
              Talep verildiğinde tutar hesabınızdan bloke edilir; tahsis sonucuna göre fazlası iade edilir.
            </p>

            <div class="flex justify-end gap-2 pt-1">
              <button type="button" class="btn" @click="closeDemandForm">İptal</button>
              <button type="submit" class="btn btn-accent" :disabled="demandForm.submitting">
                {{ demandForm.submitting ? 'Gönderiliyor…' : 'Talep Ver' }}
              </button>
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
import { money, num } from '@/composables/useFormat'

const loading = ref(true)
const activeIPOs = ref<any[]>([])
const myDemands = ref<any[]>([])

const demandForm = ref({ show: false, ipo: null as any, price: 0, quantity: 0, submitting: false })

const formatDate = (d: string) =>
  new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const loadData = async () => {
  try {
    loading.value = true
    const [ipos, demands] = await Promise.all([api.getActiveIPOs(), api.getMyIPODemands()])
    activeIPOs.value = ipos
    myDemands.value = demands
  } catch (error: any) {
    console.error('IPO yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

const openDemandForm = (ipo: any) => {
  demandForm.value = { show: true, ipo, price: Number(ipo.company.ipoMinPrice) || 0, quantity: 0, submitting: false }
}
const closeDemandForm = () => {
  demandForm.value = { show: false, ipo: null, price: 0, quantity: 0, submitting: false }
}

const submitDemand = async () => {
  const f = demandForm.value
  if (!f.quantity || f.quantity <= 0) { alert('Lütfen geçerli bir adet girin.'); return }
  if (!f.price || f.price <= 0) { alert('Lütfen geçerli bir fiyat girin.'); return }
  const min = Number(f.ipo.company.ipoMinPrice), max = Number(f.ipo.company.ipoMaxPrice)
  if (f.price < min || f.price > max) { alert(`Fiyat ${min} - ${max} TL arasında olmalıdır.`); return }
  try {
    f.submitting = true
    await api.createIPODemand({
      companyId: f.ipo.company.id,
      price: Number(f.price),
      quantity: Number(f.quantity),
    })
    closeDemandForm()
    await loadData()
  } catch (error: any) {
    const msg = error.response?.data?.error || 'IPO talebi gönderilemedi'
    alert(msg)
  } finally {
    f.submitting = false
  }
}

onMounted(loadData)
</script>
