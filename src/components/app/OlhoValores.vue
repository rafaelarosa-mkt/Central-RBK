<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { valoresVisiveis } from '@/lib/privacidade'
</script>
<template>
  <button type="button" class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary" :aria-label="valoresVisiveis ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'" :title="valoresVisiveis ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'" :aria-pressed="valoresVisiveis" @click.stop="valoresVisiveis = !valoresVisiveis"><EyeOff v-if="valoresVisiveis" class="size-4" /><Eye v-else class="size-4" /></button>
</template>
