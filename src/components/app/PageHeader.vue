<script setup lang="ts">
defineProps<{ titulo: string; sub?: string }>()
</script>
<template>
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div class="min-w-0">
      <h1 class="text-2xl font-extrabold sm:text-[28px]">{{ titulo }}</h1>
      <p v-if="sub" class="text-muted-foreground mt-0.5 text-sm">{{ sub }}</p>
    </div>
    <div class="flex flex-wrap gap-2"><slot /></div>
  </div>
</template>
