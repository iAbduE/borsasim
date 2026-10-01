<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Reklam Yönetimi</h1>
        <p class="text-ink-2 text-sm mt-0.5">Banner reklamları ekle ve yönet</p>
      </div>
      <button class="btn btn-accent" @click="openModal()">+ Yeni Reklam</button>
    </div>

    <AdminNav />

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Yükleniyor…</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div v-for="ad in ads" :key="ad.id" class="panel overflow-hidden">
        <div class="relative h-40 bg-panel-2">
          <img :src="ad.imageUrl" :alt="ad.title" class="w-full h-full object-cover" />
          <span class="absolute top-2 right-2" :class="ad.isActive ? 'pill-up' : 'pill-down'">{{ ad.isActive ? 'AKTİF' : 'PASİF' }}</span>
          <span class="absolute bottom-2 left-2 pill-muted bg-black/50 text-white">{{ ad.location }}</span>
        </div>
        <div class="p-3">
          <h3 class="font-semibold truncate">{{ ad.title }}</h3>
          <p class="text-2xs text-ink-3 truncate mb-3">{{ ad.link || 'Link yok' }}</p>
          <div class="flex gap-2">
            <button class="btn flex-1 py-1.5 text-2xs" :class="ad.isActive ? 'text-down' : 'text-up'" @click="toggleStatus(ad)">
              {{ ad.isActive ? 'Pasife Al' : 'Aktifleştir' }}
            </button>
            <button class="btn py-1.5 px-3 text-2xs" @click="openModal(ad)">Düzenle</button>
            <button class="btn py-1.5 px-3 text-2xs text-down" @click="deleteAd(ad.id)">Sil</button>
          </div>
        </div>
      </div>
      <div v-if="!ads.length" class="panel p-10 text-center text-ink-2 col-span-full">Henüz reklam yok.</div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showModal = false">
      <div class="panel w-full max-w-md max-h-[90vh] overflow-y-auto shadow-pop">
        <div class="panel-head"><span>{{ editingAd ? 'Reklam Düzenle' : 'Yeni Reklam' }}</span><button class="text-ink-3 hover:text-ink" @click="showModal = false">✕</button></div>
        <form @submit.prevent="saveAd" class="p-4 flex flex-col gap-3">
          <div>
            <label class="field-label"><span>Başlık</span></label>
            <input v-model="form.title" type="text" required class="input" />
          </div>
          <div>
            <label class="field-label"><span>Konum</span></label>
            <select v-model="form.location" class="input">
              <option value="HOME_TOP">Ana Sayfa (Üst)</option>
              <option value="SIDEBAR">Yan Menü</option>
              <option value="FOOTER">Footer</option>
            </select>
          </div>
          <div>
            <label class="field-label"><span>Görsel</span></label>
            <div class="flex gap-1.5 mb-2">
              <button type="button" class="seg-btn" :class="{ on: uploadMode === 'file' }" @click="uploadMode = 'file'">Dosya Yükle</button>
              <button type="button" class="seg-btn" :class="{ on: uploadMode === 'url' }" @click="uploadMode = 'url'">URL Gir</button>
            </div>
            <input v-if="uploadMode === 'url'" v-model="form.imageUrl" type="url" placeholder="https://…" class="input" />
            <input v-else type="file" accept="image/*" class="input" @change="handleFileUpload" />
            <div v-if="form.imageUrl" class="mt-2 h-28 bg-panel-2 rounded overflow-hidden border border-line">
              <img :src="form.imageUrl" class="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <label class="field-label"><span>Link</span><span class="normal-case tracking-normal text-ink-3">opsiyonel</span></label>
            <input v-model="form.link" type="url" placeholder="https://…" class="input" />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.isActive" type="checkbox" class="w-4 h-4 accent-[var(--c-accent)]" />
            <span>Aktif</span>
          </label>
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="btn" @click="showModal = false">İptal</button>
            <button type="submit" class="btn btn-accent" :disabled="submitting">{{ submitting ? 'Kaydediliyor…' : 'Kaydet' }}</button>
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

const loading = ref(true)
const ads = ref<any[]>([])
const showModal = ref(false)
const editingAd = ref<any>(null)
const submitting = ref(false)
const uploadMode = ref<'file' | 'url'>('file')

const emptyForm = () => ({ title: '', imageUrl: '', link: '', location: 'HOME_TOP', isActive: true })
const form = ref(emptyForm())

const loadAds = async () => {
  try {
    loading.value = true
    ads.value = await api.getAdminAds()
  } catch (error) {
    console.error('Reklamlar yüklenemedi', error)
  } finally {
    loading.value = false
  }
}

const openModal = (ad?: any) => {
  if (ad) {
    editingAd.value = ad
    form.value = { ...ad }
    uploadMode.value = ad.imageUrl?.startsWith('data:') ? 'file' : 'url'
  } else {
    editingAd.value = null
    form.value = emptyForm()
    uploadMode.value = 'file'
  }
  showModal.value = true
}

const handleFileUpload = (event: any) => {
  const file = event.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { alert("Dosya boyutu 5MB'dan küçük olmalıdır."); return }
  const reader = new FileReader()
  reader.onload = (e: any) => { form.value.imageUrl = e.target.result }
  reader.readAsDataURL(file)
}

const saveAd = async () => {
  if (!form.value.imageUrl) { alert('Lütfen bir görsel seçin veya URL girin.'); return }
  try {
    submitting.value = true
    if (editingAd.value) await api.updateAd(editingAd.value.id, form.value)
    else await api.createAd(form.value)
    showModal.value = false
    await loadAds()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Kaydedilemedi')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (ad: any) => {
  try {
    await api.updateAd(ad.id, { ...ad, isActive: !ad.isActive })
    await loadAds()
  } catch {
    alert('Durum güncellenemedi')
  }
}

const deleteAd = async (id: string) => {
  if (!confirm('Bu reklamı silmek istediğinize emin misiniz?')) return
  try {
    await api.deleteAd(id)
    await loadAds()
  } catch {
    alert('Silinemedi')
  }
}

onMounted(loadAds)
</script>
