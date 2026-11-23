<script setup lang="ts">
import { brl } from '@/lib/privacidade'
import OlhoValores from './OlhoValores.vue'
defineProps<{ valor: unknown; semOlho?: boolean }>()
</script>
<template><span class="inline-flex items-center gap-1"><span>{{ brl(valor) }}</span><OlhoValores v-if="!semOlho" /></span></template>
