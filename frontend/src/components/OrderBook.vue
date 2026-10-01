<template>
  <div class="panel overflow-hidden">
    <div class="panel-head"><span>Emir Defteri</span><span class="text-ink-3">Derinlik</span></div>

    <div class="grid grid-cols-2">
      <!-- Alış (bids) -->
      <div class="border-r border-line-soft">
        <div class="grid grid-cols-2 px-3 py-1.5 label"><span>Fiyat</span><span class="text-right">Adet</span></div>
        <div v-if="!bids.length" class="text-2xs text-ink-3 text-center py-5">Alış emri yok</div>
        <div
          v-for="(b, i) in bids.slice(0, 9)"
          :key="i"
          class="relative grid grid-cols-2 px-3 py-1 num text-xs"
        >
          <span class="absolute inset-y-0 right-0 bg-up-bg" :style="{ width: depth(b) + '%' }"></span>
          <span class="relative text-up">{{ num(b.price) }}</span>
          <span class="relative text-right text-ink-2">{{ qty(b) }}</span>
        </div>
      </div>

      <!-- Satış (asks) -->
      <div>
        <div class="grid grid-cols-2 px-3 py-1.5 label"><span>Fiyat</span><span class="text-right">Adet</span></div>
        <div v-if="!asks.length" class="text-2xs text-ink-3 text-center py-5">Satış emri yok</div>
        <div
          v-for="(a, i) in asks.slice(0, 9)"
          :key="i"
          class="relative grid grid-cols-2 px-3 py-1 num text-xs"
        >
          <span class="absolute inset-y-0 right-0 bg-down-bg" :style="{ width: depth(a) + '%' }"></span>
          <span class="relative text-down">{{ num(a.price) }}</span>
          <span class="relative text-right text-ink-2">{{ qty(a) }}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-center gap-2 py-1.5 border-t border-line-soft num text-xs text-ink-2">
      <span>Fark</span>
      <b class="text-ink">{{ spread !== null ? num(spread) : '—' }}</b>
      <span v-if="spreadPct !== null" class="text-ink-3">({{ num(spreadPct) }}%)</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { num } from '@/composables/useFormat'

const props = defineProps<{ bids: any[]; asks: any[] }>()

const qty = (o: any) => Number(o.quantity ?? o.qty ?? 0)

const maxVolume = computed(() => {
  const mb = Math.max(...props.bids.map(qty), 0)
  const ma = Math.max(...props.asks.map(qty), 0)
  return Math.max(mb, ma, 1)
})
const depth = (o: any) => (qty(o) / maxVolume.value) * 100

const bestBid = computed(() => (props.bids.length ? Number(props.bids[0].price) : null))
const bestAsk = computed(() => (props.asks.length ? Number(props.asks[0].price) : null))
const spread = computed(() =>
  bestBid.value !== null && bestAsk.value !== null ? bestAsk.value - bestBid.value : null
)
const spreadPct = computed(() =>
  spread.value !== null && bestBid.value ? (spread.value / bestBid.value) * 100 : null
)
</script>
