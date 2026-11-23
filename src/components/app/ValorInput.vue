<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { valoresVisiveis } from '@/lib/privacidade'
import OlhoValores from './OlhoValores.vue'
defineOptions({ inheritAttrs: false })
defineProps<{ modelValue?: string | number | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', valor: string | number): void }>()
</script>
<template><div class="flex items-center gap-1"><Input v-if="valoresVisiveis" v-bind="$attrs" :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)" /><Input v-else :id="($attrs.id as string)" model-value="****" readonly aria-label="Valor oculto. Use o botão de olho para visualizar e editar." /><OlhoValores /></div></template>
