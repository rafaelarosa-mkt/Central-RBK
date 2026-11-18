// Estado compartilhado da Central, sincronizado com o Supabase em tempo real.
import { computed, reactive, ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase, configurado } from './supabase'
import type { Cliente, ContaPagar, Evento, Item, Pagamento } from './domain'
import { ymNow } from './domain'

const TABELA = 'RBK DADOS'

type Colecao = 'clients' | 'itens' | 'pagamentos' | 'agenda'
const COLECOES: Colecao[] = ['clients', 'itens', 'pagamentos', 'agenda']

const cache = reactive<Record<Colecao, Record<string, Record<string, unknown>>>>({
  clients: {}, itens: {}, pagamentos: {}, agenda: {},
})

export const session = ref<Session | null>(null)
export const authPronto = ref(false)
export const carregado = ref(false)
export const erroDados = ref('')
export const mesAtual = ref(ymNow())

const lista = <T>(col: Colecao) => computed(() =>
  Object.entries(cache[col]).map(([id, d]) => ({ id, ...d }) as T))

export const clientes = lista<Cliente>('clients')
export const itens = lista<Item>('itens')
export const agenda = lista<Evento>('agenda')
// Payables share the existing financial collection with an explicit discriminator.
// Keep them out of client receipts while retaining backup, RLS and realtime support.
export const pagamentos = computed(() => Object.fromEntries(Object.entries(cache.pagamentos)
  .filter(([, d]) => d.tipoRegistro !== 'conta_pagar')) as unknown as Record<string, Pagamento>)
export const contasPagar = computed(() => Object.entries(cache.pagamentos)
  .filter(([, d]) => d.tipoRegistro === 'conta_pagar')
  .map(([id, d]) => ({ ...d, id }) as unknown as ContaPagar))
export const ativos = computed(() =>
  clientes.value.filter(c => c.ativo !== false).sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')))
export const clientesPorId = computed(() => Object.fromEntries(clientes.value.map(c => [c.id, c])) as Record<string, Cliente>)

const novoId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

async function carregar(col: Colecao) {
  const { data, error } = await supabase!.from(TABELA).select('id,dados').eq('colecao', col).limit(20000)
  if (error) throw error
  const m: Record<string, Record<string, unknown>> = {}
  for (const r of data) m[r.id] = r.dados
  cache[col] = m
}

export async function carregarTudo() {
  try {
    erroDados.value = ''
    await Promise.all(COLECOES.map(carregar))
    carregado.value = true
  } catch {
    erroDados.value = 'Não foi possível carregar os dados. Verifique a internet e recarregue a página.'
  }
}

let ouvindo = false
function ouvirMudancas() {
  if (ouvindo || !supabase) return
  ouvindo = true
  supabase.channel('registros-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABELA }, (p: any) => {
      if (p.eventType === 'DELETE') {
        void carregarTudo()
        return
      }
      const row = p.new
      const col = row?.colecao as Colecao
      if (!col || !(col in cache)) return
      cache[col][row.id] = row.dados
    })
    .subscribe()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && session.value) COLECOES.forEach(c => carregar(c).catch(() => {}))
  })
}

async function gravar(col: Colecao, id: string, dados: Record<string, unknown>) {
  const { error } = await supabase!.from(TABELA).upsert({ colecao: col, id, dados, atualizado: new Date().toISOString() }, { onConflict: 'colecao,id' })
  if (error) throw error
  cache[col][id] = dados
}

export const db = {
  criar: (col: Colecao, dados: Record<string, unknown>) => gravar(col, novoId(), dados),
  salvar: (col: Colecao, id: string, dados: Record<string, unknown>) => gravar(col, id, dados),
  atualizar: (col: Colecao, id: string, parcial: Record<string, unknown>) => gravar(col, id, { ...(cache[col][id] || {}), ...parcial }),
  async apagar(col: Colecao, id: string) {
    const { error } = await supabase!.from(TABELA).delete().match({ colecao: col, id })
    if (error) throw error
    delete cache[col][id]
  },
  exportar: () => JSON.parse(JSON.stringify(cache)),
  async restaurar(dados: Record<string, Record<string, Record<string, unknown>>>) {
    const rows: { colecao: string; id: string; dados: unknown; atualizado: string }[] = []
    for (const [col, docs] of Object.entries(dados || {})) {
      if (!COLECOES.includes(col as Colecao)) continue
      for (const [id, d] of Object.entries(docs || {})) rows.push({ colecao: col, id, dados: d, atualizado: new Date().toISOString() })
    }
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase!.from(TABELA).upsert(rows.slice(i, i + 200), { onConflict: 'colecao,id' })
      if (error) throw error
    }
    await carregarTudo()
    return rows.length
  },
}

export const arquivos = {
  async enviar(f: File) {
    const nome = f.name.normalize('NFD').replace(/[^\w.\-]+/g, '_')
    const path = `${Date.now()}-${nome}`
    const { error } = await supabase!.storage.from('anexos').upload(path, f, { contentType: f.type || undefined })
    if (error) throw error
    return path
  },
  async abrir(path: string) {
    const w = window.open('', '_blank')
    const { data } = await supabase!.storage.from('anexos').createSignedUrl(path, 600)
    if (data && w) w.location.href = data.signedUrl
    else { w?.close(); throw new Error('falhou') }
  },
}

let authIniciada = false
export function iniciarAuth() {
  if (authIniciada) return
  authIniciada = true
  if (!configurado || !supabase) { authPronto.value = true; return }

  // INITIAL_SESSION restaura o login salvo antes de liberar a tela.
  supabase.auth.onAuthStateChange((evento, atual) => {
    const anterior = session.value
    session.value = atual
    authPronto.value = true

    if (!atual || anterior?.user.id !== atual.user.id) {
      carregado.value = false
      erroDados.value = ''
      COLECOES.forEach(col => (cache[col] = {}))
    }

    const autorizado = atual?.user.app_metadata.central_rbk === true
    if (autorizado && (evento === 'INITIAL_SESSION'
      || anterior?.user.id !== atual.user.id
      || anterior?.user.app_metadata.central_rbk !== true)) {
      setTimeout(() => {
        if (session.value?.user.id !== atual.user.id) return
        ouvirMudancas()
        void carregarTudo()
      }, 0)
    }
  })
}
