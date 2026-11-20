<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarPlus, ChevronRight, MessageCircle, Check } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import ClientDot from '@/components/app/ClientDot.vue'
import PagBadge from '@/components/app/PagBadge.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyClientes from '@/components/app/EmptyClientes.vue'
import {
  STATUS, LBL, TIPOS_EV, addDias, brl, contrato, ctLabel, fmtBR, fmtD, fmtLongo, fmtMes, pad,
  pagStatus, prog, todayStr, vencData, valoresPagamento, ymNow, type Cliente,
} from '@/lib/domain'
import { agenda, ativos, clientesPorId, db, itens, mesAtual, pagamentos, demandasExtras } from '@/lib/store'
import { financeiroExtras } from '@/lib/extras'
import { abrir, salvar } from '@/lib/ui'
import { useGoogleCalendar } from '@/lib/google-calendar'

const router = useRouter()
const hoje = todayStr()
const cur = ymNow()
const { events: eventosGoogle, connected: googleConectado, checking: verificandoGoogle, busy: atualizandoGoogle, error: erroGoogle, syncedAt, sync } = useGoogleCalendar(ref(hoje.slice(0, 7)))
const compromissosHoje = computed(() => [...agenda.value, ...eventosGoogle.value]
  .filter(e => e.data === hoje)
  .sort((a, b) => (a.hora || '00:00').localeCompare(b.hora || '00:00')))

const linhas = computed(() => ativos.value.map(c => ({
  c, p: prog(c, mesAtual.value, itens.value), st: pagStatus(c, mesAtual.value, pagamentos.value),
})))

const totais = computed(() => {
  const extras = financeiroExtras(demandasExtras.value, mesAtual.value, hoje)
  let meta = 0, grav = 0, metaP = 0, postF = 0, aProg = 0, rec = extras.recebido, prev = extras.previsto
  for (const { c, p, st } of linhas.value) {
    meta += Number(c.videosMes) || 0; grav += p.vGrav
    metaP += Number(c.postsMes) || 0; postF += p.pFeito; aProg += p.aProg
    const v = valoresPagamento(c, pagamentos.value[`${c.id}_${mesAtual.value}`]).dinheiro
    prev += v
    if (st === 'pago') rec += v
  }
  return { meta, grav, metaP, postF, aProg, rec, prev, falta: Math.max(0, meta - grav) }
})

const etapas = computed(() => {
  const its = itens.value.filter(i => i.mes === mesAtual.value)
  const total = its.length
  return { total, por: STATUS.map(s => ({ s, n: its.filter(i => (i.status || 'roteiro') === s).length })) }
})
const COR_ETAPA: Record<string, string> = {
  roteiro: 'var(--muted-foreground)', gravado: 'var(--rec)', editado: 'var(--warning)', programado: 'var(--primary)', publicado: 'var(--success)',
}

const alertas = computed(() => {
  const out: { c: Cliente; tipo: 'hoje' | 'atrasado' | 'prox'; venc: string }[] = []
  for (const c of ativos.value) {
    const st = pagStatus(c, cur, pagamentos.value); const v = vencData(c, cur)
    if (!v || valoresPagamento(c, pagamentos.value[`${c.id}_${cur}`]).dinheiro <= 0) continue
    if (st === 'hoje') out.push({ c, tipo: 'hoje', venc: v })
    else if (st === 'atrasado') out.push({ c, tipo: 'atrasado', venc: v })
    else if (st === 'aberto' && v <= addDias(hoje, 5)) out.push({ c, tipo: 'prox', venc: v })
  }
  const ord = { hoje: 0, atrasado: 1, prox: 2 }
  return out.sort((a, b) => ord[a.tipo] - ord[b.tipo] || a.venc.localeCompare(b.venc))
})


const fimContratos = computed(() => ativos.value.map(c => ({ c, k: contrato(c) }))
  .filter(x => x.k && (x.k.st === 'renovar' || x.k.st === 'encerrado'))
  .sort((a, b) => a.k!.fim.localeCompare(b.k!.fim)))

const pagar = (c: Cliente) => salvar(() => db.salvar('pagamentos', `${c.id}_${cur}`,
  { ...pagamentos.value[`${c.id}_${cur}`], clientId: c.id, mes: cur, pago: true, pagoEm: todayStr(), valor: valoresPagamento(c, pagamentos.value[`${c.id}_${cur}`]).dinheiro, valorPermuta: valoresPagamento(c, pagamentos.value[`${c.id}_${cur}`]).permuta }), `${c.nome}: pagamento registrado`)
const pct = (a: number, b: number) => (b ? Math.min(100, (a / b) * 100) : 0)
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader titulo="Painel" :sub="`Hoje é ${fmtLongo(hoje)}.`">
      <Button variant="outline" @click="abrir({ tipo: 'evento', data: hoje })"><CalendarPlus />Agendar</Button>
      <Button @click="abrir({ tipo: 'item' })">Novo conteúdo</Button>
    </PageHeader>

    <Card class="gap-4">
      <CardHeader>
        <CardTitle>Compromissos de hoje</CardTitle>
        <CardDescription>Agenda da Central e Google Agenda · {{ fmtLongo(hoje) }}</CardDescription>
        <CardAction><Button variant="ghost" size="sm" @click="router.push('/agenda')">Calendário<ChevronRight /></Button></CardAction>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <p v-if="verificandoGoogle" class="text-muted-foreground text-xs" role="status">Carregando compromissos do Google…</p>
        <div v-else-if="googleConectado" class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-muted-foreground text-xs">Google atualiza a cada minuto.<span v-if="syncedAt"> Última atualização: {{ syncedAt }}.</span></p>
          <Button variant="outline" size="sm" :disabled="atualizandoGoogle" @click="sync">{{ atualizandoGoogle ? 'Atualizando…' : 'Atualizar agora' }}</Button>
        </div>
        <Button v-else variant="outline" size="sm" class="self-start" @click="router.push('/agenda')">Conectar Google Agenda</Button>
        <p v-if="erroGoogle" role="alert" class="text-destructive text-sm">{{ erroGoogle }}</p>
        <p v-if="!compromissosHoje.length && !verificandoGoogle && !atualizandoGoogle" class="text-muted-foreground text-sm">{{ googleConectado && !erroGoogle ? 'Nenhum compromisso para hoje.' : 'Nenhum compromisso da Central para hoje.' }}</p>
        <div v-for="e in compromissosHoje" :key="e.id" class="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-3">
          <span class="w-14 shrink-0 text-xs font-bold tabular">{{ e.hora || 'Dia todo' }}</span>
          <span v-if="e.origem === 'google'" class="size-2.5 shrink-0 rounded-full bg-[#4285F4]" />
          <ClientDot v-else :cliente="clientesPorId[e.clientId || '']" />
          <div class="min-w-0 flex-1">
            <p :class="['text-sm font-semibold break-words', e.feito && 'text-muted-foreground line-through']">{{ e.titulo || TIPOS_EV[e.tipo] }}</p>
            <p class="text-muted-foreground text-xs">{{ e.origem === 'google' ? 'Google Agenda' : 'Central' }}<span v-if="e.local"> · {{ e.local }}</span></p>
            <a v-if="e.origem === 'google' && e.googleUrl" :href="String(e.googleUrl)" target="_blank" rel="noopener noreferrer" class="text-primary text-xs underline">Abrir no Google</a>
            <button v-else-if="e.origem !== 'google'" type="button" class="text-primary text-xs underline" @click="abrir({ tipo: 'evento', evento: e })">Ver compromisso</button>
          </div>
        </div>
      </CardContent>
    </Card>

    <EmptyClientes v-if="!ativos.length" />
    <template v-else>
      <!-- números do mês -->
      <section>
        <p class="text-muted-foreground mb-2.5 text-xs font-bold tracking-wider uppercase">Mês de {{ fmtMes(mesAtual) }}</p>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card class="gap-3">
            <CardHeader><CardDescription>Vídeos gravados</CardDescription>
              <CardTitle class="text-3xl font-extrabold tabular"><span class="text-rec">{{ totais.grav }}</span><span class="text-muted-foreground text-lg font-semibold"> / {{ totais.meta }}</span></CardTitle></CardHeader>
            <CardContent><Progress :model-value="pct(totais.grav, totais.meta)" indicator-class="bg-rec" /></CardContent>
          </Card>
          <Card class="gap-3">
            <CardHeader><CardDescription>Faltam gravar</CardDescription>
              <CardTitle class="text-3xl font-extrabold tabular">{{ totais.falta }}</CardTitle></CardHeader>
            <CardContent class="text-muted-foreground text-xs">{{ totais.metaP ? `posts: ${totais.postF} de ${totais.metaP} criados` : 'vídeos para fechar o mês' }}</CardContent>
          </Card>
          <Card class="gap-3">
            <CardHeader><CardDescription>Editados a programar</CardDescription>
              <CardTitle class="text-3xl font-extrabold tabular">{{ totais.aProg }}</CardTitle></CardHeader>
            <CardContent class="text-muted-foreground text-xs">prontos, aguardando agendamento</CardContent>
          </Card>
          <Card class="gap-3">
            <CardHeader><CardDescription>Recebido em dinheiro</CardDescription>
              <CardTitle class="text-2xl font-extrabold tabular">{{ brl(totais.rec) }}</CardTitle></CardHeader>
            <CardContent class="flex flex-col gap-2">
              <Progress :model-value="pct(totais.rec, totais.prev)" indicator-class="bg-success" />
              <span class="text-muted-foreground text-xs">de {{ brl(totais.prev) }} previstos</span>
            </CardContent>
          </Card>
        </div>
      </section>

      <!-- produção por etapa -->
      <Card class="gap-4">
        <CardHeader>
          <CardTitle>Produção por etapa</CardTitle>
          <CardDescription>{{ etapas.total }} conteúdo{{ etapas.total === 1 ? '' : 's' }} cadastrado{{ etapas.total === 1 ? '' : 's' }} em {{ fmtMes(mesAtual) }}</CardDescription>
          <CardAction><Button variant="ghost" size="sm" @click="router.push('/producao')">Abrir quadro<ChevronRight /></Button></CardAction>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div class="bg-secondary flex h-3 w-full overflow-hidden rounded-full" role="img" :aria-label="etapas.por.map(e => `${LBL.video[e.s]}: ${e.n}`).join(', ')">
            <div v-for="e in etapas.por" :key="e.s" :style="{ width: (etapas.total ? (e.n / etapas.total) * 100 : 0) + '%', background: COR_ETAPA[e.s] }" />
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
            <div v-for="e in etapas.por" :key="e.s" class="flex items-center gap-2 text-sm">
              <span class="size-2.5 rounded-sm" :style="{ background: COR_ETAPA[e.s] }" />
              <span class="text-muted-foreground">{{ LBL.video[e.s] }}</span>
              <span class="ml-auto font-bold tabular sm:ml-0">{{ e.n }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4">
        <!-- pagamentos -->
        <Card class="gap-4">
          <CardHeader><CardTitle>Pagamentos para acompanhar</CardTitle><CardDescription>Vencendo hoje, atrasados e nos próximos 5 dias</CardDescription></CardHeader>
          <CardContent class="flex flex-col gap-2">
            <p v-if="!alertas.length" class="text-muted-foreground text-sm">Nada pendente por enquanto.</p>
            <div v-for="a in alertas" :key="a.c.id"
              :class="['flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5', a.tipo === 'hoje' ? 'bg-accent' : a.tipo === 'atrasado' ? 'bg-danger-soft' : 'bg-secondary']">
              <ClientDot :cliente="a.c" />
              <div class="min-w-36 flex-1">
                <p class="font-semibold leading-tight">{{ a.c.nome }}</p>
                <p class="text-muted-foreground text-xs">{{ a.tipo === 'hoje' ? 'Vence hoje' : a.tipo === 'atrasado' ? `Atrasado desde ${fmtD(a.venc)}` : `Vence ${fmtD(a.venc)}` }} · {{ brl(valoresPagamento(a.c, pagamentos[`${a.c.id}_${cur}`]).dinheiro) }}</p>
              </div>
              <div class="flex gap-1.5">
                <Button variant="outline" size="sm" @click="abrir({ tipo: 'cobranca', cliente: a.c, mes: cur })"><MessageCircle />Mensagem</Button>
                <Button size="sm" @click="pagar(a.c)"><Check />Pago</Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <!-- contratos terminando -->
      <Card v-if="fimContratos.length" class="gap-4">
        <CardHeader><CardTitle>Contratos terminando</CardTitle><CardDescription>Avise o cliente com 30 dias de antecedência</CardDescription>
          <CardAction><Button variant="ghost" size="sm" @click="router.push('/clientes')">Contratos<ChevronRight /></Button></CardAction></CardHeader>
        <CardContent class="flex flex-col gap-2">
          <div v-for="{ c, k } in fimContratos" :key="c.id" class="bg-secondary flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5">
            <ClientDot :cliente="c" />
            <div class="min-w-36 flex-1"><p class="font-semibold leading-tight">{{ c.nome }}</p>
              <p class="text-muted-foreground text-xs">{{ k!.st === 'encerrado' ? 'Terminou em' : 'Termina em' }} {{ fmtBR(k!.fim) }} · {{ k!.meses }} meses desde {{ fmtBR(k!.ini) }}</p></div>
            <Badge :variant="ctLabel(k).variant" dot>{{ ctLabel(k).text }}</Badge>
          </div>
        </CardContent>
      </Card>

      <!-- clientes no mês -->
      <Card class="gap-2">
        <CardHeader><CardTitle>Clientes no mês</CardTitle><CardDescription>Toque num cliente para ver a produção dele</CardDescription></CardHeader>
        <CardContent class="px-0">
          <button v-for="{ c, p, st } in linhas" :key="c.id" type="button"
            class="hover:bg-secondary/60 grid w-full grid-cols-1 gap-3 border-t px-5 py-3.5 text-left first:border-t-0 md:grid-cols-[minmax(180px,1.2fr)_1fr_1fr_auto] md:items-center md:gap-6"
            @click="router.push({ path: '/producao', query: { cliente: c.id } })">
            <span class="flex min-w-0 items-center gap-2.5"><ClientDot :cliente="c" />
              <span class="min-w-0"><span class="block truncate font-semibold">{{ c.nome }}</span><span class="text-muted-foreground block truncate text-xs">{{ c.plano || 'Plano não informado' }}</span></span></span>
            <span class="flex flex-col gap-1.5">
              <span class="text-muted-foreground flex justify-between text-xs"><span>Vídeos gravados</span>
                <span v-if="Number(c.videosMes)" class="text-foreground font-bold tabular">{{ pad(p.vGrav) }}/{{ pad(Number(c.videosMes)) }}</span><span v-else>fora do plano</span></span>
              <Progress v-if="Number(c.videosMes)" :model-value="pct(p.vGrav, Number(c.videosMes))" :indicator-class="p.vGrav >= Number(c.videosMes) ? 'bg-success' : ''" />
            </span>
            <span class="flex flex-col gap-1.5">
              <span class="text-muted-foreground flex justify-between text-xs"><span>Posts criados</span>
                <span v-if="Number(c.postsMes)" class="text-foreground font-bold tabular">{{ pad(p.pFeito) }}/{{ pad(Number(c.postsMes)) }}</span><span v-else>fora do plano</span></span>
              <Progress v-if="Number(c.postsMes)" :model-value="pct(p.pFeito, Number(c.postsMes))" :indicator-class="p.pFeito >= Number(c.postsMes) ? 'bg-success' : ''" />
            </span>
            <span class="flex flex-wrap items-center gap-1.5">
              <Badge v-if="Number(c.videosMes) > p.vGrav" variant="muted">faltam {{ Number(c.videosMes) - p.vGrav }}</Badge>
              <Badge v-if="p.aProg" variant="info">{{ p.aProg }} a programar</Badge>
              <PagBadge :status="st" />
            </span>
          </button>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
