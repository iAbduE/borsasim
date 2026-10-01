import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'

export const usePortfolioStore = defineStore('portfolio', () => {
  const summary = ref<any>(null)
  const trades = ref<any[]>([])
  const loading = ref(false)

  async function fetchSummary() {
    loading.value = true
    try {
      summary.value = await api.getPortfolioSummary()
    } finally {
      loading.value = false
    }
  }

  async function fetchTrades(params?: any) {
    loading.value = true
    try {
      trades.value = await api.getMyTrades(params)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    summary.value = null
    trades.value = []
  }

  return {
    summary,
    trades,
    loading,
    fetchSummary,
    fetchTrades,
    reset,
  }
})
