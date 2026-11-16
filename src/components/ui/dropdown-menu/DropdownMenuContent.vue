<script setup lang="ts">
import type { DropdownMenuContentEmits, DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DropdownMenuContent, DropdownMenuPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'
const props = withDefaults(defineProps<DropdownMenuContentProps & { class?: HTMLAttributes['class'] }>(), { sideOffset: 6 })
const emits = defineEmits<DropdownMenuContentEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>
<template>
  <DropdownMenuPortal>
    <DropdownMenuContent data-slot="dropdown-menu-content" v-bind="forwarded"
      :class="cn('bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 min-w-[12rem] overflow-hidden rounded-lg border p-1 shadow-md', props.class)">
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
