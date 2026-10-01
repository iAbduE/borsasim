<template>
  <div class="min-h-screen bg-bg text-ink flex flex-col">
    <!-- Üst şerit + tema -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-line bg-panel">
      <span class="font-extrabold text-lg tracking-[0.14em]">BORSA<span class="text-accent-ink">SİM</span></span>
      <button class="btn btn-ghost px-2.5 py-2 text-base" @click="toggleTheme" aria-label="Tema değiştir">
        <span v-if="theme === 'dark'">☀</span><span v-else>☾</span>
      </button>
    </div>

    <div class="flex-1 grid lg:grid-cols-2">
      <!-- Sol tanıtım paneli -->
      <div class="hidden lg:flex flex-col justify-between p-10 border-r border-line bg-panel relative overflow-hidden">
        <div>
          <div class="label mb-3">Eğitim Amaçlı Borsa Simülasyonu</div>
          <h1 class="text-3xl font-bold leading-tight max-w-md" style="text-wrap: balance;">
            Gerçek bir borsa deneyimi. Gerçek risk olmadan.
          </h1>
          <p class="text-ink-2 mt-4 max-w-md text-sm leading-relaxed">
            Limit ve piyasa emirleri, canlı emir defteri, halka arz (IPO) ve
            anlık sıralama. Portföyünü yönet, stratejini test et.
          </p>
        </div>
        <dl class="grid grid-cols-3 gap-4 max-w-md">
          <div>
            <dt class="label">Başlangıç</dt>
            <dd class="num text-xl font-semibold mt-1">₺1M</dd>
          </div>
          <div>
            <dt class="label">Komisyon</dt>
            <dd class="num text-xl font-semibold mt-1">‰3</dd>
          </div>
          <div>
            <dt class="label">Fiyat Limiti</dt>
            <dd class="num text-xl font-semibold mt-1">±%10</dd>
          </div>
        </dl>
      </div>

      <!-- Form -->
      <div class="flex items-center justify-center p-6 sm:p-10">
        <div class="w-full max-w-sm">
          <h2 class="text-2xl font-bold mb-1">Giriş yap</h2>
          <p class="text-ink-2 text-sm mb-7">Hesabınızla oturum açın.</p>

          <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
            <div>
              <label for="email" class="field-label"><span>E-posta</span></label>
              <input id="email" v-model="email" type="email" required autocomplete="email"
                class="input" placeholder="ornek@beun.edu.tr" />
            </div>
            <div>
              <label for="password" class="field-label"><span>Şifre</span></label>
              <input id="password" v-model="password" type="password" required autocomplete="current-password"
                class="input" placeholder="••••••••" />
            </div>

            <div v-if="error" class="text-down text-sm bg-down-bg border border-down rounded px-3 py-2">
              {{ error }}
            </div>

            <button type="submit" :disabled="loading" class="btn btn-accent w-full py-2.5 disabled:opacity-50">
              {{ loading ? 'Giriş yapılıyor…' : 'Giriş Yap' }}
            </button>
          </form>

          <div class="mt-5 text-sm text-ink-2 text-center">
            Hesabınız yok mu?
            <router-link to="/register" class="text-accent-ink font-semibold hover:underline">Kayıt olun</router-link>
          </div>

          <p class="mt-6 text-2xs text-ink-3 text-center">
            Demo: admin@borsasim.com · ogrenci@borsasim.com
          </p>
        </div>
      </div>
    </div>

    <footer class="px-5 py-4 flex justify-center">
      <PoweredByAbdusselam />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import PoweredByAbdusselam from '@/components/PoweredByAbdusselam.vue'

const router = useRouter()
const authStore = useAuthStore()
const { theme, toggleTheme } = useTheme()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err: any) {
    if (err.response?.status === 403 && err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
      router.push({ path: '/verify', query: { email: email.value } })
      return
    }
    error.value = err.response?.data?.error || 'Giriş başarısız'
  } finally {
    loading.value = false
  }
}
</script>
