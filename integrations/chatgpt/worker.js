// Hosted privately by Sites. Database credentials never enter browser code.
const SITE = 'https://central-rbk.vercel.app';
const SUPABASE_URL = 'https://tbwtafqviaptcxcnmsey.supabase.co';
const TABLE = 'RBK DADOS';
const string = (maxLength, description) => ({ type: 'string', maxLength, description });
export const tools = [
  { name: 'buscar_clientes', description: 'Busca clientes ativos da Central RBK. Retorna somente ID e nome. Use para identificar o cliente antes de cadastrar uma demanda; em caso de ambiguidade pergunte ao usuário.', annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }, inputSchema: { type: 'object', properties: { busca: string(100, 'Trecho do nome do cliente; vazio lista todos.'), pagina: { type: 'integer', minimum: 1, maximum: 1000 } }, additionalProperties: false } },
  { name: 'criar_demanda', description: 'Cadastra um vídeo ou post na Produção da Central RBK. Confirme cliente, tipo, título e mês com o pedido do usuário. Não invente prazos. dataPost é publicação, não entrega. Reutilize pedidoId ao repetir a mesma tentativa; gere outro para uma nova demanda. Só confirme sucesso se a ferramenta retornar sucesso.', annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }, inputSchema: { type: 'object', properties: {
    pedidoId: { type: 'string', pattern: '^[a-zA-Z0-9_-]{16,80}$', description: 'Identificador único da solicitação para evitar duplicatas em reenvios.' },
    clientId: string(120, 'ID retornado por buscar_clientes.'), titulo: string(200, 'Título da demanda.'), tipo: { type: 'string', enum: ['video', 'post'] }, mes: { type: 'string', pattern: '^20[0-9]{2}-(0[1-9]|1[0-2])$', description: 'Mês de entrega YYYY-MM.' }, roteiro: string(20000, 'Briefing, instruções e eventual prazo de entrega informado pelo usuário.'), dataGravacao: { type: 'string', format: 'date' }, dataPost: { type: 'string', format: 'date', description: 'Data de publicação, apenas se informada.' }
  }, required: ['pedidoId','clientId','titulo','tipo','mes'], additionalProperties: false } }
];
class Failure extends Error {}
function checked(value, max, required = false) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Failure('Campo de texto ausente ou inválido.');
  return value.trim();
}
function date(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw new Failure('Data inválida. Use YYYY-MM-DD.');
  return value;
}
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Failure('Argumentos inválidos.');
  const schema = tools[1].inputSchema;
  if (Object.keys(input).some(k => !(k in schema.properties))) throw new Failure('Campo não permitido.');
  const pedidoId = checked(input.pedidoId, 80, true);
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(pedidoId)) throw new Failure('pedidoId inválido.');
  if (!['video','post'].includes(input.tipo)) throw new Failure('Tipo deve ser video ou post.');
  if (typeof input.mes !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(input.mes)) throw new Failure('Mês inválido.');
  return { pedidoId, dados: { clientId: checked(input.clientId,120,true), titulo: checked(input.titulo,200,true), tipo: input.tipo, mes: input.mes, roteiro: checked(input.roteiro,20000), dataGravacao: date(input.dataGravacao), dataPost: date(input.dataPost), status: 'roteiro', anexos: [], origem: 'chatgpt' } };
}
async function db(env, query, options = {}) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Failure('Conexão pendente: configure SUPABASE_SERVICE_ROLE_KEY no ambiente privado do plugin. Nenhuma demanda foi cadastrada.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(TABLE)}?${new URLSearchParams(query)}`, {
    ...options, headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Failure('Não foi possível acessar o banco da Central. Verifique a conexão antes de tentar novamente com o mesmo pedidoId.');
  return response.status === 204 ? null : response.json();
}
async function find(env, collection, id) {
  const rows = await db(env, { select:'id,dados', colecao:`eq.${collection}`, id:`eq.${id}`, limit:'1' });
  return rows[0];
}
function result(row, reused) {
  return { sucesso: true, jaExistia: reused, id: row.id, titulo: row.dados.titulo, clientId: row.dados.clientId, mes: row.dados.mes, tipo: row.dados.tipo, status: row.dados.status, central: `${SITE}/producao`, mensagem: 'Demanda salva em Produção. Selecione o mês informado na Central.' };
}
export async function callTool(name, args, env) {
  if (name === 'buscar_clientes') {
    if (!args || typeof args !== 'object' || Array.isArray(args) || Object.keys(args).some(k => !['busca','pagina'].includes(k))) throw new Failure('Argumentos inválidos.');
    const busca = checked(args.busca,100);
    if (/[*,()%\\]/.test(busca)) throw new Failure('Informe apenas um trecho simples do nome.');
    const page = args.pagina ?? 1;
    if (!Number.isInteger(page) || page < 1 || page > 1000) throw new Failure('Página inválida.');
    const rows = await db(env, { select:'id,dados->>nome', colecao:'eq.clients', or:'(dados->>ativo.is.null,dados->>ativo.neq.false)', ...(busca ? {'dados->>nome':`ilike.*${busca}*`} : {}), order:'id.asc', offset:String((page-1)*100), limit:'100' });
    return { clientes:rows, proximaPagina: rows.length === 100 ? page+1 : null };
  }
  if (name !== 'criar_demanda') throw new Failure('Ferramenta não disponível.');
  const { pedidoId, dados } = validate(args);
  const id = `chatgpt_${pedidoId}`;
  const previous = await find(env,'itens',id);
  // Record the original payload separately so a retry never overwrites manual edits.
  const fingerprint = JSON.stringify(dados);
  if (previous) {
    if (previous.dados.pedidoOriginal !== fingerprint) throw new Failure('pedidoId já usado para outra demanda. Use um novo identificador para um novo pedido.');
    return result(previous,true);
  }
  const client = await find(env,'clients',dados.clientId);
  if (!client || client.dados.ativo === false) throw new Failure('Cliente não encontrado ou inativo. Busque o cliente antes de cadastrar.');
  const row = { colecao:'itens', id, dados:{ ...dados, pedidoOriginal:fingerprint, atualizado:Date.now() }, atualizado:new Date().toISOString() };
  const inserted = await db(env,{on_conflict:'colecao,id'},{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(row)});
  if (inserted.length) return result(inserted[0],false);
  const existing = await find(env,'itens',id);
  if (!existing || existing.dados.pedidoOriginal !== fingerprint) throw new Failure('Conflito no identificador do pedido. Verifique a Central antes de repetir.');
  return result(existing,true);
}
const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {
  async fetch(request,env) {
    // Sites supplies verified identity after checking owner-private access.
    if (!request.headers.get('oai-authenticated-user-id')) return json({erro:'Acesso privado. Entre com sua conta ChatGPT.'},401);
    const url = new URL(request.url);
    if (url.pathname !== '/mcp') {
      if (request.method !== 'GET' || url.pathname !== '/') return json({erro:'Não encontrado'},404);
      const ready = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
      return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Central RBK — conexão com ChatGPT</title><style>body{font:18px system-ui;background:#e8e4dc;color:#171717;margin:0;padding:8vw}main{max-width:640px;margin:auto}h1{font-size:42px}a{color:inherit}p{line-height:1.6}</style><main><p>RBK MÍDIAS</p><h1>Demandas pelo ChatGPT</h1><p>${ready ? 'Credencial configurada. Teste a busca de clientes no plugin para verificar a conexão.' : 'Falta conectar o banco. Configure a variável privada SUPABASE_SERVICE_ROLE_KEY neste Site; não use a chave pública da Central.'}</p><p>Depois de conectar, selecione o plugin Central RBK na conversa e peça para cadastrar um vídeo ou post. Informe o cliente e o mês de entrega.</p><p>Os pedidos são salvos em Produção, na etapa Roteiro/Briefing. Publicação e gravação têm datas próprias; o prazo de entrega detalhado vai no briefing.</p><a href="${SITE}">Abrir Central RBK ↗</a></main></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'"}});
    }
    if (request.method !== 'POST') return json({erro:'Use POST'},405);
    const body = await request.text();
    if (body.length > 30000) return json({erro:'Pedido muito grande'},413);
    let rpc;
    try { rpc = JSON.parse(body); } catch { return json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'JSON inválido'}}); }
    if (!rpc || rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') return json({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Pedido inválido'}});
    const reply = result => json({jsonrpc:'2.0',id:rpc.id ?? null,result});
    if (rpc.method === 'server/discover') return reply({supportedVersions:['2026-07-28'],capabilities:{tools:{}}});
    if (rpc.method === 'initialize') return reply({protocolVersion:'2025-03-26',serverInfo:{name:'central-rbk',version:'1.0.0'},capabilities:{tools:{}}});
    if (rpc.method.startsWith('notifications/')) return new Response(null,{status:202});
    if (rpc.method === 'ping') return reply({});
    if (rpc.method === 'tools/list') return reply({tools});
    if (rpc.method === 'tools/call') {
      try { const data = await callTool(rpc.params?.name,rpc.params?.arguments ?? {},env); return reply({content:[{type:'text',text:JSON.stringify(data)}]}); }
      catch (e) { return reply({isError:true,content:[{type:'text',text:e instanceof Failure ? e.message : 'Falha temporária. Nenhum sucesso confirmado; repita com o mesmo pedidoId.'}]}); }
    }
    return json({jsonrpc:'2.0',id:rpc.id ?? null,error:{code:-32601,message:'Método não disponível'}});
  }
};
