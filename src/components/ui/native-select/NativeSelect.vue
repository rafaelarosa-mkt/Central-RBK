<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
defineOptions({ inheritAttrs: false })
const props = defineProps<{ modelValue?: string | number | null; class?: HTMLAttributes['class'] }>()
const emits = defineEmits<{ (e: 'update:modelValue', payload: string | number): void }>()
const modelValue = useVModel(props, 'modelValue', emits, { passive: true })
</script>
<template>
  <div :class="cn('relative w-full', props.class)">
    <select v-model="modelValue" v-bind="$attrs" data-slot="native-select"
      class="border-input bg-background h-10 w-full min-w-0 appearance-none rounded-md border pr-9 pl-3 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50">
      <slot />
    </select>
    <ChevronDown class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
  </div>
</template>
