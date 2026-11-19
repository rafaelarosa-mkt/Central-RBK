<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Paperclip, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import Field from './Field.vue'
import BriefingResumo from './BriefingResumo.vue'
import { LBL, STATUS, type Anexo, type Item, type Status, type Tipo } from '@/lib/domain'
import { arquivos, ativos, clientesPorId, db, mesAtual } from '@/lib/store'
import { fechar, modal, salvar } from '@/lib/ui'

const aberto = computed(() => modal.atual.tipo === 'item')
const atual = computed(() => (modal.atual.tipo === 'item' ? modal.atual.item : undefined))
const novo = computed(() => !atual.value)
const f = reactive({ clientId: '', tipo: 'video' as Tipo, mes: '', titulo: '', status: 'roteiro' as Status, dataGravacao: '', dataPost: '', roteiro: '', qtd: 1 })
const clienteBriefing = computed(() => clientesPorId.value[f.clientId])
const anexos = ref<Anexo[]>([])
const enviando = ref(false)
const confirmarExcluir = ref(false)

watch(aberto, a => {
  if (!a) return
  const i = atual.value
  const preset = modal.atual.tipo === 'item' ? modal.atual.clientId : undefined
  Object.assign(f, {
    clientId: i?.clientId || preset || '', tipo: i?.tipo === 'post' ? 'post' : 'video', mes: i?.mes || mesAtual.value, titulo: i?.titulo || '',
    status: i?.status || 'roteiro', dataGravacao: i?.dataGravacao || '', dataPost: i?.dataPost || '', roteiro: i?.roteiro || '', qtd: 1,
  })
  anexos.value = [...(i?.anexos || [])]
  confirmarExcluir.value = false
})

async function anexar(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]; input.value = ''
  if (!file) return
  if (file.size > 50 * 1024 * 1024) { toast.error('Arquivo acima de 50 MB.'); return }
  enviando.value = true
  try { anexos.value.push({ id: await arquivos.enviar(file), nome: file.name }) }
  catch { toast.error('Não foi possível enviar o arquivo. Verifique a internet e tente de novo.') }
  enviando.value = false
}
const abrirAnexo = (a: Anexo) => arquivos.abrir(a.id).catch(() => toast.error('Não foi possível abrir o arquivo.'))

async function enviar() {
  if (!f.clientId || !f.mes) { toast.error('Escolha o cliente e o mês.'); return }
  const { qtd, ...campos } = f
  const d = { ...campos, anexos: anexos.value, atualizado: Date.now() }
  if (novo.value) {
    const q = Math.max(1, Math.min(30, Number(qtd) || 1))
    const base = d.titulo || (d.tipo === 'post' ? 'Post' : 'Vídeo')
    const ok = await salvar(async () => {
      for (let k = 1; k <= q; k++) await db.criar('itens', { ...d, titulo: q > 1 ? `${base} ${k}` : base, anexos: k === 1 ? d.anexos : [], roteiro: k === 1 ? d.roteiro : '' })
    }, q > 1 ? `${q} conteúdos criados` : 'Conteúdo criado')
    if (ok) fechar()
  } else {
    const { id, ...resto } = atual.value as Item
    if (await salvar(() => db.salvar('itens', id, { ...resto, ...d }), 'Conteúdo salvo')) fechar()
  }
}
async function excluir() {
  if (!confirmarExcluir.value) { confirmarExcluir.value = true; return }
  if (await salvar(() => db.apagar('itens', atual.value!.id), 'Conteúdo excluído')) fechar()
}
const rotuloEtapa = (s: Status) => (LBL.video[s] === LBL.post[s] ? LBL.video[s] : `${LBL.video[s]} / ${LBL.post[s]}`)
</script>

<template>
  <Dialog :open="aberto" @update:open="v => !v && fechar()">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ novo ? 'Novo conteúdo' : 'Editar conteúdo' }}</DialogTitle>
        <DialogDescription>Vídeo ou post, com roteiro e etapa de produção.</DialogDescription>
      </DialogHeader>
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="enviar">
        <Field label="Cliente" for="iCli" class="sm:col-span-2">
          <NativeSelect id="iCli" v-model="f.clientId" required>
            <option value="">Escolha o cliente</option>
            <option v-for="c in ativos" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </NativeSelect>
        </Field>
        <details v-if="clienteBriefing" :key="clienteBriefing.id" open class="bg-secondary/40 rounded-lg border p-3 sm:col-span-2">
          <summary class="cursor-pointer text-sm font-bold">Briefing de {{ clienteBriefing.nome }}</summary>
          <div class="mt-3 max-h-72 overflow-y-auto pr-2"><BriefingResumo :cliente="clienteBriefing" /></div>
        </details>
        <fieldset class="flex flex-col gap-2">
          <legend class="text-muted-foreground mb-2 text-sm font-medium">Tipo</legend>
          <div class="bg-secondary grid grid-cols-2 gap-1 rounded-lg p-1">
            <label v-for="t in (['video', 'post'] as const)" :key="t" class="has-checked:bg-card has-checked:text-foreground has-checked:shadow-xs text-muted-foreground has-focus-visible:ring-ring/50 has-focus-visible:ring-[3px] cursor-pointer rounded-md py-1.5 text-center text-sm font-semibold">
              <input v-model="f.tipo" type="radio" name="iTipo" :value="t" class="sr-only">{{ t === 'video' ? 'Vídeo' : 'Post' }}
            </label>
          </div>
        </fieldset>
        <Field label="Mês de entrega" for="iMes"><Input id="iMes" v-model="f.mes" type="month" required /></Field>
        <Field label="Título" for="iTit" class="sm:col-span-2"><Input id="iTit" v-model="f.titulo" placeholder="Ex.: Casa no Parque dos Anjos · tour" /></Field>
        <Field v-if="novo" label="Quantidade" for="iQtd" hint="Cria vários de uma vez, numerados."><Input id="iQtd" v-model="f.qtd" type="number" min="1" max="30" /></Field>
        <Field label="Etapa" for="iSt" :class="novo ? '' : 'sm:col-span-2'">
          <NativeSelect id="iSt" v-model="f.status"><option v-for="s in STATUS" :key="s" :value="s">{{ rotuloEtapa(s) }}</option></NativeSelect>
        </Field>
        <Field label="Data da gravação" for="iDg"><Input id="iDg" v-model="f.dataGravacao" type="date" /></Field>
        <Field label="Programado para" for="iDp"><Input id="iDp" v-model="f.dataPost" type="date" /></Field>
        <Field label="Roteiro" for="iRot" class="sm:col-span-2"><Textarea id="iRot" v-model="f.roteiro" class="min-h-40" placeholder="Cole aqui as falas do vídeo ou o briefing do post" /></Field>
        <div class="flex flex-col gap-2 sm:col-span-2">
          <span class="text-muted-foreground text-sm font-medium">Arquivos do roteiro</span>
          <p v-if="!anexos.length" class="text-muted-foreground text-xs">Nenhum arquivo anexado.</p>
          <div v-for="(a, k) in anexos" :key="a.id" class="bg-secondary flex items-center gap-2 rounded-md px-3 py-2 text-sm">
            <Paperclip class="text-muted-foreground size-4 shrink-0" />
            <button type="button" class="text-primary min-w-0 flex-1 truncate text-left underline-offset-4 hover:underline" @click="abrirAnexo(a)">{{ a.nome }}</button>
            <Button type="button" variant="ghost" size="icon-sm" :aria-label="`Remover ${a.nome}`" @click="anexos.splice(k, 1)"><X /></Button>
          </div>
          <label class="border-input hover:bg-secondary flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm font-semibold has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50">
            <input type="file" class="sr-only" accept=".pdf,.txt,.md,.doc,.docx,image/*" :disabled="enviando" @change="anexar">
            <Paperclip class="size-4" />{{ enviando ? 'Enviando arquivo…' : 'Anexar arquivo' }}
          </label>
          <p class="text-muted-foreground text-xs">PDF, Word, imagem ou texto, até 50 MB.</p>
        </div>
        <DialogFooter class="sm:col-span-2">
          <Button v-if="!novo" type="button" variant="ghost" class="text-destructive mr-auto" @click="excluir">{{ confirmarExcluir ? 'Confirmar exclusão' : 'Excluir' }}</Button>
          <Button type="button" variant="outline" @click="fechar">Cancelar</Button>
          <Button type="submit" :disabled="enviando">Salvar</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
