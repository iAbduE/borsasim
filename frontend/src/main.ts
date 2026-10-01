import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/main.css'
import { initTheme } from './composables/useTheme'

// Yeni deploy sonrası eski chunk cache'lenmişse uygulamayı bir kez yenile.
const chunkReloadKey = 'borsasim:chunk-reload'
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()

  const lastReload = Number(sessionStorage.getItem(chunkReloadKey))
  if (lastReload && Date.now() - lastReload < 10_000) {
    sessionStorage.removeItem(chunkReloadKey)
    return
  }

  sessionStorage.setItem(chunkReloadKey, String(Date.now()))
  window.location.reload()
})

initTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
