<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Firma Yönetimi</h1>
        <p class="text-ink-2 text-sm mt-0.5">Firma ekle, düzenle ve halka arza hazırla</p>
      </div>
      <button class="btn btn-accent" @click="showAddForm = true">+ Yeni Firma</button>
    </div>

    <AdminNav />

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Yükleniyor…</div>

    <div v-else class="panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="grid-table">
          <thead>
            <tr>
              <th>Sembol</th><th>Firma</th><th>Sektör</th>
              <th class="text-right">IPO Aralığı</th><th>Durum</th><th class="text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="company in companies" :key="company.id">
              <td class="font-semibold">{{ company.symbol }}</td>
              <td class="text-ink-2">{{ company.name }}</td>
              <td><span class="pill-muted">{{ company.sector || '—' }}</span></td>
              <td class="col-num text-2xs text-ink-2">
                <span v-if="company.ipoMinPrice && company.ipoMaxPrice">{{ num(company.ipoMinPrice) }}–{{ num(company.ipoMaxPrice) }}</span>
                <span v-else class="text-ink-3">—</span>
              </td>
              <td>
                <span v-if="company.status === 'OPEN' && company.isActive" class="pill-up">Piyasada</span>
                <span v-else-if="company.status === 'IPO'" class="pill-open">IPO'da</span>
                <span v-else class="pill-muted">Bekliyor</span>
              </td>
              <td class="text-right whitespace-nowrap">
                <button class="text-accent-ink text-2xs hover:underline mr-3" @click="editCompany(company)">Düzenle</button>
                <button class="text-down text-2xs hover:underline" @click="deleteCompany(company.id, company.symbol)">Sil</button>
              </td>
            </tr>
            <tr v-if="!companies.length"><td colspan="6" class="text-center text-ink-3 py-8">Henüz firma eklenmemiş</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ekle/düzenle modal -->
    <div v-if="showAddForm || editingCompany" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeForm">
      <div class="panel w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-pop">
        <div class="panel-head"><span>{{ editingCompany ? 'Firma Düzenle' : 'Yeni Firma' }}</span><button class="text-ink-3 hover:text-ink" @click="closeForm">✕</button></div>
        <form @submit.prevent="saveCompany" class="p-4 flex flex-col gap-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label"><span>Sembol</span></label>
              <input v-model="form.symbol" type="text" required maxlength="10" class="input" placeholder="ÖRNEK" />
            </div>
            <div>
              <label class="field-label"><span>Firma Adı</span></label>
              <input v-model="form.name" type="text" required class="input" placeholder="Örnek A.Ş." />
            </div>
          </div>
          <div>
            <label class="field-label"><span>Sektör</span></label>
            <select v-model="form.sector" required class="input">
              <option value="">Seçiniz</option>
              <option>Teknoloji</option><option>Finans</option><option>Sanayi</option>
              <option>Gıda</option><option>Enerji</option><option>İnşaat</option>
              <option>Perakende</option><option>Sağlık</option><option>Diğer</option>
            </select>
          </div>
          <div>
            <label class="field-label"><span>Açıklama</span></label>
            <textarea v-model="form.description" rows="3" class="input" placeholder="Firma hakkında kısa bilgi…"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label"><span>IPO Min Fiyat (₺)</span></label>
              <input v-model.number="form.ipoMinPrice" type="number" step="0.01" min="0.01" required class="input-num" />
            </div>
            <div>
              <label class="field-label"><span>IPO Max Fiyat (₺)</span></label>
              <input v-model.number="form.ipoMaxPrice" type="number" step="0.01" min="0.01" required class="input-num" />
            </div>
            <div>
              <label class="field-label"><span>IPO Hisse Sayısı</span></label>
              <input v-model.number="form.ipoShares" type="number" min="1" required class="input-num" />
            </div>
            <div>
              <label class="field-label"><span>Halka Arz Oranı (%)</span></label>
              <input v-model.number="form.freeFloat" type="number" step="0.01" min="0" max="100" class="input-num" />
            </div>
          </div>
          <p class="text-2xs text-ink-2 bg-panel-2 rounded px-3 py-2">
            Firma eklendikten sonra Halka Arz yönetiminden IPO penceresi açabilirsiniz; tahsis sonrası firma piyasaya açılır.
          </p>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="btn" @click="closeForm">İptal</button>
            <button type="submit" class="btn btn-accent" :disabled="saving">{{ saving ? 'Kaydediliyor…' : 'Kaydet' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import AdminNav from '@/components/AdminNav.vue'
import { num } from '@/composables/useFormat'

interface Company {
  id: string; symbol: string; name: string; sector: string; description?: string
  ipoMinPrice?: number; ipoMaxPrice?: number; ipoShares?: number; freeFloat?: number
  status: string; isActive: boolean
}

const loading = ref(true)
const saving = ref(false)
const companies = ref<Company[]>([])
const showAddForm = ref(false)
const editingCompany = ref<Company | null>(null)

const emptyForm = () => ({ symbol: '', name: '', sector: '', description: '', ipoMinPrice: 10, ipoMaxPrice: 15, ipoShares: 10000, freeFloat: 25 })
const form = ref(emptyForm())

const loadCompanies = async () => {
  try {
    loading.value = true
    const response = await api.get('/admin/companies')
    companies.value = response.data
  } catch (error: any) {
    console.error('Firmalar yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

const editCompany = (company: Company) => {
  editingCompany.value = company
  form.value = {
    symbol: company.symbol, name: company.name, sector: company.sector, description: company.description || '',
    ipoMinPrice: company.ipoMinPrice || 10, ipoMaxPrice: company.ipoMaxPrice || 15,
    ipoShares: company.ipoShares || 10000, freeFloat: company.freeFloat || 25,
  }
}

const closeForm = () => { showAddForm.value = false; editingCompany.value = null; form.value = emptyForm() }

const saveCompany = async () => {
  try {
    saving.value = true
    if (editingCompany.value) await api.put(`/admin/companies/${editingCompany.value.id}`, form.value)
    else await api.post('/admin/companies', form.value)
    closeForm()
    await loadCompanies()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Firma kaydedilemedi')
  } finally {
    saving.value = false
  }
}

const deleteCompany = async (id: string, symbol: string) => {
  const msg = `${symbol} firmasını silmek istediğinize emin misiniz?\n\n` +
    `Tüm pozisyonlar kapatılıp paralar iade edilecek, emirler ve IPO talepleri iptal edilecek. Bu işlem geri alınamaz.`
  if (!confirm(msg)) return
  try {
    await api.delete(`/admin/companies/${id}`)
    await loadCompanies()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Firma silinemedi')
  }
}

onMounted(loadCompanies)
</script>
