<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, FileText, Paperclip, Plus } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { NativeSelect } from '@/components/ui/native-select'
import ClientDot from '@/components/app/ClientDot.vue'
import PageHeader from '@/components/app/PageHeader.vue'
import EmptyClientes from '@/components/app/EmptyClientes.vue'
import { COLSUB, LBL, STATUS, fmtD, fmtMes, pad, prog, type Item, type Status } from '@/lib/domain'
import { ativos, clientesPorId, db, itens, mesAtual } from '@/lib/store'
import { abrir, salvar } from '@/lib/ui'

const route = useRoute(); const router = useRouter()
const fCli = computed({
  get: () => (route.query.cliente as string) || '',
  set: v => router.replace({ query: { ...route.query, cliente: v || undefined } }),
})
const fTipo = computed({
  get: () => (route.query.tipo as string) || '',
  set: v => router.replace({ query: { ...route.query, tipo: v || undefined } }),
})

const lista = computed(() => itens.value.filter(i => i.mes === mesAtual.value
  && (!fCli.value || i.clientId === fCli.value)
  && (!fTipo.value || (i.tipo || 'video') === fTipo.value)))
const ord = (a: Item, b: Item) => (a.dataGravacao || a.dataPost || '9').localeCompare(b.dataGravacao || b.dataPost || '9') || (a.titulo || '').localeCompare(b.titulo || '')
const colunas = computed(() => STATUS.map((s, ix) => ({ s, ix, itens: lista.value.filter(i => (i.status || 'roteiro') === s).sort(ord) })))
const sel = computed(() => (fCli.value ? clientesPorId.value[fCli.value] : undefined))
const resumo = computed(() => (sel.value ? prog(sel.value, mesAtual.value, itens.value) : null))

const tp = (i: Item) => (i.tipo === 'post' ? 'post' : 'video') as 'post' | 'video'
function mover(i: Item, d: number) {
  const ix = Math.max(0, Math.min(4, STATUS.indexOf(i.status || 'roteiro') + d))
  const s = STATUS[ix] as Status
  salvar(() => db.atualizar('itens', i.id, { status: s, atualizado: Date.now() }), `Movido para ${LBL[tp(i)][s]}`)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader titulo="Produção" :sub="`Conteúdos de ${fmtMes(mesAtual)}, do roteiro à publicação.`">
      <Button @click="abrir({ tipo: 'item', clientId: fCli || undefined })"><Plus />Novo conteúdo</Button>
    </PageHeader>

    <EmptyClientes v-if="!ativos.length" />
    <template v-else>
      <div class="flex flex-wrap gap-2">
        <NativeSelect v-model="fCli" class="w-full sm:w-64" aria-label="Filtrar cliente">
          <option value="">Todos os clientes</option>
          <option v-for="c in ativos" :key="c.id" :value="c.id">{{ c.nome }}</option>
        </NativeSelect>
        <NativeSelect v-model="fTipo" class="w-full sm:w-44" aria-label="Filtrar tipo">
          <option value="">Vídeos e posts</option>
          <option value="video">Só vídeos</option>
          <option value="post">Só posts</option>
        </NativeSelect>
      </div>

      <Card v-if="sel && resumo" class="flex-row flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
        <span class="flex items-center gap-2 font-semibold"><ClientDot :cliente="sel" :size="12" />{{ sel.nome }}</span>
        <span class="text-sm tabular">Vídeos <b>{{ pad(resumo.vGrav) }}/{{ pad(Number(sel.videosMes) || 0) }}</b></span>
        <span class="text-sm tabular">Posts <b>{{ pad(resumo.pFeito) }}/{{ pad(Number(sel.postsMes) || 0) }}</b></span>
        <Badge variant="muted">{{ resumo.rot }} aguardando gravação</Badge>
        <Badge variant="info">{{ resumo.aProg }} a programar</Badge>
      </Card>

      <div class="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <div class="grid min-w-[1180px] grid-cols-5 gap-3 xl:min-w-0">
          <section v-for="col in colunas" :key="col.s" class="bg-secondary/70 flex min-h-48 flex-col gap-2 rounded-xl p-2.5">
            <header class="flex items-baseline justify-between px-1 pb-1">
              <div><h2 class="text-[15px] font-bold">{{ LBL.video[col.s] }}</h2><p class="text-muted-foreground text-[11.5px]">{{ COLSUB[col.s] }}</p></div>
              <span class="text-muted-foreground text-sm font-semibold tabular">{{ col.itens.length }}</span>
            </header>
            <article v-for="i in col.itens" :key="i.id" tabindex="0"
              class="bg-card hover:border-muted-foreground/40 flex cursor-pointer flex-col gap-2 rounded-lg border p-3 shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="abrir({ tipo: 'item', item: i })" @keydown.enter="abrir({ tipo: 'item', item: i })">
              <div class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold"><ClientDot :cliente="clientesPorId[i.clientId]" :size="8" /><span class="truncate">{{ clientesPorId[i.clientId]?.nome || 'Cliente removido' }}</span></div>
              <p class="leading-snug font-semibold break-words">{{ i.titulo || 'Sem título' }}</p>
              <div class="flex flex-wrap gap-1">
                <Badge variant="muted">{{ tp(i) === 'post' ? 'Post' : 'Vídeo' }}<template v-if="tp(i) === 'post' && col.ix < 3"> · {{ LBL.post[col.s] }}</template></Badge>
                <Badge v-if="i.roteiro" variant="outline"><FileText />roteiro</Badge>
                <Badge v-if="(i.anexos || []).length" variant="outline"><Paperclip />{{ i.anexos!.length }}</Badge>
                <Badge v-if="i.dataGravacao && col.ix < 1" variant="outline">grava {{ fmtD(i.dataGravacao) }}</Badge>
                <Badge v-if="i.dataPost && col.ix >= 2" variant="outline">posta {{ fmtD(i.dataPost) }}</Badge>
              </div>
              <div class="mt-0.5 flex flex-wrap gap-1.5" @click.stop>
                <Button v-if="col.ix > 0" variant="ghost" size="sm" class="grow px-1.5" :aria-label="`Voltar para ${LBL[tp(i)][STATUS[col.ix - 1]]}`" @click="mover(i, -1)"><ChevronLeft />{{ LBL[tp(i)][STATUS[col.ix - 1]] }}</Button>
                <Button v-if="col.ix < 4" variant="outline" size="sm" class="grow px-1.5" :aria-label="`Avançar para ${LBL[tp(i)][STATUS[col.ix + 1]]}`" @click="mover(i, 1)">{{ LBL[tp(i)][STATUS[col.ix + 1]] }}<ChevronRight /></Button>
              </div>
            </article>
            <p v-if="!col.itens.length" class="text-muted-foreground py-6 text-center text-sm">Vazio</p>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
