<template>
  <div v-if="activeAd" class="w-full animate-fade-in">
    <a
      :href="activeAd.link || '#'"
      :target="activeAd.link ? '_blank' : '_self'"
      rel="noopener noreferrer"
      class="block relative rounded overflow-hidden border border-line group"
    >
      <img
        :src="activeAd.imageUrl"
        :alt="activeAd.title"
        class="w-full h-auto object-cover"
        :class="location === 'SIDEBAR' ? 'max-h-[600px]' : 'max-h-32 sm:max-h-44'"
      />
      <span class="absolute top-2 right-2 bg-black/50 px-2 py-0.5 rounded text-2xs text-white/80 tracking-wide">
        REKLAM
      </span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/services/api'

const props = defineProps<{ location: string }>()

const ads = ref<any[]>([])
const activeAd = ref<any>(null)
let interval: any

const loadAds = async () => {
  try {
    const data = await api.getPublicAds(props.location)
    ads.value = data
    if (ads.value.length > 0) {
      activeAd.value = ads.value[0]
      startRotation()
    }
  } catch (error) {
    console.error('Reklamlar yüklenemedi')
  }
}

const startRotation = () => {
  if (ads.value.length <= 1) return
  let index = 0
  interval = setInterval(() => {
    index = (index + 1) % ads.value.length
    activeAd.value = ads.value[index]
  }, 5000)
}

onMounted(loadAds)
onUnmounted(() => { if (interval) clearInterval(interval) })
</script>
