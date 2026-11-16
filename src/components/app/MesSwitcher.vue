<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { addMes, fmtMes } from '@/lib/domain'
const mes = defineModel<string>({ required: true })
</script>
<template>
  <div class="bg-secondary flex items-center gap-1 rounded-full p-1">
    <Button variant="ghost" size="icon-sm" class="rounded-full" aria-label="Mês anterior" @click="mes = addMes(mes, -1)"><ChevronLeft /></Button>
    <span class="min-w-32 flex-1 text-center text-sm font-semibold capitalize tabular">{{ fmtMes(mes) }}</span>
    <Button variant="ghost" size="icon-sm" class="rounded-full" aria-label="Próximo mês" @click="mes = addMes(mes, 1)"><ChevronRight /></Button>
  </div>
</template>
