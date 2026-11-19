<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, Sparkles, Clock, Archive, ArrowUpRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import Field from './Field.vue'
import ClientDot from './ClientDot.vue'
import BriefingResumo from './BriefingResumo.vue'
import { clientes, clientesPorId, demandasExtras, db } from '@/lib/store'
import { salvar } from '@/lib/ui'
import { fmtD, todayStr } from '@/lib/domain'
import { ETAPAS_EXTRA, validarExtra, type DemandaExtra } from '@/lib/extras'
const filtro = ref(''), busca = ref(''), arquivo = ref(false), aberto = ref(false), busy = ref(false), erro = ref(''), id = ref('')
const vazio = (): Omit<DemandaExtra, 'id'> => ({ tipoRegistro: 'demanda_extra', clientId: '', titulo: '', descricao: '', categoria: 'Outro', prazo: '', prioridade: 'normal', etapa: 'recebido', responsavel: '', arquivada: false })
const f = reactive(vazio())
const lista = computed(() => demandasExtras.value.filter(d => Boolean(d.arquivada) === arquivo.value && (!filtro.value || d.clientId === filtro.value) && `${d.titulo} ${d.descricao} ${clientesPorId.value[d.clientId]?.nome || ''}`.toLocaleLowerCase('pt-BR').includes(busca.value.trim().toLocaleLowerCase('pt-BR'))))
const atrasada = (d: DemandaExtra) => !!d.prazo && d.prazo < todayStr() && d.etapa !== 'concluido'
const resumo = computed(() => ({ abertas: lista.value.filter(d => d.etapa !== 'concluido').length, urgentes: lista.value.filter(d => d.prioridade === 'urgente' && d.etapa !== 'concluido').length, atrasadas: lista.value.filter(atrasada).length, concluidas: lista.value.filter(d => d.etapa === 'concluido').length }))
const prioridade = { urgente: 0, alta: 1, normal: 2 }
const colunas = computed(() => Object.entries(ETAPAS_EXTRA).map(([etapa, nome]) => ({ etapa, nome, itens: lista.value.filter(d => d.etapa === etapa).sort((a, b) => Number(atrasada(b)) - Number(atrasada(a)) || prioridade[a.prioridade] - prioridade[b.prioridade] || (a.prazo || '9').localeCompare(b.prazo || '9')) })))
function editar(d?: DemandaExtra) { Object.assign(f, vazio(), d || {}, { clientId: d?.clientId || filtro.value }); id.value = d?.id || ''; erro.value = ''; aberto.value = true }
async function enviar() {
  if (busy.value) return
  erro.value = validarExtra(f)
  if (erro.value) return
  busy.value = true
  const dados = { ...f, titulo: f.titulo.trim(), atualizado: Date.now() }
  const ok = await salvar(() => id.value ? db.atualizar('itens', id.value, dados) : db.criar('itens', dados), id.value ? 'Demanda atualizada' : 'Demanda extra criada')
  busy.value = false
  if (ok) aberto.value = false
}
async function arquivar() {
  if (busy.value || !id.value) return
  busy.value = true
  const ok = await salvar(() => db.atualizar('itens', id.value, { arquivada: !f.arquivada, atualizado: Date.now() }), f.arquivada ? 'Demanda restaurada' : 'Demanda arquivada')
  busy.value = false
  if (ok) aberto.value = false
}
</script>
<template>
  <section class="flex flex-col gap-5">
    <div class="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-xl"><span class="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><Sparkles class="size-3.5" />ALÉM DO PLANO</span><h2 class="text-2xl font-bold tracking-tight">Pedidos especiais, tudo no lugar.</h2><p class="mt-2 text-sm text-muted-foreground">Artes avulsas, campanhas, ajustes e outras entregas extras. Um espaço próprio para acompanhar cada pedido, sem alterar as metas do contrato.</p></div>
        <Button @click="editar()"><Plus />Nova demanda extra</Button>
      </div>
      <div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="m in [{ n: resumo.abertas, t: 'Em aberto' }, { n: resumo.urgentes, t: 'Urgentes' }, { n: resumo.atrasadas, t: 'Prazo vencido' }, { n: resumo.concluidas, t: 'Concluídas' }]" :key="m.t" class="rounded-xl border bg-card/80 p-3"><p class="text-2xl font-bold tabular">{{ m.n }}</p><p class="text-xs text-muted-foreground">{{ m.t }}</p></div>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <Input v-model="busca" placeholder="Buscar demanda ou cliente…" aria-label="Buscar demandas extras" class="w-full sm:max-w-xs" />
      <NativeSelect v-model="filtro" aria-label="Cliente das demandas extras" class="w-full sm:w-60"><option value="">Todos os clientes</option><option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nome }}</option></NativeSelect>
      <Button :variant="arquivo ? 'default' : 'outline'" :aria-pressed="arquivo" @click="arquivo = !arquivo"><Archive />{{ arquivo ? 'Ver ativas' : 'Arquivadas' }}</Button>
    </div>
    <p class="text-xs text-muted-foreground">{{ arquivo ? 'Arquivo de demandas — abra um cartão para restaurar.' : 'Todos os meses · os pedidos permanecem aqui até você arquivar.' }}</p>
    <div v-if="!lista.length" class="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-5 py-10 text-center"><Sparkles class="size-8 text-primary" /><h3 class="font-bold">{{ busca || filtro || arquivo ? 'Nenhuma demanda encontrada' : 'Um novo pedido fora do plano?' }}</h3><p class="max-w-md text-sm text-muted-foreground">{{ busca || filtro || arquivo ? 'Ajuste os filtros para encontrar outros pedidos.' : 'Registre o que o cliente precisa e acompanhe a entrega por aqui.' }}</p><Button v-if="!arquivo" variant="outline" @click="editar()"><Plus />Criar demanda</Button></div>
    <div v-else class="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      <section v-for="col in colunas" :key="col.etapa" class="min-w-0 rounded-xl bg-secondary/60 p-3">
        <header class="mb-3 flex items-center justify-between"><h3 class="flex items-center gap-2 text-sm font-bold"><span :class="['size-2 rounded-full', col.etapa === 'concluido' ? 'bg-success' : col.etapa === 'aprovacao' ? 'bg-amber-500' : col.etapa === 'andamento' ? 'bg-primary' : 'bg-muted-foreground']" />{{ col.nome }}</h3><span class="text-xs font-bold text-muted-foreground">{{ col.itens.length }}</span></header>
        <div class="flex flex-col gap-3">
          <button v-for="d in col.itens" :key="d.id" type="button" class="group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary" @click="editar(d)">
            <span class="flex items-center gap-2 text-xs text-muted-foreground"><ClientDot :cliente="clientesPorId[d.clientId]" :size="8" /><span class="min-w-0 flex-1 truncate">{{ clientesPorId[d.clientId]?.nome || 'Cliente removido' }}</span><ArrowUpRight class="size-3.5" /></span>
            <span class="font-semibold leading-snug break-words">{{ d.titulo }}</span>
            <span v-if="d.descricao" class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{{ d.descricao }}</span>
            <span class="flex flex-wrap gap-1.5"><Badge variant="muted">{{ d.categoria }}</Badge><Badge v-if="d.prioridade !== 'normal'" :variant="d.prioridade === 'urgente' ? 'danger' : 'info'">{{ d.prioridade === 'urgente' ? 'Urgente' : 'Alta prioridade' }}</Badge></span>
            <span :class="['flex items-center gap-1.5 border-t pt-3 text-xs', atrasada(d) ? 'text-destructive' : 'text-muted-foreground']"><Clock class="size-3.5" />{{ d.prazo ? `${atrasada(d) ? 'Atrasada · ' : 'Entrega · '}${fmtD(d.prazo)}` : 'Sem prazo definido' }}</span>
            <span v-if="d.responsavel" class="text-xs text-muted-foreground">Responsável: {{ d.responsavel }}</span>
          </button>
          <p v-if="!col.itens.length" class="py-7 text-center text-xs text-muted-foreground">Nenhuma demanda nesta etapa</p>
        </div>
      </section>
    </div>
    <Dialog :open="aberto" @update:open="v => { if (!busy) aberto = v }">
      <DialogContent class="sm:max-w-2xl"><DialogHeader><DialogTitle>{{ id ? 'Detalhes da demanda extra' : 'Nova demanda extra' }}</DialogTitle><DialogDescription>Um pedido fora do plano, com acompanhamento próprio.</DialogDescription></DialogHeader>
        <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="enviar">
          <Field label="Cliente" for="extra-cliente"><NativeSelect id="extra-cliente" v-model="f.clientId" required><option value="">Escolha o cliente</option><option v-if="f.clientId && !clientesPorId[f.clientId]" :value="f.clientId">Cliente removido</option><option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nome }}</option></NativeSelect></Field>
          <Field label="Tipo de pedido" for="extra-categoria"><NativeSelect id="extra-categoria" v-model="f.categoria"><option v-for="c in ['Arte avulsa', 'Vídeo extra', 'Campanha', 'Cobertura de evento', 'Ajuste / revisão', 'Material impresso', 'Outro']" :key="c">{{ c }}</option></NativeSelect></Field>
          <Field label="O que precisa ser feito?" for="extra-titulo" class="sm:col-span-2"><Input id="extra-titulo" v-model="f.titulo" required maxlength="200" placeholder="Ex.: Criar convite para inauguração" /></Field>
          <Field label="Descrição e orientações" for="extra-descricao" class="sm:col-span-2"><Textarea id="extra-descricao" v-model="f.descricao" rows="4" placeholder="Objetivo, formatos, referências e detalhes combinados com o cliente…" /></Field>
          <Field label="Prazo de entrega" for="extra-prazo"><Input id="extra-prazo" v-model="f.prazo" type="date" /></Field>
          <Field label="Prioridade" for="extra-prioridade"><NativeSelect id="extra-prioridade" v-model="f.prioridade"><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></NativeSelect></Field>
          <Field label="Andamento" for="extra-etapa"><NativeSelect id="extra-etapa" v-model="f.etapa"><option v-for="(nome, etapa) in ETAPAS_EXTRA" :key="etapa" :value="etapa">{{ nome }}</option></NativeSelect></Field>
          <Field label="Responsável" for="extra-responsavel"><Input id="extra-responsavel" v-model="f.responsavel" placeholder="Quem vai cuidar deste pedido?" /></Field>
          <details v-if="clientesPorId[f.clientId]" class="rounded-lg border p-3 sm:col-span-2"><summary class="cursor-pointer text-sm font-semibold">Consultar briefing do cliente</summary><div class="mt-3"><BriefingResumo :cliente="clientesPorId[f.clientId]" /></div></details>
          <p v-if="erro" role="alert" class="text-destructive text-sm sm:col-span-2">{{ erro }}</p>
          <DialogFooter class="flex-wrap sm:col-span-2"><Button v-if="id" type="button" variant="ghost" :disabled="busy" @click="arquivar"><Archive />{{ f.arquivada ? 'Restaurar' : 'Arquivar' }}</Button><Button type="button" variant="outline" :disabled="busy" @click="aberto = false">Cancelar</Button><Button type="submit" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar demanda' }}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>
