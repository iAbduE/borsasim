<template>
  <div class="flex flex-col gap-4 animate-fade-in">
    <div v-if="loading" class="panel p-10 text-center text-ink-2">Firma bilgileri yükleniyor…</div>

    <div v-else-if="!company" class="panel p-10 text-center">
      <p class="text-down font-semibold">Firma bulunamadı</p>
      <router-link to="/markets" class="btn mt-4">Piyasalara dön</router-link>
    </div>

    <template v-else>
      <!-- Enstrüman başlığı -->
      <div class="panel">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
          <div class="flex items-center gap-3">
            <span class="w-11 h-11 rounded grid place-items-center text-sm font-bold bg-accent-bg text-accent-ink">
              {{ company.symbol.slice(0, 2) }}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold tracking-wide">{{ company.symbol }}</h1>
                <span class="pill-muted">{{ company.sector || '—' }}</span>
              </div>
              <p class="text-sm text-ink-2">{{ company.name }}</p>
            </div>
          </div>

          <div class="ml-auto text-right">
            <div class="num text-3xl font-bold leading-none" :class="changeClass">{{ num(lastPrice) }}</div>
            <div class="num text-sm mt-1" :class="changeClass">
              {{ pct(company.change) }}
            </div>
          </div>

          <div class="w-full sm:w-auto flex gap-6 sm:border-l border-line sm:pl-6">
            <div><div class="label">Açılış</div><div class="num text-sm mt-0.5">{{ num(company.openPrice) }}</div></div>
            <div><div class="label">Yüksek</div><div class="num text-sm mt-0.5 text-up">{{ num(company.highPrice) }}</div></div>
            <div><div class="label">Düşük</div><div class="num text-sm mt-0.5 text-down">{{ num(company.lowPrice) }}</div></div>
          </div>
        </div>
        <p v-if="company.description" class="px-4 pb-4 text-sm text-ink-2 leading-relaxed">
          {{ company.description }}
        </p>
      </div>

      <!-- Grafik + Defter + Emir formu -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 flex flex-col gap-4">
          <PriceChart :history="priceHistory" />
          <OrderBook :bids="orderBook.bids" :asks="orderBook.asks" />
        </div>

        <div class="flex flex-col gap-4">
          <!-- Emir formu -->
          <div class="panel overflow-hidden">
            <div class="panel-head"><span>Emir</span><span class="text-ink-3">{{ company.symbol }}</span></div>

            <div class="p-3 grid grid-cols-2 gap-2">
              <button class="seg-btn buy" :class="{ on: side === 'BUY' }" @click="side = 'BUY'">AL</button>
              <button class="seg-btn sell" :class="{ on: side === 'SELL' }" @click="side = 'SELL'">SAT</button>
            </div>

            <div class="px-3 pb-3 flex flex-col gap-3">
              <div class="flex gap-1.5">
                <button class="seg-btn" :class="{ on: form.type === 'LIMIT' }" @click="form.type = 'LIMIT'">Limit</button>
                <button class="seg-btn" :class="{ on: form.type === 'MARKET' }" @click="form.type = 'MARKET'">Piyasa</button>
              </div>

              <div v-if="form.type === 'LIMIT'">
                <label class="field-label"><span>Fiyat</span><span class="normal-case tracking-normal text-ink-3">₺</span></label>
                <input v-model.number="form.price" type="number" step="0.10" min="0.10" class="input-num" placeholder="0,00" />
                <div class="flex justify-between num text-2xs text-ink-3 mt-1.5">
                  <span>Alt <b class="text-ink-2">{{ num(bandMin) }}</b></span>
                  <span>Üst <b class="text-ink-2">{{ num(bandMax) }}</b></span>
                </div>
              </div>
              <div v-else class="text-2xs text-ink-3 bg-panel-2 border border-line rounded px-3 py-2">
                Piyasa emri, en iyi karşı fiyattan anında gerçekleşir. Alışta tahmini üst tutar bloke edilir.
              </div>

              <div>
                <label class="field-label"><span>Adet</span><span class="normal-case tracking-normal text-ink-3">lot</span></label>
                <input v-model.number="form.quantity" type="number" min="1" step="1" class="input-num" placeholder="0" />
              </div>

              <div class="grid grid-cols-4 gap-1.5">
                <button v-for="p in [25, 50, 75, 100]" :key="p" class="btn py-1.5 text-2xs num" @click="applyPct(p)">%{{ p }}</button>
              </div>

              <div class="border-t border-dashed border-line pt-2.5 flex flex-col gap-1.5">
                <div class="flex justify-between text-xs"><span class="text-ink-2">Tutar</span><span class="num">{{ money(estAmount) }}</span></div>
                <div class="flex justify-between text-xs"><span class="text-ink-2">Komisyon (‰3)</span><span class="num">{{ money(estFee) }}</span></div>
                <div class="flex justify-between text-sm font-semibold"><span>Toplam</span><span class="num">{{ money(estTotal) }}</span></div>
              </div>

              <button
                class="w-full py-2.5 rounded font-bold text-sm text-white disabled:opacity-50"
                :class="side === 'BUY' ? 'btn-buy' : 'btn-sell'"
                :disabled="submitting"
                @click="submitOrder"
              >
                {{ submitting ? 'Gönderiliyor…' : (side === 'BUY' ? `${company.symbol} AL` : `${company.symbol} SAT`) }}
              </button>

              <div class="num text-2xs text-ink-3 text-center">
                {{ side === 'BUY' ? 'Kullanılabilir nakit' : 'Elindeki adet' }}:
                <b class="text-ink-2">{{ side === 'BUY' ? money(availableCash) : num(availableQty, 0) }}</b>
              </div>
            </div>
          </div>

          <!-- Açık emirlerim -->
          <div class="panel overflow-hidden">
            <div class="panel-head"><span>Açık Emirlerim</span><span class="text-ink-3">{{ myOrders.length }}</span></div>
            <div v-if="!myOrders.length" class="p-5 text-center text-2xs text-ink-3">Bu hissede açık emrin yok.</div>
            <table v-else class="grid-table">
              <tbody>
                <tr v-for="o in myOrders" :key="o.id">
                  <td class="py-2">
                    <span :class="o.side === 'BUY' ? 'pill-up' : 'pill-down'">{{ o.side === 'BUY' ? 'AL' : 'SAT' }}</span>
                  </td>
                  <td class="col-num py-2">{{ o.price ? num(o.price) : 'Piyasa' }}</td>
                  <td class="col-num py-2 text-ink-2">{{ o.remaining }}/{{ o.qty }}</td>
                  <td class="text-right py-2">
                    <button class="text-down text-2xs hover:underline" @click="cancel(o.id)">İptal</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { socketService as socket } from '@/services/socket'
import PriceChart from '@/components/PriceChart.vue'
import OrderBook from '@/components/OrderBook.vue'
import { money, num, pct } from '@/composables/useFormat'

const route = useRoute()
const PRICE_LIMIT_PCT = 10
const FEE_RATE = 0.003

const loading = ref(true)
const company = ref<any>(null)
const orderBook = ref<any>({ bids: [], asks: [] })
const priceHistory = ref<any[]>([])
const myOrders = ref<any[]>([])
const availableCash = ref(0)
const availableQty = ref(0)

const side = ref<'BUY' | 'SELL'>('BUY')
const form = reactive({ type: 'LIMIT' as 'LIMIT' | 'MARKET', price: 0, quantity: 0 })
const submitting = ref(false)

const lastPrice = computed(() => Number(company.value?.currentPrice || company.value?.lastPrice || 0))
const changeClass = computed(() => (Number(company.value?.change) >= 0 ? 'text-up' : 'text-down'))
const bandMin = computed(() => lastPrice.value * (1 - PRICE_LIMIT_PCT / 100))
const bandMax = computed(() => lastPrice.value * (1 + PRICE_LIMIT_PCT / 100))

const effPrice = computed(() =>
  form.type === 'LIMIT' ? Number(form.price) || 0 : lastPrice.value
)
const estAmount = computed(() => effPrice.value * (Number(form.quantity) || 0))
const estFee = computed(() => estAmount.value * FEE_RATE)
const estTotal = computed(() =>
  side.value === 'BUY' ? estAmount.value + estFee.value : estAmount.value - estFee.value
)

function applyPct(p: number) {
  const price = effPrice.value || 1
  if (side.value === 'BUY') {
    const maxQty = Math.floor((availableCash.value / (price * (1 + FEE_RATE))) || 0)
    form.quantity = Math.max(0, Math.floor((maxQty * p) / 100))
  } else {
    form.quantity = Math.max(0, Math.floor((availableQty.value * p) / 100))
  }
}

const loadData = async () => {
  try {
    loading.value = true
    const companyId = route.params.id as string
    const [companyData, book, history] = await Promise.all([
      api.getCompany(companyId),
      api.getOrderBook(companyId).catch(() => ({ buy: [], sell: [] })),
      api.getCompanyHistory(companyId, '1D').catch(() => []),
    ])
    company.value = companyData
    const current = Number(companyData.currentPrice || companyData.lastPrice || 0)
    const open = Number(companyData.openPrice || current)
    company.value.change = open > 0 ? ((current - open) / open) * 100 : 0
    orderBook.value = { bids: book.buy || [], asks: book.sell || [] }
    priceHistory.value = history
    if (!form.price) form.price = current
    await refreshAccount()
  } catch (error: any) {
    console.error('Veri yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

const refreshAccount = async () => {
  try {
    const companyId = route.params.id as string
    const [summary, orders] = await Promise.all([
      api.getPortfolioSummary().catch(() => null),
      api.getMyOrders({ companyId, status: 'OPEN,PARTIAL' }).catch(() => []),
    ])
    if (summary) {
      availableCash.value = Number(summary.cash || 0)
      const pos = (summary.positions || []).find((p: any) => p.symbol === company.value?.symbol)
      availableQty.value = pos ? Number(pos.quantity) : 0
    }
    myOrders.value = orders || []
  } catch { /* sessiz */ }
}

const submitOrder = async () => {
  if (form.type === 'LIMIT' && (!form.price || form.price <= 0)) {
    alert('Lütfen geçerli bir fiyat girin.')
    return
  }
  if (!form.quantity || form.quantity <= 0) {
    alert('Lütfen geçerli bir adet girin.')
    return
  }
  try {
    submitting.value = true
    await api.createOrder({
      companyId: company.value.id,
      side: side.value,
      type: form.type,
      price: form.type === 'MARKET' ? null : Number(form.price),
      qty: Number(form.quantity),
    })
    form.quantity = 0
    await loadData()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Emir oluşturulamadı')
  } finally {
    submitting.value = false
  }
}

const cancel = async (id: string) => {
  try {
    await api.cancelOrder(id)
    await loadData()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Emir iptal edilemedi')
  }
}

// Firma değişince fiyatı forma yansıt
watch(lastPrice, (v) => {
  if (form.type === 'LIMIT' && !form.quantity) form.price = v
})

let orderBookHandler: any
let tradeHandler: any

onMounted(() => {
  loadData()
  const companyId = route.params.id as string
  orderBookHandler = (data: any) => {
    if (data.companyId === companyId) orderBook.value = { bids: data.bids || [], asks: data.asks || [] }
  }
  tradeHandler = (trade: any) => {
    if (trade.companyId === companyId) {
      priceHistory.value.push({ time: trade.timestamp, price: trade.price, volume: trade.qty })
      if (company.value) company.value.currentPrice = trade.price
      refreshAccount()
    }
  }
  socket.subscribeOrderbook(companyId, orderBookHandler)
  socket.subscribeTrades(companyId, tradeHandler)
})

onUnmounted(() => {
  const companyId = route.params.id as string
  if (orderBookHandler) socket.unsubscribeOrderbook(companyId, orderBookHandler)
  if (tradeHandler) socket.unsubscribeTrades(companyId, tradeHandler)
})
</script>
