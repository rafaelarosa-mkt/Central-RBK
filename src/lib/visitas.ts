export interface Remarcacao { de: string; horaAnterior: string; para: string; horaNova: string; motivo: string; solicitadoPor: string; registradoEm: string }
export interface Visita { id: string; tipoRegistro: 'visita'; clientId: string; mes: string; data: string; hora: string; local: string; observacoes: string; status: 'agendada' | 'realizada' | 'cancelada'; historico: Remarcacao[]; criadoEm: string }
export const dataVisitaValida = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d
export function validarAgendamento(data: string, hora: string) {
  if (!dataVisitaValida(data)) return 'Informe uma data válida.'
  if (hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return 'Informe um horário válido.'
  return ''
}
export function remarcarVisita(v: Visita, data: string, hora: string, motivo: string, solicitadoPor: string, agora = new Date().toISOString()): Visita {
  const erro = validarAgendamento(data, hora)
  if (erro) throw new Error(erro)
  if (v.status !== 'agendada') throw new Error('Somente visitas agendadas podem ser remarcadas.')
  if (v.data === data && v.hora === hora) throw new Error('Escolha uma nova data ou horário.')
  if (!motivo.trim() || !solicitadoPor.trim()) throw new Error('Informe o motivo e quem solicitou a remarcação.')
  return { ...v, data, hora, historico: [...(v.historico || []), { de: v.data, horaAnterior: v.hora, para: data, horaNova: hora, motivo: motivo.trim(), solicitadoPor: solicitadoPor.trim(), registradoEm: agora }] }
}
