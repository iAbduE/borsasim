<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div class="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">Haberler</h1>
        <p class="text-ink-2 text-sm mt-0.5">Piyasa haberleri ve duyurular</p>
      </div>
      <div class="flex items-center gap-2">
        <select v-model="companyFilter" @change="loadNews" class="input max-w-[240px] py-2">
          <option value="">Tüm Haberler</option>
          <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.symbol }} — {{ c.name }}</option>
        </select>
        <button class="btn py-2" @click="loadNews">Yenile</button>
      </div>
    </div>

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Haberler yükleniyor…</div>

    <div v-else class="flex flex-col gap-2.5">
      <article v-for="item in news" :key="item.id" class="panel panel-pad flex gap-4">
        <div class="shrink-0 w-14 text-center border-r border-line pr-3">
          <div class="num text-2xl font-bold leading-none">{{ day(item.createdAt) }}</div>
          <div class="label mt-1">{{ month(item.createdAt) }}</div>
          <div class="num text-2xs text-ink-3 mt-1">{{ time(item.createdAt) }}</div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span v-if="item.company" class="pill-accent">{{ item.company.symbol }}</span>
            <span v-else class="pill-muted">Genel</span>
            <span v-if="item.sentiment" :class="sentimentPill(item.sentiment)">{{ sentimentLabel(item.sentiment) }}</span>
          </div>
          <h3 class="text-base font-semibold mt-2" style="text-wrap: balance;">{{ item.title }}</h3>
          <p class="text-sm text-ink-2 mt-1.5 leading-relaxed whitespace-pre-wrap">{{ item.content }}</p>
        </div>
      </article>

      <div v-if="!news.length" class="panel p-10 text-center text-ink-2">Henüz haber yok.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const loading = ref(true)
const news = ref<any[]>([])
const companies = ref<any[]>([])
const companyFilter = ref('')

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const day = (d: string) => new Date(d).getDate()
const month = (d: string) => MONTHS[new Date(d).getMonth()]
const time = (d: string) => new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

const sentimentLabel = (s: string) => ({ POS: 'Olumlu', NEG: 'Olumsuz', NEUTRAL: 'Nötr' } as any)[s] || s
const sentimentPill = (s: string) =>
  s === 'POS' ? 'pill-up' : s === 'NEG' ? 'pill-down' : 'pill-muted'

const loadNews = async () => {
  try {
    loading.value = true
    const params: any = {}
    if (companyFilter.value) params.companyId = companyFilter.value
    news.value = await api.getNews(params)
  } catch (error: any) {
    console.error('Haberler yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

const loadCompanies = async () => {
  try { companies.value = await api.getCompanies() } catch (e) { console.error(e) }
}

onMounted(async () => {
  await Promise.all([loadNews(), loadCompanies()])
})
</script>
