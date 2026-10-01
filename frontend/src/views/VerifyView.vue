<template>
  <div class="min-h-screen bg-bg text-ink flex flex-col">
    <div class="flex items-center justify-between px-5 py-3 border-b border-line bg-panel">
      <span class="font-extrabold text-lg tracking-[0.14em]">BORSA<span class="text-accent-ink">SİM</span></span>
      <button class="btn btn-ghost px-2.5 py-2 text-base" @click="toggleTheme" aria-label="Tema değiştir">
        <span v-if="theme === 'dark'">☀</span><span v-else>☾</span>
      </button>
    </div>

    <div class="flex-1 flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-1">E-posta doğrulama</h2>
        <p class="text-ink-2 text-sm mb-6">
          Adresinize gönderilen 6 haneli kodu girin.
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="handleVerify">
          <div>
            <label for="email" class="field-label"><span>E-posta</span></label>
            <input id="email" v-model="email" type="email" required class="input" placeholder="ornek@beun.edu.tr" />
          </div>
          <div>
            <label for="code" class="field-label"><span>Doğrulama Kodu</span></label>
            <input id="code" v-model="code" type="text" inputmode="numeric" required maxlength="6"
              class="input num text-center tracking-[0.5em] text-2xl" placeholder="——————" />
          </div>

          <div v-if="error" class="text-down text-sm bg-down-bg border border-down rounded px-3 py-2">
            {{ error }}
          </div>

          <button type="submit" :disabled="loading" class="btn btn-accent w-full py-2.5 disabled:opacity-50">
            {{ loading ? 'Doğrulanıyor…' : 'Doğrula ve Giriş Yap' }}
          </button>
        </form>

        <div class="mt-5 flex items-center justify-between text-sm">
          <button @click="handleResend" :disabled="resendLoading"
            class="text-ink-2 hover:text-accent-ink disabled:opacity-50">
            {{ resendLoading ? 'Gönderiliyor…' : 'Kodu tekrar gönder' }}
          </button>
          <router-link to="/login" class="text-ink-3 hover:text-ink">Girişe dön</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { theme, toggleTheme } = useTheme()

const email = ref('')
const code = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const error = ref('')

onMounted(() => {
  if (route.query.email) email.value = route.query.email as string
})

const handleVerify = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.verifyEmail(email.value, code.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Doğrulama başarısız'
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  if (!email.value) {
    error.value = 'Lütfen önce e-posta adresini girin.'
    return
  }
  resendLoading.value = true
  error.value = ''
  try {
    await api.resendCode(email.value)
    alert('Kod tekrar gönderildi. Lütfen spam kutunuzu da kontrol edin.')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Kod gönderilemedi'
  } finally {
    resendLoading.value = false
  }
}
</script>
