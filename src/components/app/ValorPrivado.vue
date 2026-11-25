<script setup lang="ts">
import { brl } from '@/lib/privacidade'
import OlhoValores from './OlhoValores.vue'
defineProps<{ valor: unknown; semOlho?: boolean }>()
</script>
<template>
  <span class="inline-flex min-w-0 max-w-full items-center gap-1 align-middle">
    <span class="min-w-0 wrap-anywhere">{{ brl(valor) }}</span>
    <OlhoValores v-if="!semOlho" />
  </span>
</template>
