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
        <h2 class="text-2xl font-bold mb-1">Hesap oluştur</h2>
        <p class="text-ink-2 text-sm mb-6">Simülasyona katılmak için kaydolun.</p>

        <div class="text-2xs text-accent-ink bg-accent-bg border border-accent rounded px-3 py-2 mb-5 leading-relaxed">
          Yalnızca <strong>@beun.edu.tr</strong> veya <strong>@*.karaelmas.edu.tr</strong>
          uzantılı e-posta adresleriyle kayıt olabilirsiniz.
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleRegister">
          <div>
            <label for="name" class="field-label"><span>İsim</span><span class="text-ink-3 normal-case tracking-normal">opsiyonel</span></label>
            <input id="name" v-model="name" type="text" autocomplete="name" class="input" placeholder="Adınız Soyadınız" />
          </div>
          <div>
            <label for="email" class="field-label"><span>E-posta</span></label>
            <input id="email" v-model="email" type="email" required autocomplete="email" class="input" placeholder="ornek@beun.edu.tr" />
          </div>
          <div>
            <label for="password" class="field-label"><span>Şifre</span></label>
            <input id="password" v-model="password" type="password" required autocomplete="new-password"
              class="input" placeholder="En az 8 karakter" />
            <p class="text-2xs text-ink-3 mt-1.5">En az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam.</p>
          </div>

          <div v-if="error" class="text-down text-sm bg-down-bg border border-down rounded px-3 py-2">
            {{ error }}
          </div>

          <button type="submit" :disabled="loading" class="btn btn-accent w-full py-2.5 disabled:opacity-50">
            {{ loading ? 'Kaydediliyor…' : 'Kayıt Ol' }}
          </button>
        </form>

        <div class="mt-5 text-sm text-ink-2 text-center">
          Zaten hesabınız var mı?
          <router-link to="/login" class="text-accent-ink font-semibold hover:underline">Giriş yapın</router-link>
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

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.register(email.value, password.value, name.value || undefined)
    router.push({ name: 'verify', query: { email: email.value } })
  } catch (err: any) {
    error.value = err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Kayıt başarısız'
  } finally {
    loading.value = false
  }
}
</script>
