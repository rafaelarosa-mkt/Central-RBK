<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePreferredDark } from '@vueuse/core'
import { watchEffect } from 'vue'
import { CalendarDays, Clapperboard, Download, LayoutDashboard, LogOut, MoreHorizontal, Upload, Users, Wallet, Receipt } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import MesSwitcher from '@/components/app/MesSwitcher.vue'
import ClienteDialog from '@/components/app/ClienteDialog.vue'
import BriefingDialog from '@/components/app/BriefingDialog.vue'
import ItemDialog from '@/components/app/ItemDialog.vue'
import EventoDialog from '@/components/app/EventoDialog.vue'
import CobrancaDialog from '@/components/app/CobrancaDialog.vue'
import LoginView from '@/views/LoginView.vue'
import ConfigView from '@/views/ConfigView.vue'
import { authPronto, carregado, db, erroDados, mesAtual, session } from '@/lib/store'
import { supabase, configurado } from '@/lib/supabase'
import { todayStr } from '@/lib/domain'

const dark = usePreferredDark()
watchEffect(() => document.documentElement.classList.toggle('dark', dark.value))

const route = useRoute()
const NAV = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/producao', label: 'Produção', icon: Clapperboard },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/contas-a-pagar', label: 'Contas a pagar', curto: 'A pagar', icon: Receipt },
  { to: '/clientes', label: 'Clientes', icon: Users },
]
const ativo = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
const mostraMes = computed(() => route.name !== 'agenda' && route.name !== 'clientes')

const inputRestore = ref<HTMLInputElement>()
function baixarBackup() {
  const blob = new Blob([JSON.stringify({ exportado: new Date().toISOString(), dados: db.exportar() }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = `central-rbk-backup-${todayStr()}.json`
  document.body.appendChild(a); a.click(); a.remove()
  toast.success('Backup baixado')
}
async function restaurar(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]; input.value = ''
  if (!f) return
  try {
    const j = JSON.parse(await f.text())
    const n = await db.restaurar(j.dados || j)
    toast.success(`${n} registros restaurados`)
  } catch { toast.error('Não foi possível ler esse arquivo de backup.') }
}
const sair = () => supabase?.auth.signOut({ scope: 'local' })
</script>

<template>
  <Toaster position="top-center" rich-colors />
  <ConfigView v-if="!configurado" />
  <div v-else-if="!authPronto" class="text-muted-foreground grid min-h-dvh place-items-center text-sm">Carregando…</div>
  <LoginView v-else-if="!session" />
  <div v-else-if="session.user.app_metadata.central_rbk !== true" class="grid min-h-dvh place-items-center p-4">
    <div class="grid max-w-sm gap-4 text-center">
      <h1 class="text-xl font-semibold">Conta sem acesso à Central RBK</h1>
      <p class="text-muted-foreground text-sm">Após autorizar esta conta no Supabase, saia e entre novamente.</p>
      <Button variant="outline" @click="sair">Sair</Button>
    </div>
  </div>
  <div v-else class="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
    <!-- barra lateral (computador) -->
    <aside class="bg-sidebar sticky top-0 hidden h-dvh flex-col gap-6 border-r px-3 py-5 md:flex">
      <div class="flex items-center gap-2.5 px-2">
        <span class="bg-rec size-2.5 rounded-full shadow-[0_0_0_4px_color-mix(in_oklch,var(--rec)_22%,transparent)]" />
        <div class="leading-tight">
          <div class="font-display text-lg font-extrabold">Central RBK</div>
          <div class="text-muted-foreground text-xs">vídeos, posts e clientes</div>
        </div>
      </div>
      <nav class="flex flex-col gap-0.5" aria-label="Seções">
        <RouterLink v-for="n in NAV" :key="n.to" :to="n.to"
          :class="['flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors', ativo(n.to) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground']">
          <component :is="n.icon" class="size-[18px]" />{{ n.label }}
        </RouterLink>
      </nav>
      <div class="mt-auto flex flex-col gap-0.5">
        <p class="text-muted-foreground truncate px-3 pb-1 text-xs">{{ session.user.email }}</p>
        <Button variant="ghost" class="justify-start text-muted-foreground" @click="baixarBackup"><Download />Baixar backup</Button>
        <Button variant="ghost" class="justify-start text-muted-foreground" @click="inputRestore?.click()"><Upload />Restaurar backup</Button>
        <Button variant="ghost" class="justify-start text-muted-foreground" @click="sair"><LogOut />Sair</Button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-col">
      <!-- topo -->
      <header class="bg-background/90 sticky top-[env(safe-area-inset-top)] z-30 border-b backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5 md:px-8">
          <div class="flex items-center gap-2 md:hidden">
            <span class="bg-rec size-2.5 rounded-full" />
            <span class="font-display text-lg font-extrabold">Central RBK</span>
          </div>
          <span class="text-muted-foreground hidden text-sm font-semibold md:block">{{ route.meta.titulo }}</span>
          <div class="ml-auto flex items-center gap-2">
            <MesSwitcher v-if="mostraMes" v-model="mesAtual" class="hidden sm:flex" />
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="md:hidden" aria-label="Conta e backup"><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{{ session.user.email }}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem @select="baixarBackup"><Download />Baixar backup</DropdownMenuItem>
                <DropdownMenuItem @select="inputRestore?.click()"><Upload />Restaurar backup</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @select="sair"><LogOut />Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <MesSwitcher v-if="mostraMes" v-model="mesAtual" class="w-full sm:hidden" />
        </div>
      </header>

      <main class="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-7 md:pb-12">
        <div v-if="erroDados" class="bg-warning-soft mb-4 rounded-lg border border-warning/30 px-4 py-3 text-sm">{{ erroDados }}</div>
        <div v-if="!carregado && !erroDados" class="text-muted-foreground py-16 text-center text-sm">Carregando dados…</div>
        <RouterView v-else />
      </main>
    </div>

    <!-- navegação inferior (celular) -->
    <nav class="bg-card fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] md:hidden" aria-label="Seções">
      <RouterLink v-for="n in NAV" :key="n.to" :to="n.to"
        :class="['flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold', ativo(n.to) ? 'text-primary' : 'text-muted-foreground']">
        <component :is="n.icon" class="size-[22px]" />{{ n.curto || n.label }}
      </RouterLink>
    </nav>

    <input ref="inputRestore" type="file" accept=".json,application/json" class="hidden" @change="restaurar">
    <ClienteDialog />
    <BriefingDialog />
    <ItemDialog />
    <EventoDialog />
    <CobrancaDialog />
  </div>
</template>

