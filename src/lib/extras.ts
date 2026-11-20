import { validarBriefingDia, type BriefingDia } from './briefing-dia.ts'
export const ETAPAS_EXTRA = { recebido: 'A fazer', andamento: 'Em andamento', aprovacao: 'Em aprovação', concluido: 'Concluído' } as const
export interface DemandaExtra {
  id: string
  tipoRegistro: 'demanda_extra'
  clientId: string
  titulo: string
  descricao: string
  categoria: string
  prazo: string
  prioridade: 'normal' | 'alta' | 'urgente'
  etapa: keyof typeof ETAPAS_EXTRA
  responsavel: string
  arquivada?: boolean
  atendimento?: 'cliente' | 'avulso'
  clienteAvulso?: string
  briefingDia?: BriefingDia
}
export function separarProducao<T extends { [k: string]: unknown }>(registros: T[]) {
  return { plano: registros.filter(i => i.tipoRegistro !== 'demanda_extra'), extras: registros.filter(i => i.tipoRegistro === 'demanda_extra') as unknown as DemandaExtra[] }
}
export function validarExtra(d: Omit<DemandaExtra, 'id'>) {
  if ((d.atendimento === 'avulso' ? !d.clienteAvulso?.trim() : !d.clientId) || !d.titulo.trim()) return 'Informe o cliente e o pedido.'
  if (!Object.prototype.hasOwnProperty.call(ETAPAS_EXTRA, d.etapa) || !['normal', 'alta', 'urgente'].includes(d.prioridade)) return 'Confira a etapa e a prioridade.'
  if (d.prazo && (!/^\d{4}-\d{2}-\d{2}$/.test(d.prazo) || !Number.isFinite(Date.parse(d.prazo)) || new Date(d.prazo).toISOString().slice(0, 10) !== d.prazo)) return 'Informe um prazo válido.'
  return validarBriefingDia(d.briefingDia)
}
