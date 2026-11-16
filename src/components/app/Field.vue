<script setup lang="ts">
import { Label } from '@/components/ui/label'
defineProps<{ label: string; for?: string; hint?: string; class?: string }>()
</script>
<template>
  <div :class="['flex min-w-0 flex-col gap-2', $props.class]">
    <Label :for="$props.for">{{ label }}</Label>
    <slot />
    <p v-if="hint" class="text-muted-foreground text-xs">{{ hint }}</p>
  </div>
</template>
