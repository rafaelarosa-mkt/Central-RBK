<script setup lang="ts">
import type { DropdownMenuItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DropdownMenuItem, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
const props = defineProps<DropdownMenuItemProps & { class?: HTMLAttributes['class'] }>()
const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>
<template>
  <DropdownMenuItem data-slot="dropdown-menu-item" v-bind="forwarded"
    :class="cn('focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 [&_svg]:text-muted-foreground', props.class)">
    <slot />
  </DropdownMenuItem>
</template>
