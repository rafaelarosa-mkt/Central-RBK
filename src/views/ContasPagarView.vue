<script setup lang="ts">
import PagamentoData from '@/components/app/PagamentoData.vue'
import ValorInput from '@/components/app/ValorInput.vue'
import { brl, valoresVisiveis } from '@/lib/privacidade'
import ValorPrivado from '@/components/app/ValorPrivado.vue'
import { computed, reactive, ref } from 'vue'
import { Check, Pencil, Plus, Trash2, Undo2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import Field from '@/components/app/Field.vue'
import PagBadge from '@/components/app/PagBadge.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import { fmtBR, fmtMes, saldoMensal, statusConta, todayStr, validarConta, vencimentosMensais, gerarContasMensais, type ContaPagar } from '@/lib/domain'
import { ativos, pagamentos, contasPagar, db, mesAtual, demandasExtras } from '@/lib/store'
import { financeiroExtras } from '@/lib/extras'
import { salvar } from '@/lib/ui'

const busca = ref('')
const filtro = ref('todos')
const todosMeses = ref(false)
const saldo = computed(() => saldoMensal(ativos.value, pagamentos.value, contasPagar.value, mesAtual.value, financeiroExtras(demandasExtras.value, mesAtual.value, todayStr())))
const ocupado = ref(false)
const aberto = ref(false)
const atual = ref<ContaPagar | null>(null)
const erro = ref('')
const excluir = ref<ContaPagar | null>(null)
const repetir = ref(false)
const ultimoMes = ref('')
const serieId = ref('')
const previsao = computed(() => {
  if (!repetir.value) return ''
  try { const datas = vencimentosMensais(f.vencimento, ultimoMes.value); return `${datas.length} contas de ${brl(f.valor)}, de ${fmtBR(datas[0])} até ${fmtBR(datas[datas.length - 1])}.` }
  catch { return 'Escolha o primeiro vencimento e o último mês (até 120 meses).' }
})
const f = reactive({ descricao: '', fornecedor: '', categoria: '', valor: '' as string | number, vencimento: '', pago: false, pagoEm: '', observacoes: '' })
const periodo = computed(() => contasPagar.value.filter(c => todosMeses.value || c.vencimento.startsWith(mesAtual.value)))
const ativas = computed(() => periodo.value.filter(c => !c.excluida))
const totais = computed(() => ativas.value.reduce((t, c) => {
  t.total += c.valor
  if (c.pago) t.pago += c.valor
  else { t.aberto += c.valor; if (statusConta(c) === 'atrasado') t.atrasado += c.valor }
  return t
}, { total: 0, pago: 0, aberto: 0, atrasado: 0 }))
const linhas = computed(() => periodo.value
  .filter(c => filtro.value === 'excluidas' ? c.excluida : !c.excluida)
  .filter(c => ['todos', 'excluidas'].includes(filtro.value) || (filtro.value === 'pendentes' ? !c.pago : statusConta(c) === filtro.value))
  .filter(c => `${c.descricao} ${c.fornecedor} ${c.categoria}`.toLocaleLowerCase('pt-BR').includes(busca.value.trim().toLocaleLowerCase('pt-BR')))
  .sort((a, b) => Number(a.pago) - Number(b.pago) || a.vencimento.localeCompare(b.vencimento) || a.descricao.localeCompare(b.descricao, 'pt-BR')))

function editar(c?: ContaPagar) {
  repetir.value = false
  ultimoMes.value = c?.recorrenciaFim || c?.vencimento.slice(0, 7) || mesAtual.value
  serieId.value = crypto.randomUUID()
  atual.value = c ? { ...c } : null
  Object.assign(f, { descricao: c?.descricao ?? '', fornecedor: c?.fornecedor ?? '', categoria: c?.categoria ?? '', valor: c?.valor ?? '', vencimento: c?.vencimento ?? (mesAtual.value === todayStr().slice(0, 7) ? todayStr() : `${mesAtual.value}-01`), pago: c?.pago ?? false, pagoEm: c?.pagoEm || todayStr(), observacoes: c?.observacoes ?? '' })
  erro.value = ''
  aberto.value = true
}
async function enviar() {
  if (ocupado.value) return
  const dados = { ...f, descricao: f.descricao.trim(), fornecedor: f.fornecedor.trim(), categoria: f.categoria.trim(), observacoes: f.observacoes.trim(), valor: Math.round(Number(f.valor) * 100) / 100, pagoEm: f.pago ? f.pagoEm : '', tipoRegistro: 'conta_pagar' as const, atualizado: Date.now() }
  erro.value = validarConta(dados)
  if (erro.value) return
  let geradas: ContaPagar[] = []
  if (repetir.value && !atual.value?.recorrenciaId) {
    try { geradas = gerarContasMensais(dados, ultimoMes.value, serieId.value, atual.value?.id) }
    catch (e) { erro.value = e instanceof Error ? e.message : 'Período inválido.'; return }
  }
  ocupado.value = true
  const ok = await salvar(() => geradas.length
    ? db.salvarLote('pagamentos', geradas.map(({ id, ...campos }) => ({ id, dados: campos })))
    : atual.value ? db.atualizar('pagamentos', atual.value.id, dados) : db.criar('pagamentos', dados), geradas.length ? `${geradas.length} contas mensais salvas` : 'Conta salva')
  ocupado.value = false
  if (ok) {
    mesAtual.value = dados.vencimento.slice(0, 7)
    filtro.value = 'todos'; busca.value = ''; aberto.value = false
  }
}
async function alterar(c: ContaPagar, dados: Record<string, unknown>, mensagem: string) {
  if (ocupado.value) return
  ocupado.value = true
  const ok = await salvar(() => db.atualizar('pagamentos', c.id, { ...dados, atualizado: Date.now() }), mensagem)
  ocupado.value = false
  if (ok) excluir.value = null
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader titulo="Contas a pagar" :sub="todosMeses ? 'Despesas de todos os períodos.' : `Despesas com vencimento em ${fmtMes(mesAtual)}.`">
      <Button @click="editar()" :disabled="ocupado"><Plus />Nova conta</Button>
    </PageHeader>
    <Card class="gap-4">
      <CardHeader>
        <CardTitle>Saldo previsto de {{ fmtMes(mesAtual) }}</CardTitle>
        <CardDescription>Entradas em dinheiro das mensalidades e demandas extras menos as despesas com vencimento neste mês. Inclui valores já recebidos e pagos.</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
          <div class="bg-secondary rounded-lg p-4"><p class="text-muted-foreground text-sm">Entradas previstas</p><p class="mt-1 text-xl font-bold tabular"><ValorPrivado :valor="saldo.entradas" /></p><p class="text-muted-foreground mt-2 text-xs"><ValorPrivado :valor="saldo.recebido" /> recebidos · <ValorPrivado :valor="saldo.aReceber" /> a receber</p></div>
          <div class="bg-secondary rounded-lg p-4"><p class="text-muted-foreground text-sm">Despesas previstas</p><p class="mt-1 text-xl font-bold tabular"><ValorPrivado :valor="saldo.despesas" /></p><p class="text-muted-foreground mt-2 text-xs"><ValorPrivado :valor="saldo.pago" /> pagos · <ValorPrivado :valor="saldo.aPagar" /> a pagar</p></div>
          <div class="bg-secondary rounded-lg p-4"><p class="text-muted-foreground text-sm">Vai sobrar no mês</p><p :class="['mt-1 text-xl font-bold tabular', saldo.sobra > 0 && 'text-success']"><ValorPrivado :valor="saldo.sobra" /></p><p class="text-muted-foreground mt-2 text-xs">Após cobrir todas as despesas previstas.</p></div>
          <div class="bg-secondary rounded-lg p-4"><p class="text-muted-foreground text-sm">Vai faltar no mês</p><p :class="['mt-1 text-xl font-bold tabular', saldo.falta > 0 && 'text-destructive']"><ValorPrivado :valor="saldo.falta" /></p><p class="text-muted-foreground mt-2 text-xs">Valor adicional necessário para cobrir o mês.</p></div>
        </div>
        <p :class="['text-sm font-semibold', saldo.saldo < 0 ? 'text-destructive' : saldo.saldo > 0 ? 'text-success' : 'text-muted-foreground']">{{ saldo.saldo > 0 ? `Previsão de sobra de ${brl(saldo.sobra)}.` : saldo.saldo < 0 ? `As despesas superam as entradas em ${brl(saldo.falta)}.` : 'Entradas e despesas previstas estão equilibradas.' }}</p>
        <p class="text-muted-foreground text-xs">Projeção, não saldo bancário. Não inclui saldo anterior, permutas, cobranças dispensadas ou contas excluídas. Sempre considera o mês selecionado no topo, mesmo ao listar todos os meses.</p>
        <RouterLink to="/financeiro" class="text-primary text-sm font-semibold underline underline-offset-4">Ver contas a receber deste mês</RouterLink>
      </CardContent>
    </Card>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
      <Card class="gap-1"><CardHeader><CardDescription>Total de despesas</CardDescription><CardTitle class="text-xl tabular"><ValorPrivado :valor="totais.total" /></CardTitle></CardHeader></Card>
      <Card class="gap-1"><CardHeader><CardDescription>Pago</CardDescription><CardTitle class="text-success text-xl tabular"><ValorPrivado :valor="totais.pago" /></CardTitle></CardHeader></Card>
      <Card class="gap-1"><CardHeader><CardDescription>A pagar</CardDescription><CardTitle class="text-xl tabular"><ValorPrivado :valor="totais.aberto" /></CardTitle></CardHeader></Card>
      <Card class="gap-1"><CardHeader><CardDescription>Em atraso</CardDescription><CardTitle class="text-destructive text-xl tabular"><ValorPrivado :valor="totais.atrasado" /></CardTitle></CardHeader></Card>
    </div>
    <Card>
      <CardHeader class="gap-3">
        <CardTitle>Despesas</CardTitle>
        <CardDescription>Totais por vencimento, sem contas excluídas. Registrar como paga apenas atualiza o controle da Central.</CardDescription>
        <div class="flex flex-col gap-3 sm:flex-row">
          <Input v-model="busca" placeholder="Buscar descrição, fornecedor ou categoria…" aria-label="Buscar despesas" />
          <NativeSelect v-model="filtro" aria-label="Filtrar despesas" class="sm:max-w-52">
            <option value="todos">Todas as contas</option><option value="pendentes">A pagar</option><option value="atrasado">Em atraso</option><option value="hoje">Vencem hoje</option><option value="aberto">A vencer</option><option value="pago">Pagas</option><option value="excluidas">Excluídas</option>
          </NativeSelect>
        </div>
        <label class="flex items-center gap-2 text-sm"><input v-model="todosMeses" type="checkbox" class="accent-primary size-4">Mostrar todos os meses</label>
      </CardHeader>
      <CardContent class="px-0">
        <div v-if="!linhas.length" class="text-muted-foreground grid justify-items-center gap-3 px-5 py-10 text-center">
          <p>Nenhuma conta encontrada neste período com esses filtros.</p><Button variant="outline" @click="editar()" :disabled="ocupado"><Plus />Cadastrar conta</Button>
        </div>
        <div v-for="c in linhas" :key="c.id" class="flex flex-wrap items-center gap-3 border-t px-5 py-4">
          <div class="min-w-0 flex-[1_1_200px]">
            <p class="font-semibold break-words">{{ c.descricao }}</p>
            <p v-if="c.fornecedor || c.categoria" class="text-muted-foreground text-xs break-words">{{ [c.fornecedor, c.categoria].filter(Boolean).join(' · ') }}</p>
            <p class="text-muted-foreground text-xs">Vence em {{ fmtBR(c.vencimento) }}<template v-if="c.pago"> · pago em {{ fmtBR(c.pagoEm) }}</template></p>
            <p v-if="c.recorrenciaFim" class="text-muted-foreground text-xs">Mensal · {{ c.parcela }}/{{ c.totalParcelas }} · até {{ fmtMes(c.recorrenciaFim) }}</p>
          </div>
          <span v-if="c.excluida" class="text-muted-foreground text-sm">Excluída</span><PagBadge v-else :status="statusConta(c)" />
          <span class="min-w-0 max-w-full text-right font-bold tabular"><ValorPrivado :valor="c.valor" /></span>
          <div class="flex flex-wrap gap-1.5">
            <Button v-if="c.excluida" variant="outline" size="sm" :disabled="ocupado" @click="alterar(c, { excluida: false }, 'Conta restaurada')"><Undo2 />Restaurar</Button>
            <template v-else>
              <Button variant="ghost" size="sm" :disabled="ocupado" @click="editar(c)"><Pencil />Editar</Button>
              <Button v-if="c.pago" variant="outline" size="sm" :disabled="ocupado" @click="alterar(c, { pago: false, pagoEm: '' }, 'Pagamento desfeito')"><Undo2 />Desfazer pagamento</Button>
              <PagamentoData v-else :titulo="c.descricao" :salvar-data="data => salvar(() => db.atualizar('pagamentos', c.id, { pago: true, pagoEm: data }), 'Pagamento registrado')" />
              <Button variant="ghost" size="icon-sm" :aria-label="`Excluir ${c.descricao}`" :disabled="ocupado" @click="excluir = c"><Trash2 /></Button>
            </template>
          </div>
        </div>
      </CardContent>
    </Card>
    <Dialog :open="aberto" @update:open="v => !ocupado && (aberto = v)">
      <DialogContent>
        <DialogHeader><DialogTitle>{{ atual ? 'Editar conta' : 'Nova conta a pagar' }}</DialogTitle><DialogDescription>Cadastre uma despesa e acompanhe seu pagamento.</DialogDescription></DialogHeader>
        <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="enviar">
          <Field label="Descrição" for="cpDescricao" class="sm:col-span-2"><Input id="cpDescricao" v-model="f.descricao" required maxlength="200" placeholder="Ex.: edição de vídeos, aluguel, assinatura" :disabled="ocupado" /></Field>
          <Field label="Fornecedor / beneficiário" for="cpFornecedor"><Input id="cpFornecedor" v-model="f.fornecedor" maxlength="150" :disabled="ocupado" /></Field>
          <Field label="Categoria" for="cpCategoria"><Input id="cpCategoria" v-model="f.categoria" maxlength="80" placeholder="Ex.: software, produção" :disabled="ocupado" /></Field>
          <Field label="Valor (R$)" for="cpValor"><ValorInput id="cpValor" v-model="f.valor" type="number" min="0.01" step="0.01" required :disabled="ocupado" /></Field>
          <Field :label="repetir ? 'Primeiro vencimento' : 'Vencimento'" for="cpVencimento"><Input id="cpVencimento" v-model="f.vencimento" type="date" required :disabled="ocupado" /></Field>
          <template v-if="!atual?.recorrenciaId">
            <label class="flex items-center gap-2 text-sm sm:col-span-2"><input v-model="repetir" type="checkbox" class="accent-primary size-4" :disabled="ocupado">Repetir todos os meses</label>
            <Field v-if="repetir" label="Último mês (inclusive)" for="cpUltimoMes" class="sm:col-span-2"><Input id="cpUltimoMes" v-model="ultimoMes" type="month" :min="f.vencimento.slice(0, 7)" required :disabled="ocupado" /></Field>
            <p v-if="repetir" class="text-muted-foreground text-xs sm:col-span-2">{{ previsao }} O valor é mensal. Em meses mais curtos, o vencimento cai no último dia. Cada mês terá seu próprio pagamento.</p>
          </template>
          <p v-else class="text-muted-foreground text-xs sm:col-span-2">Conta mensal {{ atual.parcela }}/{{ atual.totalParcelas }}, até {{ fmtMes(atual.recorrenciaFim!) }}. Esta edição altera somente esta conta.</p>
          <label class="flex items-center gap-2 text-sm"><input v-model="f.pago" type="checkbox" class="accent-primary size-4" :disabled="ocupado">{{ repetir ? 'Primeira conta já paga' : 'Conta já paga' }}</label>
          <Field v-if="f.pago" label="Data do pagamento" for="cpPagamento"><Input id="cpPagamento" v-model="f.pagoEm" type="date" :max="todayStr()" required :disabled="ocupado" /></Field>
          <Field label="Observações" for="cpObs" class="sm:col-span-2"><Textarea id="cpObs" v-model="f.observacoes" maxlength="5000" :disabled="ocupado" /></Field>
          <p v-if="erro" role="alert" class="text-destructive text-sm sm:col-span-2">{{ erro }}</p>
          <DialogFooter class="sm:col-span-2"><Button type="button" variant="outline" :disabled="ocupado" @click="aberto = false">Cancelar</Button><Button type="submit" :disabled="ocupado">{{ ocupado ? 'Salvando…' : 'Salvar conta' }}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog :open="!!excluir" @update:open="v => !v && !ocupado && (excluir = null)">
      <DialogContent><DialogHeader><DialogTitle>Excluir conta?</DialogTitle><DialogDescription>{{ excluir?.descricao }} · <ValorPrivado :valor="excluir?.valor" />. A conta sai dos totais e pode ser restaurada no filtro Excluídas.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" :disabled="ocupado" @click="excluir = null">Cancelar</Button><Button :disabled="ocupado" @click="excluir && alterar(excluir, { excluida: true }, 'Conta excluída; você pode restaurá-la')">Excluir conta</Button></DialogFooter></DialogContent>
    </Dialog>
  </div>
</template>
