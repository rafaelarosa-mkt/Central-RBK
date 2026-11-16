<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { type BadgeVariants, badgeVariants } from '.'
const props = defineProps<{ variant?: BadgeVariants['variant']; dot?: boolean; class?: HTMLAttributes['class'] }>()
</script>
<template>
  <span data-slot="badge" :class="cn(badgeVariants({ variant, dot }), props.class)"><slot /></span>
</template>
