import { reactive } from 'vue'
import { toast } from 'vue-sonner'
import type { Cliente, Evento, Item } from './domain'

type Modal =
  | { tipo: ''; }
  | { tipo: 'cliente'; cliente?: Cliente }
  | { tipo: 'briefing'; cliente: Cliente }
  | { tipo: 'item'; item?: Item; clientId?: string }
  | { tipo: 'evento'; evento?: Evento; data?: string }
  | { tipo: 'cobranca'; cliente: Cliente; mes: string }

export const modal = reactive<{ atual: Modal }>({ atual: { tipo: '' } })
export const abrir = (m: Modal) => { modal.atual = m }
export const fechar = () => { modal.atual = { tipo: '' } }

export async function salvar(fn: () => Promise<unknown>, msg: string) {
  try {
    await fn()
    toast.success(msg)
    return true
  } catch (e: any) {
    const t = String(e?.message || '')
    toast.error(t.includes('row-level security') || e?.code === '42501'
      ? 'Seu e-mail não tem permissão para editar. Confira a lista de e-mails no Supabase.'
      : 'Não foi possível salvar. Verifique a internet e tente de novo.')
    return false
  }
}
