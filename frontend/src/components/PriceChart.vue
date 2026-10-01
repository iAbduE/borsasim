<template>
  <div class="panel overflow-hidden">
    <div class="panel-head"><span>Fiyat Grafiği</span><span class="text-ink-3">Son işlemler</span></div>
    <div class="h-[300px] w-full relative p-2">
      <Line v-if="history.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else class="absolute inset-0 flex items-center justify-center text-ink-3 text-sm">
        Henüz işlem verisi yok
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{ history: any[] }>()
const { theme } = useTheme()

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'
}

const trendUp = computed(() => {
  if (props.history.length < 2) return true
  return Number(props.history[props.history.length - 1].price) >= Number(props.history[0].price)
})

const chartData = computed(() => {
  const line = trendUp.value ? cssVar('--c-up') : cssVar('--c-down')
  return {
    labels: props.history.map((h) =>
      new Date(h.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Fiyat',
        borderColor: line,
        borderWidth: 1.75,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: line,
        data: props.history.map((h) => Number(h.price)),
        fill: true,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx
          const g = ctx.createLinearGradient(0, 0, 0, 300)
          const c = trendUp.value ? cssVar('--c-up') : cssVar('--c-down')
          g.addColorStop(0, hexToRgba(c, 0.18))
          g.addColorStop(1, hexToRgba(c, 0))
          return g
        },
        tension: 0.3,
      },
    ],
  }
})

// theme.value'ye bağlı => tema değişince yeniden hesaplanır
const chartOptions = computed(() => {
  void theme.value
  const grid = cssVar('--c-line-soft')
  const tick = cssVar('--c-ink-3')
  const panel = cssVar('--c-elev')
  const ink = cssVar('--c-ink')
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: panel,
        titleColor: tick,
        bodyColor: ink,
        borderColor: grid,
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tick, maxTicksLimit: 6, font: { family: 'monospace' } },
      },
      y: {
        grid: { color: grid },
        border: { display: false },
        ticks: { color: tick, font: { family: 'monospace' }, callback: (v: any) => '₺' + v },
      },
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
  }
})

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return `rgba(120,120,120,${a})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
</script>
