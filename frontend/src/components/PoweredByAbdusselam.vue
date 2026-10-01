<template>
  <a
    href="https://abdusselam.net/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="abdusselam.net sitesini ziyaret et"
    class="group block mx-auto w-full max-w-[320px] transition-opacity hover:opacity-90"
  >
    <img
      :src="poweredByAbdusselamUrl"
      alt="powered by abdusselam.net"
      class="block h-auto w-full"
    />
  </a>
</template>

<script setup lang="ts">
import poweredByAbdusselamUrl from '@/assets/powered-by-abdusselam-net.svg'
</script>
