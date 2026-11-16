-- Dados fictícios para o mês atual. Rode manualmente no SQL Editor do Supabase.
with calendario as (
  select date_trunc('month', timezone('America/Sao_Paulo', now()))::date as inicio,
         timezone('America/Sao_Paulo', now())::date as hoje
), exemplos(colecao, id, dados) as (
  values
    ('clients', 'demo-rbk-aurora', '{"nome":"[Demo] Café Aurora","contato":"Lia","plano":"Essencial","videosMes":2,"postsMes":4,"valor":1500,"diaPgto":5,"cor":"#E9590C","ativo":true}'),
    ('clients', 'demo-rbk-vertice', '{"nome":"[Demo] Estúdio Vértice","contato":"Caio","plano":"Conteúdo","videosMes":4,"postsMes":6,"valor":2400,"diaPgto":10,"cor":"#2B7FD6","ativo":true}'),
    ('clients', 'demo-rbk-quintal', '{"nome":"[Demo] Quintal Botânico","contato":"Nina","plano":"Social","videosMes":2,"postsMes":3,"valor":950,"diaPgto":25,"cor":"#1F9E6E","ativo":true}'),
    ('itens', 'demo-rbk-roteiro', '{"clientId":"demo-rbk-aurora","tipo":"video","titulo":"[Demo] Bastidores do café","status":"roteiro","roteiro":"Abrir com a moagem e encerrar com a xícara servida."}'),
    ('itens', 'demo-rbk-gravado', '{"clientId":"demo-rbk-vertice","tipo":"video","titulo":"[Demo] Tour pelo estúdio","status":"gravado"}'),
    ('itens', 'demo-rbk-editado', '{"clientId":"demo-rbk-quintal","tipo":"video","titulo":"[Demo] Cuidados com samambaias","status":"editado"}'),
    ('itens', 'demo-rbk-programado', '{"clientId":"demo-rbk-aurora","tipo":"post","titulo":"[Demo] Cardápio da semana","status":"programado"}'),
    ('itens', 'demo-rbk-publicado', '{"clientId":"demo-rbk-vertice","tipo":"post","titulo":"[Demo] Antes e depois","status":"publicado"}'),
    ('agenda', 'demo-rbk-reuniao', '{"clientId":"demo-rbk-aurora","tipo":"reuniao","titulo":"[Demo] Alinhamento de pauta","hora":"09:30","duracao":30}'),
    ('agenda', 'demo-rbk-gravacao', '{"clientId":"demo-rbk-vertice","tipo":"gravacao","titulo":"[Demo] Captação no estúdio","hora":"14:00","duracao":90}'),
    ('agenda', 'demo-rbk-entrega', '{"clientId":"demo-rbk-quintal","tipo":"entrega","titulo":"[Demo] Entrega de vídeos","hora":"16:00","duracao":30}'),
    ('pagamentos', 'demo-rbk-aurora', '{"clientId":"demo-rbk-aurora","pago":true,"valor":1500}'),
    ('pagamentos', 'demo-rbk-vertice', '{"clientId":"demo-rbk-vertice","pago":false,"valor":2400}'),
    ('pagamentos', 'demo-rbk-quintal', '{"clientId":"demo-rbk-quintal","pago":false,"valor":950}')
), inseridos as (
  insert into public."RBK DADOS" (colecao, id, dados)
  select colecao,
    case when colecao = 'pagamentos' then id || '_' || to_char(inicio, 'YYYY-MM')
         when colecao in ('itens','agenda') then id || '-' || to_char(inicio, 'YYYY-MM')
         else id end,
    dados::jsonb || case colecao
      when 'clients' then jsonb_build_object('inicioContrato', inicio, 'mesesContrato', 6)
      when 'agenda' then jsonb_build_object('data', least(
        hoje + case id when 'demo-rbk-reuniao' then 0 when 'demo-rbk-gravacao' then 2 else 5 end,
        (inicio + interval '1 month' - interval '1 day')::date))
      when 'pagamentos' then jsonb_build_object('mes', to_char(inicio, 'YYYY-MM'))
        || case when dados::jsonb -> 'pago' = 'true'::jsonb
                then jsonb_build_object('pagoEm', inicio + 4) else '{}'::jsonb end
      else jsonb_build_object('mes', to_char(inicio, 'YYYY-MM')) end
  from exemplos cross join calendario
  on conflict (colecao, id) do nothing
  returning colecao
)
select colecao, count(*) as novos_registros from inseridos group by colecao order by colecao;
