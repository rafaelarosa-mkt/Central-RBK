<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import Field from './Field.vue'
import { TIPOS_EV, todayStr, type Evento } from '@/lib/domain'
import { ativos, db } from '@/lib/store'
import { fechar, modal, salvar } from '@/lib/ui'

const aberto = computed(() => modal.atual.tipo === 'evento')
const atual = computed(() => (modal.atual.tipo === 'evento' ? modal.atual.evento : undefined))
const f = reactive({ tipo: 'gravacao' as Evento['tipo'], clientId: '', titulo: '', data: '', hora: '', duracao: 60 as number | string, local: '', obs: '' })
const confirmarExcluir = ref(false)

watch(aberto, a => {
  if (!a) return
  const e = atual.value
  const data = modal.atual.tipo === 'evento' ? modal.atual.data : undefined
  Object.assign(f, {
    tipo: e?.tipo || 'gravacao', clientId: e?.clientId || '', titulo: e?.titulo || '', data: e?.data || data || todayStr(),
    hora: e?.hora || '', duracao: e?.duracao || 60, local: e?.local || '', obs: e?.obs || '',
  })
  confirmarExcluir.value = false
})
async function enviar() {
  if (!f.data) return
  const d = { ...f, duracao: Number(f.duracao) || 60 }
  const e = atual.value
  const ok = await salvar(() => e
    ? db.salvar('agenda', e.id, { ...(({ id, ...r }: Evento) => r)(e), ...d })
    : db.criar('agenda', { ...d, feito: false, criado: Date.now() }), 'Compromisso salvo')
  if (ok) fechar()
}
async function excluir() {
  if (!confirmarExcluir.value) { confirmarExcluir.value = true; return }
  if (await salvar(() => db.apagar('agenda', atual.value!.id), 'Compromisso excluído')) fechar()
}
</script>

<template>
  <Dialog :open="aberto" @update:open="v => !v && fechar()">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ atual ? 'Editar compromisso' : 'Agendar' }}</DialogTitle>
        <DialogDescription>Gravação, reunião ou entrega.</DialogDescription>
      </DialogHeader>
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="enviar">
        <Field label="Tipo" for="eTipo"><NativeSelect id="eTipo" v-model="f.tipo"><option v-for="(l, k) in TIPOS_EV" :key="k" :value="k">{{ l }}</option></NativeSelect></Field>
        <Field label="Cliente" for="eCli"><NativeSelect id="eCli" v-model="f.clientId"><option value="">Sem cliente</option><option v-for="c in ativos" :key="c.id" :value="c.id">{{ c.nome }}</option></NativeSelect></Field>
        <Field label="Título" for="eTit" class="sm:col-span-2"><Input id="eTit" v-model="f.titulo" placeholder="Ex.: Captação de 10 vídeos" /></Field>
        <Field label="Data" for="eData"><Input id="eData" v-model="f.data" type="date" required /></Field>
        <Field label="Horário" for="eHora"><Input id="eHora" v-model="f.hora" type="time" /></Field>
        <Field label="Duração (min)" for="eDur"><Input id="eDur" v-model="f.duracao" type="number" min="15" step="15" /></Field>
        <Field label="Local" for="eLocal"><Input id="eLocal" v-model="f.local" /></Field>
        <Field label="Observações" for="eObs" class="sm:col-span-2"><Textarea id="eObs" v-model="f.obs" /></Field>
        <DialogFooter class="sm:col-span-2">
          <Button v-if="atual" type="button" variant="ghost" class="text-destructive mr-auto" @click="excluir">{{ confirmarExcluir ? 'Confirmar exclusão' : 'Excluir' }}</Button>
          <Button type="button" variant="outline" @click="fechar">Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
