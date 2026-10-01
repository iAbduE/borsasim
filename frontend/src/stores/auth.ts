import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isStudent = computed(() => user.value?.role === 'STUDENT')

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const data = await api.login(email, password)
      
      user.value = data.user
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      return data
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, name?: string) {
    loading.value = true
    try {
      const data = await api.register(email, password, name)
      return data
    } finally {
      loading.value = false
    }
  }

  async function verifyEmail(email: string, code: string) {
    loading.value = true
    try {
      const data = await api.verifyEmail(email, code)
      
      user.value = data.user
      accessToken.value = data.token

      localStorage.setItem('accessToken', data.token)

      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!accessToken.value) return

    loading.value = true
    try {
      const data = await api.getMe()
      user.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated,
    isAdmin,
    isStudent,
    login,
    register,
    verifyEmail,
    fetchUser,
    logout,
  }
})
