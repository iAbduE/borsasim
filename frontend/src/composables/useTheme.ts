import { ref } from 'vue'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'borsasim-theme'
const theme = ref<Theme | null>(null)

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

function apply(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
}

/** Uygulama açılışında bir kez çağrılır (main.ts). */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
  const initial: Theme = saved ?? (systemPrefersDark() ? 'dark' : 'light')
  theme.value = initial
  apply(initial)
}

export function useTheme() {
  function setTheme(t: Theme) {
    theme.value = t
    localStorage.setItem(STORAGE_KEY, t)
    apply(t)
  }
  function toggleTheme() {
    const current: Theme =
      theme.value ?? (systemPrefersDark() ? 'dark' : 'light')
    setTheme(current === 'dark' ? 'light' : 'dark')
  }
  return { theme, setTheme, toggleTheme }
}
