<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div>
      <h1 class="text-xl font-bold">Portföyüm</h1>
      <p class="text-ink-2 text-sm mt-0.5">Pozisyonların, açık emirlerin ve gerçekleşen işlemlerin</p>
    </div>

    <div v-if="loading" class="panel p-10 text-center text-ink-2">Portföy yükleniyor…</div>

    <template v-else-if="summary">
      <!-- Özet -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="panel panel-pad">
          <div class="label">Nakit</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ money(summary.cash) }}</div>
        </div>
        <div class="panel panel-pad">
          <div class="label">Hisse Değeri</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ money(summary.totalMarketValue) }}</div>
        </div>
        <div class="panel panel-pad">
          <div class="label">Toplam Değer</div>
          <div class="num text-2xl font-semibold mt-1.5">{{ money(summary.totalValue) }}</div>
        </div>
        <div class="panel panel-pad">
          <div class="label">Toplam K/Z</div>
          <div class="num text-2xl font-semibold mt-1.5" :class="plClass(summary.totalPL)">{{ money(summary.totalPL) }}</div>
          <div class="num text-sm mt-1" :class="plClass(summary.totalPL)">{{ pct(summary.totalPLPct) }}</div>
        </div>
      </div>

      <!-- Pozisyonlar -->
      <div class="panel overflow-hidden">
        <div class="panel-head"><span>Pozisyonlar</span><span class="text-ink-3">{{ summary.positions.length }}</span></div>
        <div v-if="summary.positions.length" class="overflow-x-auto">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Sembol</th><th>Firma</th>
                <th class="text-right">Adet</th><th class="text-right">Ort. Maliyet</th>
                <th class="text-right">Güncel</th><th class="text-right">Değer</th>
                <th class="text-right">K/Z</th><th class="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pos in summary.positions" :key="pos.id">
                <td class="font-semibold">{{ pos.symbol }}</td>
                <td class="text-ink-2">{{ pos.name }}</td>
                <td class="col-num">{{ pos.quantity }}</td>
                <td class="col-num text-ink-2">{{ money(pos.avgPrice) }}</td>
                <td class="col-num">{{ money(pos.currentPrice) }}</td>
                <td class="col-num">{{ money(pos.marketValue) }}</td>
                <td class="col-num" :class="plClass(pos.unrealizedPL)">{{ money(pos.unrealizedPL) }}</td>
                <td class="col-num" :class="plClass(pos.unrealizedPL)">{{ pct(pos.unrealizedPLPct) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="p-8 text-center text-ink-2 text-sm">Henüz pozisyonun yok.</div>
      </div>

      <!-- Açık emirler -->
      <div class="panel overflow-hidden">
        <div class="panel-head">
          <span>Açık Emirler</span>
          <button class="text-ink-3 hover:text-ink text-2xs" @click="loadOrders">Yenile</button>
        </div>
        <div v-if="orders.length" class="overflow-x-auto">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Sembol</th><th>Yön</th>
                <th class="text-right">Fiyat</th><th class="text-right">Adet</th><th class="text-right">Kalan</th>
                <th>Durum</th><th>Tarih</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id">
                <td class="font-semibold">{{ order.company?.symbol }}</td>
                <td><span :class="order.side === 'BUY' ? 'pill-up' : 'pill-down'">{{ order.side === 'BUY' ? 'AL' : 'SAT' }}</span></td>
                <td class="col-num">{{ order.price ? money(order.price) : 'Piyasa' }}</td>
                <td class="col-num">{{ order.qty }}</td>
                <td class="col-num text-ink-2">{{ order.remaining }}</td>
                <td><span :class="statusPill(order.status)">{{ statusLabel(order.status) }}</span></td>
                <td class="num text-2xs text-ink-2">{{ formatDate(order.createdAt) }}</td>
                <td class="text-right">
                  <button
                    v-if="order.status === 'OPEN' || order.status === 'PARTIAL'"
                    class="text-down text-2xs hover:underline"
                    @click="cancelOrder(order.id)"
                  >İptal</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="p-8 text-center text-ink-2 text-sm">Açık emrin yok.</div>
      </div>

      <!-- İşlemler -->
      <div class="panel overflow-hidden">
        <div class="panel-head">
          <span>Gerçekleşen İşlemler</span>
          <button class="text-ink-3 hover:text-ink text-2xs" @click="loadTrades">Yenile</button>
        </div>
        <div v-if="trades.length" class="overflow-x-auto">
          <table class="grid-table">
            <thead>
              <tr>
                <th>Sembol</th><th>Yön</th>
                <th class="text-right">Fiyat</th><th class="text-right">Adet</th><th class="text-right">Tutar</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trade in trades" :key="trade.id">
                <td class="font-semibold">{{ trade.company?.symbol }}</td>
                <td><span :class="trade.side === 'BUY' ? 'pill-up' : 'pill-down'">{{ trade.side === 'BUY' ? 'AL' : 'SAT' }}</span></td>
                <td class="col-num">{{ money(trade.price) }}</td>
                <td class="col-num">{{ trade.qty }}</td>
                <td class="col-num">{{ money(trade.value) }}</td>
                <td class="num text-2xs text-ink-2">{{ formatDate(trade.executedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="p-8 text-center text-ink-2 text-sm">Henüz işlem yok.</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { money, pct } from '@/composables/useFormat'

const loading = ref(true)
const summary = ref<any>(null)
const orders = ref<any[]>([])
const trades = ref<any[]>([])

const plClass = (v: number) => (Number(v) >= 0 ? 'text-up' : 'text-down')

const statusLabel = (s: string) =>
  ({ OPEN: 'Açık', PARTIAL: 'Kısmi', FILLED: 'Doldu', CANCELLED: 'İptal' } as any)[s] || s
const statusPill = (s: string) =>
  s === 'FILLED' ? 'pill-up' : s === 'CANCELLED' ? 'pill-muted' : s === 'PARTIAL' ? 'pill-accent' : 'pill-open'

const formatDate = (d: string) =>
  new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const loadSummary = async () => {
  try { summary.value = await api.getPortfolioSummary() } catch (e) { console.error(e) }
}
const loadOrders = async () => {
  try { orders.value = await api.getMyOrders({ status: 'OPEN,PARTIAL' }) } catch (e) { console.error(e) }
}
const loadTrades = async () => {
  try { trades.value = await api.getMyTrades({ limit: 30 }) } catch (e) { console.error(e) }
}

const cancelOrder = async (id: string) => {
  if (!confirm('Bu emri iptal etmek istediğinize emin misiniz?')) return
  try {
    await api.cancelOrder(id)
    await Promise.all([loadOrders(), loadSummary()])
  } catch (error: any) {
    alert(error.response?.data?.error || 'Emir iptal edilemedi')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadSummary(), loadOrders(), loadTrades()])
  } finally {
    loading.value = false
  }
})
</script>
