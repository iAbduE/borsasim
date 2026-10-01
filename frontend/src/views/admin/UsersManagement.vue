<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div>
      <h1 class="text-xl font-bold">Kullanıcı Yönetimi</h1>
      <p class="text-ink-2 text-sm mt-0.5">Üyeler, bakiye işlemleri ve detaylar</p>
    </div>

    <AdminNav />

    <div class="flex gap-2 flex-wrap">
      <input v-model="searchQuery" type="search" class="input flex-1 min-w-[200px] py-2" placeholder="E-posta veya isim ara…" />
      <select v-model="roleFilter" class="input max-w-[180px] py-2">
        <option value="">Tüm Roller</option>
        <option value="ADMIN">Yönetici</option>
        <option value="STUDENT">Öğrenci</option>
      </select>
    </div>

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Yükleniyor…</div>

    <div v-else class="panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="grid-table">
          <thead>
            <tr>
              <th>E-posta</th><th>İsim</th><th>Rol</th>
              <th class="text-right">Bakiye</th><th class="text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.email }}</td>
              <td class="text-ink-2">{{ user.name || 'İsimsiz' }}</td>
              <td><span :class="user.role === 'ADMIN' ? 'pill-down' : 'pill-accent'">{{ user.role === 'ADMIN' ? 'Yönetici' : 'Öğrenci' }}</span></td>
              <td class="col-num">{{ money(user.account?.cash || 0) }}</td>
              <td class="text-right whitespace-nowrap">
                <button class="text-up text-2xs hover:underline mr-3" @click="openCashModal(user)">Bakiye</button>
                <button class="text-accent-ink text-2xs hover:underline" @click="viewUserDetails(user)">Detay</button>
              </td>
            </tr>
            <tr v-if="!filteredUsers.length"><td colspan="5" class="text-center text-ink-3 py-8">Kullanıcı bulunamadı</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bakiye modal -->
    <div v-if="cashModal.show" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeCashModal">
      <div class="panel w-full max-w-md shadow-pop">
        <div class="panel-head"><span>Bakiye İşlemi</span><button class="text-ink-3 hover:text-ink" @click="closeCashModal">✕</button></div>
        <div class="p-4 flex flex-col gap-3">
          <div class="bg-panel-2 rounded p-3 text-sm">
            <div class="text-ink-2">{{ cashModal.user?.email }}</div>
            <div class="num mt-1">Mevcut: <b>{{ money(cashModal.user?.account?.cash || 0) }}</b></div>
          </div>
          <form @submit.prevent="updateCash" class="flex flex-col gap-3">
            <div>
              <label class="field-label"><span>İşlem Tipi</span></label>
              <select v-model="cashModal.type" class="input">
                <option value="ADD">Para Ekle (+)</option>
                <option value="REMOVE">Para Çıkar (−)</option>
              </select>
            </div>
            <div>
              <label class="field-label"><span>Tutar (₺)</span></label>
              <input v-model.number="cashModal.amount" type="number" step="0.01" min="0.01" required class="input-num" placeholder="0,00" />
            </div>
            <div>
              <label class="field-label"><span>Açıklama</span><span class="normal-case tracking-normal text-ink-3">opsiyonel</span></label>
              <textarea v-model="cashModal.reason" rows="2" class="input" placeholder="İşlem nedeni…"></textarea>
            </div>
            <div v-if="cashModal.amount > 0" class="text-sm bg-panel-2 rounded px-3 py-2 flex justify-between">
              <span class="text-ink-2">Yeni Bakiye</span>
              <span class="num font-semibold">{{ money((cashModal.user?.account?.cash || 0) + (cashModal.type === 'ADD' ? cashModal.amount : -cashModal.amount)) }}</span>
            </div>
            <div class="flex justify-end gap-2 pt-1">
              <button type="button" class="btn" @click="closeCashModal">İptal</button>
              <button type="submit" class="btn btn-accent" :disabled="cashModal.saving">{{ cashModal.saving ? 'İşleniyor…' : 'Onayla' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Detay modal -->
    <div v-if="detailModal.show" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeDetailModal">
      <div class="panel w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-pop">
        <div class="panel-head"><span>Kullanıcı Detayı</span><button class="text-ink-3 hover:text-ink" @click="closeDetailModal">✕</button></div>
        <div v-if="detailModal.user" class="p-4 flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><div class="label">E-posta</div><div>{{ detailModal.user.email }}</div></div>
            <div><div class="label">İsim</div><div>{{ detailModal.user.name || 'İsimsiz' }}</div></div>
            <div><div class="label">Rol</div><div>{{ detailModal.user.role === 'ADMIN' ? 'Yönetici' : 'Öğrenci' }}</div></div>
            <div><div class="label">Kayıt</div><div class="num">{{ new Date(detailModal.user.createdAt).toLocaleDateString('tr-TR') }}</div></div>
            <div><div class="label">Nakit</div><div class="num text-up font-semibold">{{ money(detailModal.user.account?.cash || 0) }}</div></div>
            <div><div class="label">Toplam Değer</div><div class="num font-semibold">{{ money(detailModal.user.account?.totalValue || 0) }}</div></div>
          </div>
          <div v-if="detailModal.user.account?.positions?.length">
            <div class="label mb-2">Pozisyonlar</div>
            <table class="grid-table">
              <thead><tr><th>Sembol</th><th class="text-right">Adet</th><th class="text-right">Ort. Maliyet</th></tr></thead>
              <tbody>
                <tr v-for="p in detailModal.user.account.positions" :key="p.id">
                  <td class="font-semibold">{{ p.company?.symbol || '—' }}</td>
                  <td class="col-num">{{ p.quantity }}</td>
                  <td class="col-num">{{ money(p.averageCost) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end"><button class="btn" @click="closeDetailModal">Kapat</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import AdminNav from '@/components/AdminNav.vue'
import { money } from '@/composables/useFormat'

interface User {
  id: string; email: string; name?: string; role: 'ADMIN' | 'STUDENT'
  createdAt: string; account?: { cash: number; totalValue: number; positions?: any[] }
}

const loading = ref(true)
const users = ref<User[]>([])
const searchQuery = ref('')
const roleFilter = ref('')

const cashModal = ref({ show: false, user: null as User | null, type: 'ADD', amount: 0, reason: '', saving: false })
const detailModal = ref({ show: false, user: null as User | null })

const filteredUsers = computed(() => {
  let result = users.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((u) => u.email.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q)))
  }
  if (roleFilter.value) result = result.filter((u) => u.role === roleFilter.value)
  return result
})

const loadUsers = async () => {
  try {
    loading.value = true
    const response = await api.get('/admin/users')
    users.value = response.data
  } catch (error: any) {
    console.error('Kullanıcılar yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

const openCashModal = (user: User) => {
  cashModal.value = { show: true, user, type: 'ADD', amount: 0, reason: '', saving: false }
}
const closeCashModal = () => {
  cashModal.value = { show: false, user: null, type: 'ADD', amount: 0, reason: '', saving: false }
}

const updateCash = async () => {
  try {
    cashModal.value.saving = true
    const amount = cashModal.value.type === 'ADD' ? cashModal.value.amount : -cashModal.value.amount
    await api.post(`/admin/users/${cashModal.value.user?.id}/cash`, { amount, reason: cashModal.value.reason || undefined })
    closeCashModal()
    await loadUsers()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Bakiye güncellenemedi')
  } finally {
    cashModal.value.saving = false
  }
}

const viewUserDetails = async (user: User) => {
  try {
    const response = await api.get(`/admin/users/${user.id}`)
    detailModal.value = { show: true, user: response.data }
  } catch (error: any) {
    alert(error.response?.data?.error || 'Detay yüklenemedi')
  }
}
const closeDetailModal = () => { detailModal.value = { show: false, user: null } }

onMounted(loadUsers)
</script>
