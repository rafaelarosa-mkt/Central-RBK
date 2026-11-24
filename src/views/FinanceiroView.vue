<script setup lang="ts">
import PagamentoData from '@/components/app/PagamentoData.vue'
import ValorInput from '@/components/app/ValorInput.vue'
import { brl, valoresVisiveis } from '@/lib/privacidade'
import ValorPrivado from '@/components/app/ValorPrivado.vue'
import { computed, reactive, ref } from 'vue'
import { Check, MessageCircle, Undo2, Pencil } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Field from '@/components/app/Field.vue'
import ClientDot from '@/components/app/ClientDot.vue'
import PagBadge from '@/components/app/PagBadge.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyClientes from '@/components/app/EmptyClientes.vue'
import { fmtD, fmtMes, pagStatus, todayStr, vencData, valoresPagamento, type Cliente } from '@/lib/domain'
import { ativos, db, mesAtual, pagamentos, demandasExtras, clientesPorId } from '@/lib/store'
import { abrir, salvar } from '@/lib/ui'

import { financeiroExtras, type DemandaExtra } from '@/lib/extras'
const extras = computed(() => financeiroExtras(demandasExtras.value, mesAtual.value, todayStr()))
const extraBusy = ref(false)
async function pagarExtra(d: DemandaExtra) {
  if (extraBusy.value) return
  extraBusy.value = true
  await salvar(() => db.atualizar('itens', d.id, { pagoExtra: !d.pagoExtra, pagoEmExtra: d.pagoExtra ? '' : todayStr() }), d.pagoExtra ? 'Recebimento desfeito' : 'Recebimento extra registrado')
  extraBusy.value = false
}
const linhas = computed(() => ativos.value.map(c => {
  const p = pagamentos.value[`${c.id}_${mesAtual.value}`]
  const valores = valoresPagamento(c, p)
  return { c, p, st: pagStatus(c, mesAtual.value, pagamentos.value), val: valores.dinheiro, permuta: valores.permuta }
}))
const tot = computed(() => {
  let prev = extras.value.previsto, rec = extras.value.recebido, atr = extras.value.atrasado, permuta = 0
  for (const l of linhas.value) { prev += l.val; permuta += l.permuta; if (l.st === 'pago') rec += l.val; if (l.st === 'atrasado') atr += l.val }
  return { prev, rec, atr, permuta, aRec: prev - rec }
})
const busca = ref('')
const filtro = ref('todos')
const ordem = { atrasado: 0, hoje: 1, aberto: 2, sem: 3, pago: 4, permuta: 5, dispensado: 6 }
const filtradas = computed(() => linhas.value
  .filter(l => l.c.nome.toLocaleLowerCase('pt-BR').includes(busca.value.trim().toLocaleLowerCase('pt-BR')))
  .filter(l => filtro.value === 'todos' || (filtro.value === 'pendentes' ? l.st !== 'pago' && l.st !== 'dispensado' && l.val > 0 : l.st === filtro.value))
  .sort((a, b) => ordem[a.st] - ordem[b.st] || (a.c.diaPgto || 32) - (b.c.diaPgto || 32) || a.c.nome.localeCompare(b.c.nome, 'pt-BR')))
const percentual = computed(() => tot.value.prev > 0 ? Math.min(100, Math.max(0, tot.value.rec / tot.value.prev * 100)) : 0)
const recebidos = computed(() => linhas.value.filter(l => l.st === 'pago' && l.val > 0).length + extras.value.linhas.filter(d => d.pagoExtra).length)
const cobrados = computed(() => linhas.value.filter(l => l.st !== 'dispensado' && l.val > 0).length + extras.value.linhas.length)
const venceHoje = computed(() => linhas.value.filter(l => l.st === 'hoje').reduce((total, l) => total + l.val, extras.value.venceHoje))
const id = (c: Cliente) => `${c.id}_${mesAtual.value}`
const base = (c: Cliente) => ({ ...pagamentos.value[id(c)], clientId: c.id, mes: mesAtual.value, valor: Number(pagamentos.value[id(c)]?.valor ?? c.valor) || 0, valorPermuta: Number(pagamentos.value[id(c)]?.valorPermuta ?? c.valorPermuta) || 0 })
const pagar = (c: Cliente, mes: string, data: string) => salvar(() => db.atualizar('pagamentos', `${c.id}_${mes}`, { clientId: c.id, mes, valor: Number(pagamentos.value[`${c.id}_${mes}`]?.valor ?? c.valor) || 0, valorPermuta: Number(pagamentos.value[`${c.id}_${mes}`]?.valorPermuta ?? c.valorPermuta) || 0, pago: true, pagoEm: data }), `${c.nome}: pagamento registrado`)
const registrar = (c: Cliente, mes: string) => (data: string) => pagar(c, mes, data)
const desfazer = (c: Cliente) => salvar(() => db.salvar('pagamentos', id(c), { ...base(c), pago: false, pagoEm: '' }), 'Pagamento desfeito')
const reativar = (c: Cliente) => salvar(() => db.salvar('pagamentos', id(c), { ...base(c), pago: false, naoCobrar: false, motivo: '' }), 'Cobrança reativada neste mês')
const edicao = ref<{ cliente: Cliente; mes: string } | null>(null)
const f = reactive({ valor: 0 as number | string, valorPermuta: 0 as number | string, naoCobrar: false, motivo: '' })
const gravando = ref(false)
const erro = ref('')
const pagoNaEdicao = computed(() => edicao.value && pagamentos.value[`${edicao.value.cliente.id}_${edicao.value.mes}`]?.pago)
function editar(c: Cliente) {
  const p = pagamentos.value[id(c)]
  edicao.value = { cliente: c, mes: mesAtual.value }
  Object.assign(f, { valor: p?.valor ?? c.valor ?? 0, valorPermuta: p?.valorPermuta ?? c.valorPermuta ?? 0, naoCobrar: p?.naoCobrar ?? false, motivo: p?.motivo ?? '' })
  erro.value = ''
}
async function salvarMes() {
  if (!edicao.value || gravando.value) return
  if (![f.valor, f.valorPermuta].every(v => Number.isFinite(Number(v)) && Number(v) >= 0)) { erro.value = 'Informe valores válidos, iguais ou maiores que zero.'; return }
  const { cliente: c, mes } = edicao.value
  const chave = `${c.id}_${mes}`
  const p = pagamentos.value[chave]
  if (p?.pago && (f.naoCobrar || Number(f.valor) !== Number(p.valor ?? c.valor ?? 0))) { erro.value = 'Desfaça o pagamento antes de alterar o valor recebido ou dispensar a cobrança.'; return }
  gravando.value = true
  const ok = await salvar(() => db.salvar('pagamentos', chave, {
    ...p, clientId: c.id, mes, pago: p?.pago ?? false,
    valor: Number(f.valor), valorPermuta: Number(f.valorPermuta), naoCobrar: f.naoCobrar, motivo: f.motivo.trim(),
  }), f.naoCobrar ? 'Cobrança dispensada somente neste mês' : 'Valores deste mês salvos')
  gravando.value = false
  if (ok) edicao.value = null
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader titulo="Financeiro" :sub="`Pagamentos de ${fmtMes(mesAtual)}.`" />
    <EmptyClientes v-if="!ativos.length && !extras.linhas.length" />
    <template v-else>
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card class="gap-1"><CardHeader><CardDescription>Previsto em dinheiro</CardDescription><CardTitle class="text-2xl font-extrabold tabular"><ValorPrivado :valor="tot.prev" /></CardTitle></CardHeader></Card>
        <Card class="gap-1"><CardHeader><CardDescription>Recebido em dinheiro</CardDescription><CardTitle class="text-success text-2xl font-extrabold tabular"><ValorPrivado :valor="tot.rec" /></CardTitle></CardHeader></Card>
        <Card class="gap-1"><CardHeader><CardDescription>A receber</CardDescription><CardTitle class="text-2xl font-extrabold tabular"><ValorPrivado :valor="tot.aRec" /></CardTitle></CardHeader></Card>
        <Card class="gap-1"><CardHeader><CardDescription>Atrasado</CardDescription><CardTitle :class="['text-2xl font-extrabold tabular', tot.atr && 'text-destructive']"><ValorPrivado :valor="tot.atr" /></CardTitle></CardHeader></Card>
        <Card class="gap-1"><CardHeader><CardDescription>Permuta prevista</CardDescription><CardTitle class="text-2xl font-extrabold tabular"><ValorPrivado :valor="tot.permuta" /></CardTitle></CardHeader></Card>
      </div>
      <Card>
        <CardHeader class="gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Recebimentos do mês</CardTitle>
            <span class="text-success text-xl font-bold tabular">{{ valoresVisiveis ? percentual.toFixed(0) + '%' : '****' }}</span>
          </div>
          <Progress v-if="valoresVisiveis" :model-value="percentual" aria-label="Percentual do valor previsto recebido" />
          <CardDescription>{{ recebidos }} de {{ cobrados }} cobranças em dinheiro pagas · <ValorPrivado :valor="venceHoje" /> vencem hoje. Permutas são acompanhadas separadamente.</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recebimentos de demandas extras</CardTitle><CardDescription>Cobranças únicas com vencimento neste mês, já incluídas nos totais acima. Arquivar uma demanda não cancela sua cobrança.</CardDescription></CardHeader>
        <CardContent class="grid gap-3">
          <p v-if="!extras.linhas.length" class="text-sm text-muted-foreground">Nenhuma cobrança extra neste mês.</p>
          <div v-for="d in extras.linhas" :key="d.id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
            <div class="min-w-0 flex-1"><p class="font-semibold break-words">{{ d.titulo }}</p><p class="text-xs text-muted-foreground">{{ d.atendimento === 'avulso' ? d.clienteAvulso : clientesPorId[d.clientId]?.nome || 'Cliente removido' }} · Vence {{ fmtD(d.vencimentoExtra) }}<span v-if="d.pagoExtra"> · Recebido {{ fmtD(d.pagoEmExtra) }}</span></p></div>
            <div class="text-right"><p class="font-bold"><ValorPrivado :valor="d.valorExtra" /></p><p :class="['text-xs', !d.pagoExtra && d.vencimentoExtra! < todayStr() ? 'text-destructive' : 'text-muted-foreground']">{{ d.pagoExtra ? 'Recebido' : d.vencimentoExtra! < todayStr() ? 'Em atraso' : 'A receber' }}</p></div>
            <PagamentoData :titulo="d.titulo" :data-inicial="d.pagoExtra ? d.pagoEmExtra : undefined" :rotulo="d.pagoExtra ? 'Editar data' : 'Marcar recebido'" :salvar-data="data => salvar(() => db.atualizar('itens', d.id, { pagoExtra: true, pagoEmExtra: data }), 'Data do recebimento salva')" /><Button v-if="d.pagoExtra" size="sm" variant="outline" :disabled="extraBusy" @click="pagarExtra(d)">Desfazer recebimento</Button>
          </div>
          <RouterLink to="/producao?area=extras" class="text-primary text-sm underline">Abrir demandas extras para editar valores</RouterLink>
        </CardContent>
      </Card>
      <Card class="gap-0 py-2">
        <CardHeader class="gap-4 pb-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Cobranças</CardTitle>
            <span class="text-muted-foreground text-sm">{{ filtradas.length }} de {{ linhas.length }} clientes</span>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row">
            <Input v-model="busca" aria-label="Buscar cliente" placeholder="Buscar cliente…" class="sm:flex-1" />
            <NativeSelect v-model="filtro" aria-label="Filtrar pagamentos" class="sm:max-w-56">
              <option value="todos">Todos os pagamentos</option>
              <option value="pendentes">A receber</option>
              <option value="atrasado">Atrasados</option>
              <option value="hoje">Vencem hoje</option>
              <option value="aberto">A vencer</option>
              <option value="pago">Pagos</option>
              <option value="sem">Sem vencimento</option>
              <option value="permuta">Somente permuta</option>
              <option value="dispensado">Não cobrar neste mês</option>
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent class="px-0">
          <p v-if="!filtradas.length" class="text-muted-foreground px-5 py-10 text-center text-sm">Nenhum cliente encontrado com esses filtros.</p>
          <div v-for="{ c, p, st, val, permuta } in filtradas" :key="c.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-5 py-3.5 first:border-t-0">
            <div class="flex min-w-0 flex-[1_1_220px] items-center gap-2.5">
              <ClientDot :cliente="c" />
              <div class="min-w-0">
                <p class="truncate font-semibold">{{ c.nome }}</p>
                <p class="text-muted-foreground text-xs">{{ st === 'dispensado' ? (p?.motivo || 'Sem prestação de serviço neste mês') : c.diaPgto ? `Vence em ${fmtD(vencData(c, mesAtual) || undefined)}` : 'Sem dia de pagamento' }}<template v-if="st === 'pago' && p?.pagoEm"> · pago em {{ fmtD(p.pagoEm) }}</template><template v-if="c.obsPgto"> · {{ c.obsPgto }}</template></p>
              </div>
            </div>
            <PagBadge :status="st" />
            <div class="min-w-32 text-right tabular"><p class="font-bold"><ValorPrivado :valor="val" /> <span class="text-muted-foreground text-xs font-normal">dinheiro</span></p><p class="text-muted-foreground text-xs"><ValorPrivado :valor="permuta" /> em permuta</p></div>
            <div class="flex flex-wrap gap-1.5">
              <Button variant="ghost" size="sm" @click="editar(c)"><Pencil />Editar mês</Button>
              <Button v-if="st === 'dispensado'" variant="outline" size="sm" @click="reativar(c)"><Undo2 />Reativar cobrança</Button>
              <PagamentoData v-if="st === 'pago'" :titulo="c.nome" rotulo="Editar data" :data-inicial="p?.pagoEm" :salvar-data="registrar(c, mesAtual)" /><Button v-if="st === 'pago'" variant="ghost" size="sm" @click="desfazer(c)"><Undo2 />Desfazer</Button>
              <template v-else-if="st !== 'dispensado' && val > 0">
                <Button variant="outline" size="sm" @click="abrir({ tipo: 'cobranca', cliente: c, mes: mesAtual })"><MessageCircle />Mensagem</Button>
                <PagamentoData :titulo="c.nome" :salvar-data="registrar(c, mesAtual)" />
              </template>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
    <Dialog :open="!!edicao" @update:open="v => !v && !gravando && (edicao = null)">
      <DialogContent>
        <DialogHeader><DialogTitle>Valores deste mês</DialogTitle><DialogDescription>{{ edicao?.cliente.nome }} · {{ edicao ? fmtMes(edicao.mes) : '' }}. Altera somente este mês; os valores do cadastro e dos outros meses são preservados.</DialogDescription></DialogHeader>
        <form class="grid gap-4" @submit.prevent="salvarMes">
          <Field label="Valor a receber em dinheiro (R$)" for="fDinheiro"><ValorInput id="fDinheiro" v-model="f.valor" type="number" min="0" step="0.01" required :disabled="!!pagoNaEdicao || gravando" /></Field>
          <Field label="Valor em permuta (R$)" for="fPermuta"><ValorInput id="fPermuta" v-model="f.valorPermuta" type="number" min="0" step="0.01" required :disabled="gravando" /></Field>
          <label class="flex items-center gap-2 text-sm"><input v-model="f.naoCobrar" type="checkbox" class="accent-primary size-4" :disabled="!!pagoNaEdicao || gravando">Não cobrar neste mês</label>
          <p class="text-muted-foreground text-xs">Ao dispensar, dinheiro e permuta saem dos totais deste mês. Os valores ficam guardados para você reativar a cobrança.</p>
          <p v-if="pagoNaEdicao" class="text-muted-foreground text-xs">Para dispensar ou corrigir o valor em dinheiro, desfaça o pagamento primeiro.</p>
          <Field label="Motivo / observação" for="fMotivo"><Input id="fMotivo" v-model="f.motivo" placeholder="Ex.: não faremos o serviço neste mês" :disabled="gravando" /></Field>
          <p v-if="erro" role="alert" class="text-destructive text-sm">{{ erro }}</p>
          <DialogFooter><Button type="button" variant="outline" :disabled="gravando" @click="edicao = null">Cancelar</Button><Button type="submit" :disabled="gravando">{{ gravando ? 'Salvando…' : 'Salvar mês' }}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
