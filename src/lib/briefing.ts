export const GRUPOS_BRIEFING = [
  { titulo: 'Marca e negócio', campos: [
    { chave: 'sobre', rotulo: 'Sobre o cliente', exemplo: 'História, segmento, região de atuação, personalidade e características da empresa.' },
    { chave: 'produtos', rotulo: 'Produtos e serviços', exemplo: 'O que vende, principais ofertas, prioridades e sazonalidades.' },
    { chave: 'diferenciais', rotulo: 'Posicionamento e diferenciais', exemplo: 'Por que escolher esta marca? Valores, promessas e diferenciais comprovados.' },
    { chave: 'objetivos', rotulo: 'Objetivos da comunicação', exemplo: 'Reconhecimento, vendas, contatos, autoridade; metas e resultados esperados.' },
  ] },
  { titulo: 'Público e mercado', campos: [
    { chave: 'publico', rotulo: 'Público-alvo e personas', exemplo: 'Quem compra, localização, faixa etária relevante, interesses e hábitos.' },
    { chave: 'necessidades', rotulo: 'Dores, desejos e objeções', exemplo: 'Problemas que resolve, dúvidas frequentes e motivos para não comprar.' },
    { chave: 'concorrentes', rotulo: 'Concorrentes e referências de mercado', exemplo: 'Nomes, perfis e o que diferencia o cliente deles.' },
  ] },
  { titulo: 'Identidade visual', campos: [
    { chave: 'cores', rotulo: 'Cores da marca', exemplo: 'Ex.: azul principal #123456, bege #EFE8DD. Informe códigos e como usar cada cor.' },
    { chave: 'fontes', rotulo: 'Fontes e tipografia', exemplo: 'Fontes para títulos e textos, pesos, tamanhos e restrições.' },
    { chave: 'estiloVisual', rotulo: 'Estilo visual e uso do logo', exemplo: 'Minimalista, acolhedor, sofisticado; fotos, enquadramentos, elementos e regras do logo.' },
    { chave: 'materiais', rotulo: 'Logo, manual da marca e materiais', exemplo: 'Links do Drive, pasta de fotos, manual, arquivos de logo e materiais aprovados. Não inclua senhas.' },
  ] },
  { titulo: 'Linguagem e conteúdo', campos: [
    { chave: 'tomVoz', rotulo: 'Tom de voz e personalidade', exemplo: 'Formal ou informal? Como a marca fala? Exemplos de frases e vocabulário.' },
    { chave: 'pilares', rotulo: 'Pilares e temas de conteúdo', exemplo: 'Educação, bastidores, produtos, provas sociais; assuntos e formatos prioritários.' },
    { chave: 'referencias', rotulo: 'Referências criativas', exemplo: 'Perfis, vídeos e campanhas; explique o que gosta e o que não gosta.' },
    { chave: 'restricoes', rotulo: 'O que evitar e cuidados obrigatórios', exemplo: 'Temas proibidos, palavras, promessas, imagens, músicas e avisos obrigatórios.' },
    { chave: 'chamadas', rotulo: 'Chamadas para ação e canais', exemplo: 'Como pedir contato, WhatsApp, site, links, hashtags e informações que devem aparecer.' },
  ] },
  { titulo: 'Produção e aprovação', campos: [
    { chave: 'producao', rotulo: 'Orientações de gravação e produção', exemplo: 'Quem aparece, locais, disponibilidade, figurino, equipamentos e cuidados.' },
    { chave: 'aprovacao', rotulo: 'Responsável e fluxo de aprovação', exemplo: 'Quem aprova, por qual canal, antecedência e prazo de retorno.' },
    { chave: 'observacoes', rotulo: 'Outras orientações', exemplo: 'Datas importantes, campanhas e informações adicionais para a equipe.' },
  ] },
] as const
export type ChaveBriefing = typeof GRUPOS_BRIEFING[number]['campos'][number]['chave']
export type BriefingCliente = Partial<Record<ChaveBriefing, string>>
export const CAMPOS_BRIEFING = GRUPOS_BRIEFING.flatMap(g => [...g.campos])
export function normalizarBriefing(briefing?: BriefingCliente): BriefingCliente {
  return Object.fromEntries(CAMPOS_BRIEFING.map(c => [c.chave, typeof briefing?.[c.chave] === 'string' ? briefing[c.chave]!.trim() : '']))
}
export function textoBriefing(nome: string, briefing?: BriefingCliente) {
  const b = normalizarBriefing(briefing)
  return [`Briefing — ${nome}`, ...GRUPOS_BRIEFING.map(g => {
    const campos = g.campos.filter(c => b[c.chave]).map(c => `${c.rotulo}:\n${b[c.chave]}`)
    return campos.length ? `${g.titulo}\n\n${campos.join('\n\n')}` : ''
  }).filter(Boolean)].join('\n\n')
}
export const coresBriefing = (texto = '') => [...new Set(texto.match(/#[\da-fA-F]{6}\b|#[\da-fA-F]{3}\b/g) ?? [])]
