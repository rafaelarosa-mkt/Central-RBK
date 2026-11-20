export const CAMPOS_DIA = [
  { key: 'objetivo', label: 'Objetivo do atendimento', placeholder: 'O que o cliente quer alcançar com este trabalho?' },
  { key: 'entregas', label: 'Entregas combinadas', placeholder: 'Quantidade de fotos, vídeos, duração, formatos e onde serão usados.' },
  { key: 'roteiro', label: 'Programação e momentos obrigatórios', placeholder: 'Ordem das atividades, cenas, pessoas, produtos e momentos que não podem faltar.' },
  { key: 'visual', label: 'Identidade visual e referências', placeholder: 'Cores, estilo, tom de voz, links de referência e materiais da marca.' },
  { key: 'estrutura', label: 'Equipe, equipamentos e acesso', placeholder: 'Quem participa, o que levar, autorizações, estacionamento e preparação do local.' },
  { key: 'restricoes', label: 'Cuidados e restrições', placeholder: 'O que evitar, pessoas que não devem aparecer e orientações específicas.' },
  { key: 'aprovacao', label: 'Aprovação e entrega final', placeholder: 'Quem aprova, como enviar os arquivos e revisões combinadas.' },
] as const
export type BriefingDia = { data: string; inicio: string; fim: string; local: string; contato: string } & Record<typeof CAMPOS_DIA[number]['key'], string>
export function normalizarBriefingDia(b?: Partial<BriefingDia>): BriefingDia {
  return Object.fromEntries(['data', 'inicio', 'fim', 'local', 'contato', ...CAMPOS_DIA.map(c => c.key)].map(k => [k, typeof b?.[k as keyof BriefingDia] === 'string' ? b[k as keyof BriefingDia] : ''])) as BriefingDia
}
export function validarBriefingDia(b?: Partial<BriefingDia>) {
  if (b?.data && (!/^\d{4}-\d{2}-\d{2}$/.test(b.data) || !Number.isFinite(Date.parse(b.data)) || new Date(b.data).toISOString().slice(0, 10) !== b.data)) return 'Informe uma data de atendimento válida.'
  for (const h of [b?.inicio, b?.fim]) if (h && !/^([01]\d|2[0-3]):[0-5]\d$/.test(h)) return 'Informe um horário válido.'
  return ''
}
