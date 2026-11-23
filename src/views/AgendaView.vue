<script setup lang="ts">
import { brl, valoresVisiveis } from '@/lib/privacidade'
import ValorPrivado from '@/components/app/ValorPrivado.vue'
import { computed, ref } from 'vue'
import { CalendarPlus, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ClientDot from '@/components/app/ClientDot.vue'
import PagBadge from '@/components/app/PagBadge.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import { DIAS, TIPOS_EV, addMes, cor, dim, fmtLongo, fmtMes, gcal, pad, pagStatus, todayStr, vencData, ymNow } from '@/lib/domain'
import { agenda, ativos, clientesPorId, db, pagamentos } from '@/lib/store'
import { abrir, salvar } from '@/lib/ui'
import { useGoogleCalendar } from '@/lib/google-calendar'

const hoje = todayStr()
const calMes = ref(ymNow())
const diaSel = ref(hoje)
const { events: eventosGoogle, connected, configured, checking, busy, error: erroGoogle, syncedAt, sync, connect, disconnect } = useGoogleCalendar(calMes)
const eventosVisiveis = computed(() => [...agenda.value, ...eventosGoogle.value])
const resultadoGoogle = new URLSearchParams(window.location.search).get('google')
const avisoGoogle = resultadoGoogle && resultadoGoogle !== 'conectado' ? (resultadoGoogle === 'conta_incorreta' ? 'Use a conta rafaelabose@gmail.com para conectar.' : 'A conexão com o Google não foi concluída. Tente conectar novamente.') : ''

const celulas = computed(() => {
  const m = calMes.value
  const first = new Date(m + '-01T12:00').getDay()
  const out: ({ ds: string; d: number; cores: string[]; pg: number } | null)[] = Array(first).fill(null)
  for (let d = 1; d <= dim(m); d++) {
    const ds = `${m}-${pad(d)}`
    const evs = eventosVisiveis.value.filter(e => e.data === ds)
    out.push({ ds, d, cores: evs.slice(0, 6).map(e => e.origem === 'google' ? '#4285F4' : cor(clientesPorId.value[e.clientId || ''])), pg: ativos.value.filter(c => vencData(c, m) === ds).length })
  }
  return out
})
const evsDia = computed(() => eventosVisiveis.value.filter(e => e.data === diaSel.value).sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99')))
const pgsDia = computed(() => ativos.value.filter(c => vencData(c, diaSel.value.slice(0, 7)) === diaSel.value))
const alternar = (id: string, feito?: boolean) => salvar(() => db.atualizar('agenda', id, { feito: !feito }), feito ? 'Compromisso reaberto' : 'Marcado como feito')
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader titulo="Agenda" sub="Gravações, reuniões e entregas de todos os clientes. Os dias de pagamento aparecem com $.">
      <Button @click="abrir({ tipo: 'evento', data: diaSel })"><CalendarPlus />Agendar</Button>
    </PageHeader>
    <Card class="gap-3">
      <CardHeader><CardTitle>Google Agenda</CardTitle><CardDescription>rafaelabose@gmail.com · eventos identificados em azul. Alterações e exclusões feitas no Google aparecem na próxima atualização.</CardDescription></CardHeader>
      <CardContent class="grid gap-3">
        <p v-if="checking" class="text-muted-foreground text-sm">Verificando conexão…</p>
        <p v-else-if="!configured" class="text-muted-foreground text-sm">A integração está aguardando a configuração de autorização do Google.</p>
        <template v-else-if="connected"><p class="text-muted-foreground text-sm">Atualização automática a cada minuto enquanto esta tela estiver aberta.<span v-if="syncedAt"> Última atualização: {{ syncedAt }}.</span></p><div class="flex flex-wrap gap-2"><Button variant="outline" :disabled="busy" @click="sync">{{ busy ? 'Atualizando…' : 'Atualizar agora' }}</Button><Button variant="ghost" :disabled="busy" @click="disconnect">Desconectar neste navegador</Button></div></template>
        <Button v-else :disabled="busy" class="justify-self-start" @click="connect">Conectar Google Agenda</Button>
        <p v-if="erroGoogle || avisoGoogle" role="alert" class="text-destructive text-sm">{{ erroGoogle || avisoGoogle }}</p>
        <p class="text-muted-foreground text-xs">Eventos do Google são consultados aqui; para editar, abra o evento no Google. Os compromissos cadastrados na Central continuam independentes.</p>
      </CardContent>
    </Card>

    <div class="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card class="gap-3">
        <CardHeader class="flex items-center justify-between">
          <Button variant="ghost" size="icon-sm" aria-label="Mês anterior" @click="calMes = addMes(calMes, -1)"><ChevronLeft /></Button>
          <CardTitle class="text-lg capitalize">{{ fmtMes(calMes) }}</CardTitle>
          <Button variant="ghost" size="icon-sm" aria-label="Próximo mês" @click="calMes = addMes(calMes, 1)"><ChevronRight /></Button>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-7 gap-1">
            <div v-for="d in DIAS" :key="d" class="text-muted-foreground py-1 text-center text-[11px] font-bold tracking-wide uppercase">{{ d }}</div>
            <template v-for="(c, i) in celulas" :key="i">
              <div v-if="!c" aria-hidden="true" />
              <button v-else type="button" :aria-label="`${fmtLongo(c.ds)}: ${c.cores.length} compromissos`"
                :class="['bg-secondary hover:border-muted-foreground/50 flex min-h-16 min-w-0 flex-col gap-1 rounded-lg border border-transparent p-1.5 text-left',
                  c.ds === diaSel && 'border-primary! ring-primary ring-1']"
                @click="diaSel = c.ds">
                <span :class="['self-start rounded-md px-1 text-xs font-bold tabular', c.ds === hoje && 'bg-primary text-primary-foreground']">{{ c.d }}</span>
                <span class="flex flex-wrap gap-0.5"><i v-for="(k, j) in c.cores" :key="j" class="size-1.5 rounded-full sm:size-2" :style="{ background: k }" /></span>
                <span v-if="c.pg" class="text-warning text-[10.5px] font-bold">$ {{ c.pg }}</span>
              </button>
            </template>
          </div>
        </CardContent>
      </Card>

      <Card class="gap-3">
        <CardHeader><CardDescription class="text-xs font-bold tracking-wider uppercase">Dia selecionado</CardDescription><CardTitle class="text-lg capitalize">{{ fmtLongo(diaSel) }}</CardTitle></CardHeader>
        <CardContent class="flex flex-col">
          <div v-for="c in pgsDia" :key="c.id" class="flex items-start gap-3 border-t py-3 first:border-t-0">
            <span class="text-warning w-12 font-bold">$</span>
            <div class="min-w-0 flex-1"><p class="font-semibold">Pagamento: {{ c.nome }}</p><p class="text-muted-foreground mt-0.5 flex items-center gap-2 text-sm tabular"><ValorPrivado :valor="c.valor" /> <PagBadge :status="pagStatus(c, diaSel.slice(0, 7), pagamentos)" /></p></div>
          </div>
          <div v-for="e in evsDia" :key="e.id" class="flex items-start gap-3 border-t py-3 first:border-t-0">
            <span class="w-12 shrink-0 text-sm font-bold tabular">{{ e.hora || 'dia' }}</span>
            <div class="min-w-0 flex-1">
              <p :class="['font-semibold break-words', e.feito && 'text-muted-foreground line-through']">{{ e.titulo || TIPOS_EV[e.tipo] }}</p>
              <p class="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm"><ClientDot :cliente="clientesPorId[e.clientId || '']" :size="8" />{{ e.origem === 'google' ? 'Google Agenda' : TIPOS_EV[e.tipo] }}<template v-if="e.clientId && clientesPorId[e.clientId]"> · {{ clientesPorId[e.clientId].nome }}</template><template v-if="e.local"> · {{ e.local }}</template></p>
              <p v-if="e.obs" class="text-muted-foreground mt-1 text-sm break-words">{{ e.obs }}</p>
              <div v-if="e.origem === 'google'" class="mt-1.5"><Button v-if="e.googleUrl" as="a" :href="String(e.googleUrl)" variant="outline" size="sm" target="_blank" rel="noopener noreferrer"><ExternalLink />Editar no Google</Button></div>
              <div v-else class="mt-1.5 flex flex-wrap gap-1">
                <Button variant="outline" size="sm" @click="abrir({ tipo: 'evento', evento: e })">Editar</Button>
                <Button variant="ghost" size="sm" @click="alternar(e.id, e.feito)">{{ e.feito ? 'Reabrir' : 'Marcar feito' }}</Button>
                <Button variant="ghost" size="sm" as="a" :href="gcal(e, clientesPorId[e.clientId || ''])" target="_blank" rel="noopener"><ExternalLink />Google Agenda</Button>
              </div>
            </div>
          </div>
          <p v-if="!pgsDia.length && !evsDia.length" class="text-muted-foreground py-2 text-sm">Nada neste dia.</p>
          <Button variant="outline" size="sm" class="mt-3 self-start" @click="abrir({ tipo: 'evento', data: diaSel })"><CalendarPlus />Agendar neste dia</Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
