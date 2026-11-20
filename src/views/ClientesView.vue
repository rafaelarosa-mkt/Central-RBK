<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Clapperboard, MessageCircle, Pencil, Plus } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import ClientDot from '@/components/app/ClientDot.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import BriefingResumo from '@/components/app/BriefingResumo.vue'
import VisitasCliente from '@/components/app/VisitasCliente.vue'
import EmptyClientes from '@/components/app/EmptyClientes.vue'
import { brl, contrato, ctLabel, fmtBR, waNum, type CtStatus } from '@/lib/domain'
import { ativos, clientes } from '@/lib/store'
import { abrir } from '@/lib/ui'

const router = useRouter()
const ORD: Record<CtStatus, number> = { renovar: 0, encerrado: 1, vigente: 2, futuro: 3 }
const contratos = computed(() => ativos.value.map(c => ({ c, k: contrato(c) }))
  .sort((a, b) => (a.k ? ORD[a.k.st] : 9) - (b.k ? ORD[b.k.st] : 9) || (a.k?.fim || '').localeCompare(b.k?.fim || '')))
const todos = computed(() => [...clientes.value].sort((a, b) =>
  Number(a.ativo === false) - Number(b.ativo === false) || (a.nome || '').localeCompare(b.nome || '', 'pt-BR')))
const barra = (st: CtStatus) => (st === 'renovar' ? 'bg-warning' : st === 'encerrado' ? 'bg-destructive' : '')
</script>

<template>
  <div class="flex flex-col gap-6">
    <PageHeader titulo="Clientes" :sub="`${ativos.length} ativos`">
      <Button @click="abrir({ tipo: 'cliente' })"><Plus />Novo cliente</Button>
    </PageHeader>

    <EmptyClientes v-if="!clientes.length" />
    <template v-else>
      <Card class="gap-2">
        <CardHeader>
          <CardTitle class="text-lg">Contratos</CardTitle>
          <CardDescription>Pausas e mudanças de plano precisam ser avisadas com 30 dias de antecedência. Por isso o aviso de término aparece 30 dias antes.</CardDescription>
        </CardHeader>
        <CardContent class="px-0">
          <div v-for="{ c, k } in contratos" :key="c.id" class="grid grid-cols-1 gap-2.5 border-t px-5 py-3.5 first:border-t-0 md:grid-cols-[minmax(200px,1fr)_minmax(220px,1.4fr)_auto] md:items-center md:gap-6">
            <div class="flex min-w-0 items-center gap-2.5">
              <ClientDot :cliente="c" />
              <div class="min-w-0"><p class="truncate font-semibold">{{ c.nome }}</p>
                <p class="text-muted-foreground text-xs">{{ k ? `${k.meses} ${k.meses === 1 ? 'mês' : 'meses'} · ${k.st === 'futuro' ? 'ainda não começou' : k.st === 'encerrado' ? 'concluído' : `mês ${k.mesN} de ${k.meses}`}` : 'Início e duração não informados' }}</p></div>
            </div>
            <div v-if="k" class="flex flex-col gap-1.5">
              <div class="text-muted-foreground flex justify-between text-xs tabular"><span>{{ fmtBR(k.ini) }}</span><span>{{ fmtBR(k.fim) }}</span></div>
              <Progress :model-value="k.pct" :indicator-class="barra(k.st)" />
            </div>
            <div v-else class="text-muted-foreground text-xs">—</div>
            <div class="flex items-center gap-2">
              <Badge :variant="ctLabel(k).variant" dot>{{ ctLabel(k).text }}</Badge>
              <Button variant="ghost" size="sm" @click="abrir({ tipo: 'cliente', cliente: c })">{{ k ? 'Editar' : 'Informar datas' }}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card v-for="c in todos" :key="c.id" :class="['gap-4', c.ativo === false && 'opacity-60']">
          <CardHeader>
            <div class="flex items-center gap-2.5">
              <ClientDot :cliente="c" :size="14" />
              <CardTitle class="min-w-0 flex-1 text-lg break-words">{{ c.nome }}</CardTitle>
              <Badge v-if="c.ativo === false" variant="muted">arquivado</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt class="text-muted-foreground">Plano</dt><dd class="break-words">{{ c.plano || '—' }}</dd>
              <dt class="text-muted-foreground">Por mês</dt><dd>{{ Number(c.videosMes) || 0 }} vídeos · {{ Number(c.postsMes) || 0 }} posts</dd>
              <dt class="text-muted-foreground">Visitas / mês</dt><dd>{{ c.visitasMes == null ? 'Não definido' : c.visitasMes }}</dd>
              <dt class="text-muted-foreground">Dinheiro / mês</dt><dd class="tabular">{{ brl(c.valor) }}<template v-if="c.diaPgto"> · dia {{ c.diaPgto }}</template></dd>
              <dt class="text-muted-foreground">Permuta / mês</dt><dd class="tabular">{{ brl(c.valorPermuta) }}</dd>
              <template v-if="c.obsPgto"><dt class="text-muted-foreground">Pgto.</dt><dd class="break-words">{{ c.obsPgto }}</dd></template>
              <dt class="text-muted-foreground">Contrato</dt><dd class="tabular">{{ contrato(c) ? `${fmtBR(contrato(c)!.ini)} a ${fmtBR(contrato(c)!.fim)}` : 'datas não informadas' }}</dd>
              <template v-if="c.contato"><dt class="text-muted-foreground">Contato</dt><dd class="break-words">{{ c.contato }}</dd></template>
              <template v-if="c.telefone"><dt class="text-muted-foreground">WhatsApp</dt><dd>{{ c.telefone }}</dd></template>
              <template v-if="c.instagram"><dt class="text-muted-foreground">Instagram</dt><dd class="break-words">{{ c.instagram }}</dd></template>
              <template v-if="c.obs"><dt class="text-muted-foreground">Obs.</dt><dd class="break-words">{{ c.obs }}</dd></template>
            </dl>
          </CardContent>
          <CardFooter class="mt-auto flex-wrap gap-1.5">
            <VisitasCliente :cliente="c" />
            <Button variant="outline" size="sm" @click="abrir({ tipo: 'briefing', cliente: c })">Briefing</Button>
            <Button variant="outline" size="sm" @click="abrir({ tipo: 'cliente', cliente: c })"><Pencil />Editar</Button>
            <Button variant="ghost" size="sm" @click="router.push({ path: '/producao', query: { cliente: c.id } })"><Clapperboard />Produção</Button>
            <Button v-if="waNum(c.telefone)" variant="ghost" size="sm" as="a" :href="`https://wa.me/${waNum(c.telefone)}`" target="_blank" rel="noopener"><MessageCircle />WhatsApp</Button>
          </CardFooter>
          <CardContent><details><summary class="cursor-pointer text-sm font-semibold">Consultar briefing</summary><div class="mt-3"><BriefingResumo :cliente="c" /></div></details></CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
