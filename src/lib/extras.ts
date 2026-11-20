const hojeLocal = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-') }
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
  valorExtra?: number
  vencimentoExtra?: string
  pagoExtra?: boolean
  pagoEmExtra?: string
}
export function separarProducao<T extends { [k: string]: unknown }>(registros: T[]) {
  return { plano: registros.filter(i => i.tipoRegistro !== 'demanda_extra' && i.tipoRegistro !== 'visita'), extras: registros.filter(i => i.tipoRegistro === 'demanda_extra') as unknown as DemandaExtra[] }
}
export function validarExtra(d: Omit<DemandaExtra, 'id'>) {
  if ((d.atendimento === 'avulso' ? !d.clienteAvulso?.trim() : !d.clientId) || !d.titulo.trim()) return 'Informe o cliente e o pedido.'
  const valor = Number(d.valorExtra || 0)
  if (!Number.isFinite(valor) || valor < 0) return 'Informe um valor válido para a demanda.'
  const dataValida = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s
  if (valor > 0 && !dataValida(d.vencimentoExtra)) return 'Informe o vencimento da cobrança extra.'
  if (d.pagoExtra && (valor <= 0 || !dataValida(d.pagoEmExtra) || d.pagoEmExtra! > hojeLocal()) ) return 'Confira o valor e a data do recebimento.'
  if (!Object.prototype.hasOwnProperty.call(ETAPAS_EXTRA, d.etapa) || !['normal', 'alta', 'urgente'].includes(d.prioridade)) return 'Confira a etapa e a prioridade.'
  if (d.prazo && (!/^\d{4}-\d{2}-\d{2}$/.test(d.prazo) || !Number.isFinite(Date.parse(d.prazo)) || new Date(d.prazo).toISOString().slice(0, 10) !== d.prazo)) return 'Informe um prazo válido.'
  return validarBriefingDia(d.briefingDia)
}

export function financeiroExtras(extras: DemandaExtra[], mes: string, hoje: string) {
  const linhas = extras.filter(d => Number(d.valorExtra) > 0 && d.vencimentoExtra?.slice(0, 7) === mes)
  let previsto = 0, recebido = 0, atrasado = 0, venceHoje = 0
  for (const d of linhas) {
    const v = Math.round(Number(d.valorExtra) * 100)
    previsto += v
    if (d.pagoExtra) recebido += v
    else if (d.vencimentoExtra! < hoje) atrasado += v
    else if (d.vencimentoExtra === hoje) venceHoje += v
  }
  return { linhas, previsto: previsto / 100, recebido: recebido / 100, atrasado: atrasado / 100, venceHoje: venceHoje / 100 }
}
