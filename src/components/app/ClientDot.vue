<script setup lang="ts">
import { cor, type Cliente } from '@/lib/domain'
withDefaults(defineProps<{ cliente?: Cliente; size?: number }>(), { size: 10 })
</script>
<template>
  <span class="inline-block shrink-0 rounded-full" :style="{ background: cor(cliente), width: size + 'px', height: size + 'px' }" aria-hidden="true" />
</template>
