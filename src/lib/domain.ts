// Regras do negócio da Central RBK: datas, pagamentos, produção e contratos.

export type Status = 'roteiro' | 'gravado' | 'editado' | 'programado' | 'publicado'
export type Tipo = 'video' | 'post'
export type PagStatus = 'pago' | 'hoje' | 'atrasado' | 'aberto' | 'sem' | 'dispensado' | 'permuta'
export type CtStatus = 'futuro' | 'vigente' | 'renovar' | 'encerrado'

export interface Cliente {
  id: string
  nome: string
  contato?: string
  telefone?: string
  instagram?: string
  plano?: string
  videosMes?: number
  postsMes?: number
  valor?: number
  valorPermuta?: number
  diaPgto?: number | null
  obsPgto?: string
  obs?: string
  cor?: string
  ativo?: boolean
  inicioContrato?: string
  mesesContrato?: number | null
  [k: string]: unknown
}
export interface Anexo { id: string; nome: string }
export interface Item {
  id: string
  clientId: string
  tipo?: Tipo
  mes: string
  titulo?: string
  status?: Status
  dataGravacao?: string
  dataPost?: string
  roteiro?: string
  anexos?: Anexo[]
  [k: string]: unknown
}
export interface Pagamento { clientId: string; mes: string; pago: boolean; pagoEm?: string; valor?: number; valorPermuta?: number; naoCobrar?: boolean; motivo?: string }
export interface ContaPagar {
  id: string
  tipoRegistro: 'conta_pagar'
  descricao: string
  fornecedor: string
  categoria: string
  valor: number
  vencimento: string
  pago: boolean
  pagoEm: string
  observacoes: string
  excluida?: boolean
}
export function statusConta(conta: Pick<ContaPagar, 'pago' | 'vencimento'>, hoje = todayStr()): 'pago' | 'hoje' | 'atrasado' | 'aberto' {
  if (conta.pago) return 'pago'
  return conta.vencimento < hoje ? 'atrasado' : conta.vencimento === hoje ? 'hoje' : 'aberto'
}
export function validarConta(conta: Pick<ContaPagar, 'descricao' | 'valor' | 'vencimento' | 'pago' | 'pagoEm'>) {
  const dataValida = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d
  if (!conta.descricao.trim()) return 'Informe a descrição da conta.'
  if (!Number.isFinite(conta.valor) || conta.valor <= 0) return 'Informe um valor maior que zero.'
  if (!dataValida(conta.vencimento)) return 'Informe uma data de vencimento válida.'
  if (conta.pago && (!dataValida(conta.pagoEm) || conta.pagoEm > todayStr())) return 'Informe a data do pagamento, até hoje.'
  return ''
}
export interface Evento {
  id: string
  tipo: 'gravacao' | 'reuniao' | 'entrega' | 'outro'
  clientId?: string
  titulo?: string
  data: string
  hora?: string
  duracao?: number
  local?: string
  obs?: string
  feito?: boolean
  [k: string]: unknown
}

export const STATUS: Status[] = ['roteiro', 'gravado', 'editado', 'programado', 'publicado']
export const LBL: Record<Tipo, Record<Status, string>> = {
  video: { roteiro: 'Roteiro', gravado: 'Gravado', editado: 'Editado', programado: 'Programado', publicado: 'Publicado' },
  post: { roteiro: 'Briefing', gravado: 'Arte criada', editado: 'Aprovado', programado: 'Programado', publicado: 'Publicado' },
}
export const COLSUB: Record<Status, string> = {
  roteiro: 'posts: briefing', gravado: 'posts: arte criada', editado: 'pronto para programar',
  programado: 'agendado no perfil', publicado: 'no ar',
}
export const CORES = ['#E9590C', '#2B7FD6', '#1F9E6E', '#B14CC4', '#D6A21E', '#D6336C', '#11A3B5', '#7A8194']
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DIASL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
export const TIPOS_EV: Record<Evento['tipo'], string> = { gravacao: 'Gravação', reuniao: 'Reunião', entrega: 'Entrega', outro: 'Outro' }
export const PLBL: Record<PagStatus, string> = { pago: 'Pago', hoje: 'Vence hoje', atrasado: 'Atrasado', aberto: 'A vencer', sem: 'Sem vencimento', dispensado: 'Não cobrar neste mês', permuta: 'Somente permuta' }
export const PVAR: Record<PagStatus, 'success' | 'info' | 'danger' | 'muted'> = { pago: 'success', hoje: 'info', atrasado: 'danger', aberto: 'muted', sem: 'muted', dispensado: 'muted', permuta: 'info' }

export const pad = (n: number) => String(n).padStart(2, '0')
export const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
export const ymNow = () => todayStr().slice(0, 7)
export const fmtMes = (m: string) => { const [y, mm] = m.split('-'); return `${MESES[+mm - 1]} ${y}` }
export const addMes = (m: string, k: number) => {
  let [y, mm] = m.split('-').map(Number); mm += k
  while (mm > 12) { mm -= 12; y++ } while (mm < 1) { mm += 12; y-- }
  return `${y}-${pad(mm)}`
}
export const dim = (m: string) => { const [y, mm] = m.split('-').map(Number); return new Date(y, mm, 0).getDate() }
export const addDias = (d: string, k: number) => {
  const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + k)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}
export const brl = (n: unknown) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const fmtD = (d?: string) => { if (!d) return ''; const [, m, dd] = d.split('-'); return `${dd}/${m}` }
export const fmtBR = (d?: string) => { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}` }
export const fmtLongo = (d: string) => { const x = new Date(d + 'T12:00'); return `${DIASL[x.getDay()]}, ${x.getDate()} de ${MESES[x.getMonth()]}` }

export const cor = (c?: Cliente) => c?.cor || CORES[7]
export const vencData = (c: Cliente, m: string) => (c.diaPgto ? `${m}-${pad(Math.min(+c.diaPgto, dim(m)))}` : null)

export function valoresPagamento(c: Cliente, p?: Pagamento) {
  const dinheiro = Math.max(0, Number(p?.valor ?? c.valor) || 0)
  const permuta = Math.max(0, Number(p?.valorPermuta ?? c.valorPermuta) || 0)
  return p?.naoCobrar ? { dinheiro: 0, permuta: 0 } : { dinheiro, permuta }
}

export function pagStatus(c: Cliente, m: string, pags: Record<string, Pagamento>): PagStatus {
  const p = pags[`${c.id}_${m}`]
  if (p?.naoCobrar) return 'dispensado'
  const { dinheiro, permuta } = valoresPagamento(c, p)
  if (dinheiro === 0 && permuta > 0) return 'permuta'
  if (p?.pago) return 'pago'
  const v = vencData(c, m)
  if (!v) return 'sem'
  const t = todayStr()
  if (v === t) return 'hoje'
  if (v < t) return 'atrasado'
  return 'aberto'
}

export function prog(c: Cliente, m: string, itens: Item[]) {
  const its = itens.filter(i => i.clientId === c.id && i.mes === m)
  const v = its.filter(i => i.tipo !== 'post')
  const p = its.filter(i => i.tipo === 'post')
  const feito = (a: Item[]) => a.filter(i => STATUS.indexOf(i.status || 'roteiro') >= 1).length
  return {
    its, vGrav: feito(v), pFeito: feito(p),
    aProg: its.filter(i => i.status === 'editado').length,
    rot: its.filter(i => (i.status || 'roteiro') === 'roteiro').length,
    pub: its.filter(i => i.status === 'publicado').length,
  }
}

export interface Contrato { ini: string; fim: string; meses: number; mesN: number; resta: number; st: CtStatus; pct: number }
export function contrato(c: Pick<Cliente, 'inicioContrato' | 'mesesContrato'>): Contrato | null {
  const n = Number(c.mesesContrato)
  if (!c.inicioContrato || !n) return null
  const ini = new Date(c.inicioContrato + 'T12:00')
  const f = new Date(ini); f.setMonth(f.getMonth() + n); f.setDate(f.getDate() - 1)
  const fim = `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
  const t = new Date(todayStr() + 'T12:00'); const D = 864e5
  const total = Math.round((+f - +ini) / D) + 1
  const passados = Math.round((+t - +ini) / D) + 1
  const resta = Math.round((+f - +t) / D)
  let mesN = (t.getFullYear() - ini.getFullYear()) * 12 + t.getMonth() - ini.getMonth() + (t.getDate() >= ini.getDate() ? 1 : 0)
  mesN = Math.max(1, Math.min(n, mesN))
  const st: CtStatus = t < ini ? 'futuro' : resta < 0 ? 'encerrado' : resta <= 30 ? 'renovar' : 'vigente'
  return { ini: c.inicioContrato, fim, meses: n, mesN, resta, st, pct: Math.max(0, Math.min(100, (passados / total) * 100)) }
}
export function ctLabel(k: Contrato | null): { text: string; variant: 'muted' | 'danger' | 'warning' | 'success' } {
  if (!k) return { text: 'Sem datas', variant: 'muted' }
  if (k.st === 'futuro') return { text: `Começa ${fmtD(k.ini)}`, variant: 'muted' }
  if (k.st === 'encerrado') return { text: `Encerrado há ${-k.resta} dia${k.resta === -1 ? '' : 's'}`, variant: 'danger' }
  if (k.st === 'renovar') return { text: k.resta === 0 ? 'Termina hoje' : `Termina em ${k.resta} dia${k.resta === 1 ? '' : 's'}`, variant: 'warning' }
  return { text: 'Vigente', variant: 'success' }
}

export function waNum(t?: string) {
  let d = String(t || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length <= 11) d = '55' + d
  return d
}

export function gcal(e: Evento, c?: Cliente) {
  const tt = encodeURIComponent((e.titulo || TIPOS_EV[e.tipo] || 'Compromisso') + (c ? ' · ' + c.nome : ''))
  const d = e.data.replace(/-/g, '')
  let dates: string
  if (e.hora) {
    const [h, mi] = e.hora.split(':').map(Number)
    const fim = h * 60 + mi + (Number(e.duracao) || 60)
    dates = `${d}T${pad(h)}${pad(mi)}00/${d}T${pad(Math.floor(fim / 60) % 24)}${pad(fim % 60)}00`
  } else dates = `${d}/${addDias(e.data, 1).replace(/-/g, '')}`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${tt}&dates=${dates}&ctz=America/Sao_Paulo&details=${encodeURIComponent(e.obs || '')}&location=${encodeURIComponent(e.local || '')}`
}

export function msgCobranca(c: Cliente, m: string, valor: number, st: PagStatus) {
  const venc = vencData(c, m)
  const nome = (c.contato || c.nome).split(' ')[0]
  const quando = st === 'hoje' ? 'hoje é o dia do pagamento'
    : st === 'atrasado' ? `o pagamento com vencimento em ${fmtD(venc || '')} ainda está em aberto`
    : `o pagamento vence no dia ${fmtD(venc || '')}`
  return `Olá, ${nome}! Tudo bem?\n\nPassando para lembrar que ${quando}, referente aos serviços de ${fmtMes(m).split(' ')[0]} da RBK Mídias, no valor de ${brl(valor)}.\n\nQualquer dúvida, estamos à disposição. Obrigado!`
}
