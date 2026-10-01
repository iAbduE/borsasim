<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Haber Yönetimi</h1>
        <p class="text-ink-2 text-sm mt-0.5">Haber yayınla ve yönet</p>
      </div>
      <button class="btn btn-accent" @click="showAddForm = true">+ Yeni Haber</button>
    </div>

    <AdminNav />

    <select v-model="companyFilter" class="input max-w-[280px] py-2">
      <option value="">Tüm Firmalar</option>
      <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.symbol }} — {{ c.name }}</option>
    </select>

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Yükleniyor…</div>

    <div v-else class="flex flex-col gap-2.5">
      <div v-for="item in filteredNews" :key="item.id" class="panel panel-pad flex justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span v-if="item.company" class="pill-accent">{{ item.company.symbol }}</span>
            <span v-else class="pill-muted">Genel</span>
            <span class="num text-2xs text-ink-3">{{ formatDate(item.createdAt) }}</span>
          </div>
          <h3 class="font-semibold">{{ item.title }}</h3>
          <p class="text-sm text-ink-2 mt-1 whitespace-pre-wrap">{{ item.content }}</p>
        </div>
        <button class="text-down text-2xs hover:underline shrink-0" @click="deleteNews(item.id)">Sil</button>
      </div>
      <div v-if="!filteredNews.length" class="panel p-10 text-center text-ink-2">Henüz haber eklenmemiş.</div>
    </div>

    <!-- Haber ekle modal -->
    <div v-if="showAddForm" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeForm">
      <div class="panel w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-pop">
        <div class="panel-head"><span>Yeni Haber</span><button class="text-ink-3 hover:text-ink" @click="closeForm">✕</button></div>
        <form @submit.prevent="saveNews" class="p-4 flex flex-col gap-3">
          <div>
            <label class="field-label"><span>Firma</span><span class="normal-case tracking-normal text-ink-3">opsiyonel</span></label>
            <select v-model="form.companyId" class="input">
              <option value="">Genel Haber</option>
              <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.symbol }} — {{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="field-label"><span>Başlık</span></label>
            <input v-model="form.title" type="text" required class="input" placeholder="Haber başlığı…" />
          </div>
          <div>
            <label class="field-label"><span>İçerik</span><span class="num normal-case tracking-normal text-ink-3">{{ form.content.length }}</span></label>
            <textarea v-model="form.content" rows="6" required class="input" placeholder="Haber içeriği…"></textarea>
          </div>
          <p class="text-2xs text-warn bg-warn-bg rounded px-3 py-2">
            Haber yayınlandığında tüm kullanıcılara anlık olarak iletilir.
          </p>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="btn" @click="closeForm">İptal</button>
            <button type="submit" class="btn btn-accent" :disabled="saving">{{ saving ? 'Yayınlanıyor…' : 'Yayınla' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import AdminNav from '@/components/AdminNav.vue'

interface Company { id: string; symbol: string; name: string }
interface News { id: string; title: string; content: string; companyId?: string; company?: Company; createdAt: string }

const loading = ref(true)
const saving = ref(false)
const news = ref<News[]>([])
const companies = ref<Company[]>([])
const showAddForm = ref(false)
const companyFilter = ref('')
const form = ref({ title: '', content: '', companyId: '' })

const filteredNews = computed(() =>
  !companyFilter.value ? news.value : news.value.filter((n) => n.companyId === companyFilter.value)
)

const formatDate = (d: string) =>
  new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const loadNews = async () => {
  try {
    loading.value = true
    const response = await api.get('/news')
    news.value = response.data
  } catch (error: any) {
    console.error('Haberler yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}
const loadCompanies = async () => {
  try { const r = await api.get('/companies'); companies.value = r.data } catch (e) { console.error(e) }
}

const closeForm = () => { showAddForm.value = false; form.value = { title: '', content: '', companyId: '' } }

const saveNews = async () => {
  try {
    saving.value = true
    const payload: any = { title: form.value.title, content: form.value.content }
    if (form.value.companyId) payload.companyId = form.value.companyId
    await api.post('/admin/news', payload)
    closeForm()
    await loadNews()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Haber yayınlanamadı')
  } finally {
    saving.value = false
  }
}

const deleteNews = async (id: string) => {
  if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/admin/news/${id}`)
    await loadNews()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Haber silinemedi')
  }
}

onMounted(async () => {
  await Promise.all([loadNews(), loadCompanies()])
})
</script>
