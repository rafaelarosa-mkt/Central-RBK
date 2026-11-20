<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { CalendarDays, Plus, RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Field from './Field.vue'
import { db, visitas, mesAtual } from '@/lib/store'
import { salvar } from '@/lib/ui'
import { fmtBR, fmtMes, todayStr, type Cliente } from '@/lib/domain'
import { remarcarVisita, validarAgendamento, type Visita } from '@/lib/visitas'
const props = defineProps<{ cliente: Cliente }>()
const aberto = ref(false), mes = ref(mesAtual.value), busy = ref(false), erro = ref(''), modo = ref(''), alvo = ref('')
const f = reactive({ data: '', hora: '', local: '', observacoes: '', motivo: '', solicitadoPor: 'Cliente' })
const lista = computed(() => visitas.value.filter(v => v.clientId === props.cliente.id && v.mes === mes.value).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)))
const resumo = computed(() => ({ total: lista.value.length, realizadas: lista.value.filter(v => v.status === 'realizada').length, agendadas: lista.value.filter(v => v.status === 'agendada').length, canceladas: lista.value.filter(v => v.status === 'cancelada').length, remarcacoes: lista.value.reduce((n, v) => n + (v.historico || []).length, 0) }))
const status = { agendada: 'Agendada', realizada: 'Realizada', cancelada: 'Cancelada' }
watch(mes, () => { modo.value = ''; erro.value = '' })
function abrir() { mes.value = mesAtual.value; modo.value = ''; erro.value = ''; aberto.value = true }
function formulario(v?: Visita) {
  alvo.value = v?.id || ''; modo.value = v ? 'remarcar' : 'nova'; erro.value = ''
  Object.assign(f, { data: v?.data || (todayStr().startsWith(mes.value) ? todayStr() : `${mes.value}-01`), hora: v?.hora || '', local: '', observacoes: '', motivo: '', solicitadoPor: 'Cliente' })
}
async function enviar() {
  if (busy.value) return
  erro.value = validarAgendamento(f.data, f.hora)
  if (erro.value) return
  if (modo.value === 'nova' && f.data.slice(0, 7) !== mes.value) { erro.value = 'A primeira data deve estar no mês selecionado. Troque o mês para cadastrar esta visita.'; return }
  let dados: Record<string, unknown>
  if (modo.value === 'remarcar') {
    const atual = visitas.value.find(v => v.id === alvo.value)
    if (!atual) { erro.value = 'Visita não encontrada. Reabra a lista.'; return }
    try { dados = { ...remarcarVisita(atual, f.data, f.hora, f.motivo, f.solicitadoPor) } }
    catch (e) { erro.value = e instanceof Error ? e.message : 'Confira os dados.'; return }
  } else dados = { tipoRegistro: 'visita', clientId: props.cliente.id, mes: mes.value, data: f.data, hora: f.hora, local: f.local.trim(), observacoes: f.observacoes.trim(), status: 'agendada', historico: [], criadoEm: new Date().toISOString() }
  busy.value = true
  const ok = await salvar(() => modo.value === 'remarcar' ? db.atualizar('itens', alvo.value, dados) : db.criar('itens', dados), modo.value === 'remarcar' ? 'Remarcação registrada no histórico' : 'Visita agendada')
  busy.value = false
  if (ok) modo.value = ''
}
async function alterarStatus(v: Visita, novo: Visita['status']) {
  if (busy.value) return
  busy.value = true
  await salvar(() => db.atualizar('itens', v.id, { status: novo, statusAtualizadoEm: new Date().toISOString() }), `Visita ${status[novo].toLowerCase()}`)
  busy.value = false
}
</script>
<template>
  <Button variant="outline" size="sm" @click="abrir"><CalendarDays />Visitas por mês</Button>
  <Dialog :open="aberto" @update:open="v => { if (!busy) aberto = v }">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Visitas · {{ cliente.nome }}</DialogTitle><DialogDescription>Datas agendadas e histórico de remarcações de cada visita.</DialogDescription></DialogHeader>
      <div class="flex flex-wrap items-end justify-between gap-3"><Field label="Mês de acompanhamento" for="visita-mes"><Input id="visita-mes" v-model="mes" type="month" :disabled="busy" /></Field><Button :disabled="busy || !mes" @click="formulario()"><Plus />Agendar visita</Button></div>
      <div class="grid grid-cols-2 gap-2 rounded-xl bg-primary/5 p-3 sm:grid-cols-5">
        <div v-for="r in [{ n: resumo.total, t: 'Visitas no mês' }, { n: resumo.agendadas, t: 'Agendadas' }, { n: resumo.realizadas, t: 'Realizadas' }, { n: resumo.canceladas, t: 'Canceladas' }, { n: resumo.remarcacoes, t: 'Remarcações' }]" :key="r.t" class="rounded-lg bg-card p-3"><p class="text-xl font-bold tabular">{{ r.n }}</p><p class="text-xs text-muted-foreground">{{ r.t }}</p></div>
      </div>
      <p class="text-xs text-muted-foreground">O mês corresponde ao primeiro agendamento. Remarcar altera a data, mas não cria outra visita nem apaga o histórico. Este controle não cria eventos no Google Agenda.</p>
      <form v-if="modo" class="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-2" @submit.prevent="enviar">
        <h3 class="font-bold sm:col-span-2">{{ modo === 'nova' ? 'Nova visita' : 'Registrar remarcação' }}</h3>
        <Field :label="modo === 'nova' ? 'Data da visita' : 'Nova data'" for="visita-data"><Input id="visita-data" v-model="f.data" type="date" required :disabled="busy" /></Field>
        <Field label="Horário" for="visita-hora"><Input id="visita-hora" v-model="f.hora" type="time" :disabled="busy" /></Field>
        <template v-if="modo === 'remarcar'">
          <Field label="Quem pediu a remarcação?" for="visita-solicitante"><NativeSelect id="visita-solicitante" v-model="f.solicitadoPor" :disabled="busy"><option>Cliente</option><option>Equipe RBK</option><option>Outro</option></NativeSelect></Field>
          <Field label="Motivo / detalhes" for="visita-motivo" class="sm:col-span-2"><Textarea id="visita-motivo" v-model="f.motivo" required :disabled="busy" placeholder="Por que mudou? Registre também o nome de quem solicitou." /></Field>
        </template>
        <template v-else>
          <Field label="Local" for="visita-local" class="sm:col-span-2"><Input id="visita-local" v-model="f.local" :disabled="busy" /></Field>
          <Field label="O que será feito?" for="visita-obs" class="sm:col-span-2"><Textarea id="visita-obs" v-model="f.observacoes" :disabled="busy" placeholder="Objetivo da visita e orientações para a equipe" /></Field>
        </template>
        <p v-if="erro" role="alert" class="text-destructive text-sm sm:col-span-2">{{ erro }}</p>
        <div class="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" :disabled="busy" @click="modo = ''">Cancelar</Button><Button type="submit" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar' }}</Button></div>
      </form>
      <div class="flex flex-col gap-3">
        <p v-if="!lista.length" class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma visita cadastrada em {{ mes ? fmtMes(mes) : 'um mês selecionado' }}.</p>
        <article v-for="v in lista" :key="v.id" class="rounded-xl border p-4">
          <div class="flex flex-wrap items-center justify-between gap-2"><h3 class="font-bold">{{ fmtBR(v.data) }}<span v-if="v.hora"> · {{ v.hora }}</span></h3><div class="flex flex-wrap gap-2"><Badge :variant="v.status === 'realizada' ? 'success' : v.status === 'cancelada' ? 'muted' : 'info'">{{ status[v.status] }}</Badge><Badge :variant="(v.historico || []).length > 1 ? 'danger' : 'outline'">{{ (v.historico || []).length }} remarcações</Badge></div></div>
          <p v-if="v.data.slice(0, 7) !== mes" class="mt-1 text-xs text-primary">Remarcada para outro mês · pertence ao acompanhamento de {{ fmtMes(v.mes) }}</p>
          <p v-if="v.local" class="mt-2 text-sm">{{ v.local }}</p><p v-if="v.observacoes" class="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{{ v.observacoes }}</p>
          <div class="mt-3 flex flex-wrap gap-2"><template v-if="v.status === 'agendada'"><Button variant="outline" size="sm" :disabled="busy" @click="formulario(v)"><RotateCcw />Remarcar</Button><Button size="sm" :disabled="busy" @click="alterarStatus(v, 'realizada')">Marcar realizada</Button><Button variant="ghost" size="sm" :disabled="busy" @click="alterarStatus(v, 'cancelada')">Cancelar visita</Button></template><Button v-else variant="outline" size="sm" :disabled="busy" @click="alterarStatus(v, 'agendada')">Reabrir visita</Button></div>
          <details class="mt-3 border-t pt-3"><summary class="cursor-pointer text-sm font-semibold">Histórico de agendamento</summary><ol class="mt-3 space-y-3 border-l-2 border-primary/20 pl-4"><li class="text-sm"><p class="font-medium">Primeiro agendamento</p><p>{{ fmtBR(v.historico?.[0]?.de || v.data) }} {{ v.historico?.[0]?.horaAnterior ?? v.hora }}</p></li><li v-for="(h, index) in v.historico || []" :key="index" class="text-sm"><p class="font-semibold">{{ index + 1 }}ª remarcação · {{ h.solicitadoPor }}</p><p>{{ fmtBR(h.de) }} {{ h.horaAnterior }} → {{ fmtBR(h.para) }} {{ h.horaNova }}</p><p class="whitespace-pre-wrap text-muted-foreground">{{ h.motivo }}</p><p class="text-xs text-muted-foreground">Registrado em {{ new Date(h.registradoEm).toLocaleString('pt-BR') }}</p></li></ol></details>
        </article>
      </div>
    </DialogContent>
  </Dialog>
</template>
