<script setup lang="ts">
import { computed } from 'vue'
import { Check, MessageCircle, Undo2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ClientDot from '@/components/app/ClientDot.vue'
import PagBadge from '@/components/app/PagBadge.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyClientes from '@/components/app/EmptyClientes.vue'
import { brl, fmtD, fmtMes, pagStatus, todayStr, type Cliente } from '@/lib/domain'
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
const id = (c: Cliente) => `${c.id}_${mesAtual.value}`
const pagar = (c: Cliente) => salvar(() => db.salvar('pagamentos', id(c), { clientId: c.id, mes: mesAtual.value, pago: true, pagoEm: todayStr(), valor: Number(c.valor) || 0 }), `${c.nome}: pagamento registrado`)
const desfazer = (c: Cliente) => salvar(() => db.salvar('pagamentos', id(c), { clientId: c.id, mes: mesAtual.value, pago: false }), 'Pagamento desfeito')
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
      <Card class="gap-0 py-2">
        <CardContent class="px-0">
          <div v-for="{ c, p, st, val } in linhas" :key="c.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-5 py-3.5 first:border-t-0">
            <div class="flex min-w-0 flex-[1_1_220px] items-center gap-2.5">
              <ClientDot :cliente="c" />
              <div class="min-w-0">
                <p class="truncate font-semibold">{{ c.nome }}</p>
                <p class="text-muted-foreground text-xs">{{ c.diaPgto ? `Vence dia ${c.diaPgto}` : 'Sem dia de pagamento' }}<template v-if="st === 'pago' && p?.pagoEm"> · pago em {{ fmtD(p.pagoEm) }}</template><template v-if="c.obsPgto"> · {{ c.obsPgto }}</template></p>
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
