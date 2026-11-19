<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { GRUPOS_BRIEFING, CAMPOS_BRIEFING, coresBriefing, textoBriefing } from '@/lib/briefing'
import type { Cliente } from '@/lib/domain'
const props = defineProps<{ cliente: Cliente }>()
const camposPreenchidos = computed(() => CAMPOS_BRIEFING.filter(c => props.cliente.briefing?.[c.chave]?.trim()).length)
const cores = computed(() => coresBriefing(props.cliente.briefing?.cores))
async function copiar() {
  try { await navigator.clipboard.writeText(textoBriefing(props.cliente.nome, props.cliente.briefing)); toast.success('Briefing copiado') }
  catch { toast.error('Não foi possível copiar. Selecione o texto do briefing para copiar.') }
}
</script>
<template>
  <div class="grid gap-3">
    <p v-if="!camposPreenchidos" class="text-muted-foreground text-sm">Briefing ainda não preenchido. Cadastre as orientações em Clientes → Briefing.</p>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-2"><span class="text-muted-foreground text-xs">{{ camposPreenchidos }} de {{ CAMPOS_BRIEFING.length }} campos preenchidos</span><Button type="button" variant="outline" size="sm" @click="copiar">Copiar briefing</Button></div>
      <div v-if="cores.length" class="flex flex-wrap gap-2"><span v-for="cor in cores" :key="cor" class="flex items-center gap-1.5 rounded border px-2 py-1 text-xs"><span class="size-4 rounded-sm border" :style="{ backgroundColor: cor }" />{{ cor }}</span></div>
      <template v-for="grupo in GRUPOS_BRIEFING" :key="grupo.titulo">
        <section v-if="grupo.campos.some(c => cliente.briefing?.[c.chave]?.trim())" class="grid gap-3 border-t pt-3">
          <h4 class="text-sm font-bold">{{ grupo.titulo }}</h4>
          <template v-for="campo in grupo.campos" :key="campo.chave"><div v-if="cliente.briefing?.[campo.chave]?.trim()"><p class="text-muted-foreground text-xs font-semibold">{{ campo.rotulo }}</p><p class="mt-1 whitespace-pre-wrap break-words text-sm">{{ cliente.briefing[campo.chave] }}</p></div></template>
        </section>
      </template>
    </template>
  </div>
</template>
