import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { validate, callTool } from './worker.js';
const args = { pedidoId:'solicitacao_123456',clientId:'cliente1',titulo:'Vídeo teste',tipo:'video',mes:'2026-11' };
test('rejects invalid dates, unknown fields and invalid types',()=>{
  for (const extra of [{dataPost:'2026-02-30'},{tipo:'outro'},{mes:'2026-13'},{status:'publicado'},{titulo:''}]) assert.throws(()=>validate({...args,...extra}));
});
test('private endpoint refuses missing identity',async()=>{
  assert.equal((await worker.fetch(new Request('https://example.com/mcp',{method:'POST',body:'{}'}),{})).status,401);
});
test('tools discoverable without credentials; writes fail closed',async()=>{
  const request = method => new Request('https://example.com/mcp',{method:'POST',headers:{'oai-authenticated-user-id':'owner'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params:{name:'criar_demanda',arguments:args}})});
  assert.equal((await (await worker.fetch(request('tools/list'),{})).json()).result.tools.length,2);
  assert.equal((await (await worker.fetch(request('tools/call'),{})).json()).result.isError,true);
});
test('creates once, preserves manual edits on retry, detects conflicting reuse',async()=>{
  const originalFetch = globalThis.fetch;
  let saved, writes=0;
  globalThis.fetch=async(url,options)=>{
    const u=new URL(url);
    if(options.method==='POST'){writes++;saved=JSON.parse(options.body);return Response.json([saved]);}
    if(u.searchParams.get('colecao')==='eq.clients') return Response.json([{id:'cliente1',dados:{nome:'Cliente',ativo:true}}]);
    return Response.json(saved?[saved]:[]);
  };
  try {
    const env={SUPABASE_SERVICE_ROLE_KEY:'test'};
    const a=await callTool('criar_demanda',args,env);
    assert.equal(a.sucesso,true);
    assert.equal(a.jaExistia,false);
    saved.dados.status='editado';
    const b=await callTool('criar_demanda',args,env);
    assert.equal(b.jaExistia,true);
    assert.equal(b.status,'editado');
    assert.equal(writes,1);
    await assert.rejects(callTool('criar_demanda',{...args,titulo:'Outro pedido'},env));
    assert.equal(writes,1);
  } finally {globalThis.fetch=originalFetch;}
});
test('inactive client cannot receive demands',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async url=>Response.json(new URL(url).searchParams.get('colecao')==='eq.clients'?[{id:'cliente1',dados:{ativo:false}}]:[]);
  try {await assert.rejects(callTool('criar_demanda',args,{SUPABASE_SERVICE_ROLE_KEY:'test'}),/inativo/);} finally {globalThis.fetch=originalFetch;}
});
