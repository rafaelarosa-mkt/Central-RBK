<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { X } from 'lucide-vue-next'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'
const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DialogContentEmits>()
const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>
<template>
  <DialogPortal>
    <DialogOverlay class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
    <DialogContent data-slot="dialog-content" v-bind="forwarded"
      :class="cn(
        'bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed z-50 grid w-full gap-5 border shadow-lg outline-none overflow-y-auto',
        'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] data-[state=open]:slide-in-from-bottom-8',
        'sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-6 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95',
        props.class)">
      <slot />
      <DialogClose class="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 hover:bg-muted focus:ring-2 focus:outline-hidden [&_svg]:size-4">
        <X /><span class="sr-only">Fechar</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
