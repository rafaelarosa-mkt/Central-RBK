<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, MessageCircle, Undo2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Progress } from '@/components/ui/progress'
import ClientDot from '@/components/app/ClientDot.vue'
import PagBadge from '@/components/app/PagBadge.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyClientes from '@/components/app/EmptyClientes.vue'
import { brl, fmtD, fmtMes, pagStatus, todayStr, vencData, type Cliente } from '@/lib/domain'
import { ativos, db, mesAtual, pagamentos } from '@/lib/store'
import { abrir, salvar } from '@/lib/ui'

const linhas = computed(() => ativos.value.map(c => {
  const p = pagamentos.value[`${c.id}_${mesAtual.value}`]
  return { c, p, st: pagStatus(c, mesAtual.value, pagamentos.value), val: Number(p?.valor ?? c.valor) || 0 }
}))
const tot = computed(() => {
  let prev = 0, rec = 0, atr = 0
  for (const l of linhas.value) { prev += l.val; if (l.st === 'pago') rec += l.val; if (l.st === 'atrasado') atr += l.val }
  return { prev, rec, atr, aRec: prev - rec }
})
const busca = ref('')
const filtro = ref('todos')
const ordem = { atrasado: 0, hoje: 1, aberto: 2, sem: 3, pago: 4 }
const filtradas = computed(() => linhas.value
  .filter(l => l.c.nome.toLocaleLowerCase('pt-BR').includes(busca.value.trim().toLocaleLowerCase('pt-BR')))
  .filter(l => filtro.value === 'todos' || (filtro.value === 'pendentes' ? l.st !== 'pago' : l.st === filtro.value))
  .sort((a, b) => ordem[a.st] - ordem[b.st] || (a.c.diaPgto || 32) - (b.c.diaPgto || 32) || a.c.nome.localeCompare(b.c.nome, 'pt-BR')))
const percentual = computed(() => tot.value.prev > 0 ? Math.min(100, Math.max(0, tot.value.rec / tot.value.prev * 100)) : 0)
const recebidos = computed(() => linhas.value.filter(l => l.st === 'pago').length)
const venceHoje = computed(() => linhas.value.filter(l => l.st === 'hoje').reduce((total, l) => total + l.val, 0))
const id = (c: Cliente) => `${c.id}_${mesAtual.value}`
const pagar = (c: Cliente) => salvar(() => db.salvar('pagamentos', id(c), { clientId: c.id, mes: mesAtual.value, pago: true, pagoEm: todayStr(), valor: Number(pagamentos.value[id(c)]?.valor ?? c.valor) || 0 }), `${c.nome}: pagamento registrado`)
const desfazer = (c: Cliente) => salvar(() => db.salvar('pagamentos', id(c), { clientId: c.id, mes: mesAtual.value, pago: false, valor: Number(pagamentos.value[id(c)]?.valor ?? c.valor) || 0 }), 'Pagamento desfeito')
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader titulo="Financeiro" :sub="`Pagamentos de ${fmtMes(mesAtual)}.`" />
    <EmptyClientes v-if="!ativos.length" />
    <template v-else>
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card class="gap-1"><CardHeader><CardDescription>Previsto</CardDescription><CardTitle class="text-2xl font-extrabold tabular">{{ brl(tot.prev) }}</CardTitle></CardHeader></Card>
        <Card class="gap-1"><CardHeader><CardDescription>Recebido</CardDescription><CardTitle class="text-success text-2xl font-extrabold tabular">{{ brl(tot.rec) }}</CardTitle></CardHeader></Card>
        <Card class="gap-1"><CardHeader><CardDescription>A receber</CardDescription><CardTitle class="text-2xl font-extrabold tabular">{{ brl(tot.aRec) }}</CardTitle></CardHeader></Card>
        <Card class="gap-1"><CardHeader><CardDescription>Atrasado</CardDescription><CardTitle :class="['text-2xl font-extrabold tabular', tot.atr && 'text-destructive']">{{ brl(tot.atr) }}</CardTitle></CardHeader></Card>
      </div>
      <Card>
        <CardHeader class="gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Recebimentos do mês</CardTitle>
            <span class="text-success text-xl font-bold tabular">{{ percentual.toFixed(0) }}%</span>
          </div>
          <Progress :model-value="percentual" aria-label="Percentual do valor previsto recebido" />
          <CardDescription>{{ recebidos }} de {{ linhas.length }} clientes pagos · {{ brl(venceHoje) }} vencem hoje</CardDescription>
        </CardHeader>
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
            </NativeSelect>
          </div>
        </CardHeader>
        <CardContent class="px-0">
          <p v-if="!filtradas.length" class="text-muted-foreground px-5 py-10 text-center text-sm">Nenhum cliente encontrado com esses filtros.</p>
          <div v-for="{ c, p, st, val } in filtradas" :key="c.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-5 py-3.5 first:border-t-0">
            <div class="flex min-w-0 flex-[1_1_220px] items-center gap-2.5">
              <ClientDot :cliente="c" />
              <div class="min-w-0">
                <p class="truncate font-semibold">{{ c.nome }}</p>
                <p class="text-muted-foreground text-xs">{{ c.diaPgto ? `Vence em ${fmtD(vencData(c, mesAtual) || undefined)}` : 'Sem dia de pagamento' }}<template v-if="st === 'pago' && p?.pagoEm"> · pago em {{ fmtD(p.pagoEm) }}</template><template v-if="c.obsPgto"> · {{ c.obsPgto }}</template></p>
              </div>
            </div>
            <PagBadge :status="st" />
            <span class="w-28 text-right font-bold tabular">{{ brl(val) }}</span>
            <div class="flex gap-1.5">
              <Button v-if="st === 'pago'" variant="ghost" size="sm" @click="desfazer(c)"><Undo2 />Desfazer</Button>
              <template v-else>
                <Button variant="outline" size="sm" @click="abrir({ tipo: 'cobranca', cliente: c, mes: mesAtual })"><MessageCircle />Mensagem</Button>
                <Button size="sm" @click="pagar(c)"><Check />Marcar pago</Button>
              </template>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
