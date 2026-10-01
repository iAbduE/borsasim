<template>
  <nav class="panel flex items-center gap-0.5 p-1 overflow-x-auto">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="px-3 py-1.5 rounded text-sm text-ink-2 hover:text-ink hover:bg-panel-2 transition-colors whitespace-nowrap"
      :class="{ 'text-ink bg-elev shadow-[inset_0_-2px_0_var(--c-accent)]': isActive(item.to) }"
    >{{ item.label }}</router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const items = [
  { to: '/admin', label: 'Panel' },
  { to: '/admin/companies', label: 'Firmalar' },
  { to: '/admin/users', label: 'Kullanıcılar' },
  { to: '/admin/news', label: 'Haberler' },
  { to: '/admin/ipo', label: 'Halka Arz' },
  { to: '/admin/ads', label: 'Reklamlar' },
]

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}
</script>
