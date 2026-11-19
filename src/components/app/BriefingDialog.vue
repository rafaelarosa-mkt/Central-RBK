<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import Field from './Field.vue'
import { GRUPOS_BRIEFING, CAMPOS_BRIEFING, normalizarBriefing, coresBriefing, type BriefingCliente } from '@/lib/briefing'
import { clientesPorId, db } from '@/lib/store'
import { fechar, modal, salvar } from '@/lib/ui'
const aberto = computed(() => modal.atual.tipo === 'briefing')
const cliente = computed(() => modal.atual.tipo === 'briefing' ? clientesPorId.value[modal.atual.cliente.id] || modal.atual.cliente : undefined)
const f = reactive<BriefingCliente>(normalizarBriefing())
const gravando = ref(false)
const preenchidos = computed(() => CAMPOS_BRIEFING.filter(c => f[c.chave]?.trim()).length)
watch(aberto, a => { if (a) Object.assign(f, normalizarBriefing(cliente.value?.briefing)) })
async function enviar() {
  if (!cliente.value || gravando.value) return
  const id = cliente.value.id
  gravando.value = true
  const ok = await salvar(() => db.atualizar('clients', id, { briefing: normalizarBriefing(f), briefingAtualizado: new Date().toISOString() }), 'Briefing do cliente salvo')
  gravando.value = false
  if (ok) fechar()
}
</script>
<template>
  <Dialog :open="aberto" @update:open="v => !v && !gravando && fechar()">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Briefing — {{ cliente?.nome }}</DialogTitle><DialogDescription>Referência da equipe para criar vídeos e posts. {{ preenchidos }} de {{ CAMPOS_BRIEFING.length }} campos preenchidos; preencha o que já souber.</DialogDescription></DialogHeader>
      <form class="grid gap-6" @submit.prevent="enviar">
        <fieldset v-for="grupo in GRUPOS_BRIEFING" :key="grupo.titulo" class="grid gap-4 border-t pt-4 sm:grid-cols-2" :disabled="gravando">
          <legend class="px-1 text-base font-bold">{{ grupo.titulo }}</legend>
          <Field v-for="campo in grupo.campos" :key="campo.chave" :label="campo.rotulo" :for="`briefing-${campo.chave}`" :class="campo.chave === 'cores' || campo.chave === 'materiais' ? 'sm:col-span-2' : ''">
            <Textarea :id="`briefing-${campo.chave}`" v-model="f[campo.chave]" :placeholder="campo.exemplo" maxlength="6000" class="min-h-28" />
            <div v-if="campo.chave === 'cores'" class="flex flex-wrap gap-2"><span v-for="cor in coresBriefing(f.cores)" :key="cor" class="flex items-center gap-1.5 text-xs"><span class="size-5 rounded border" :style="{ backgroundColor: cor }" />{{ cor }}</span></div>
          </Field>
        </fieldset>
        <DialogFooter><Button type="button" variant="outline" :disabled="gravando" @click="fechar">Cancelar</Button><Button type="submit" :disabled="gravando">{{ gravando ? 'Salvando…' : 'Salvar briefing' }}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
