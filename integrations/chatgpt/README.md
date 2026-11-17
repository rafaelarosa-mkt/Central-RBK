# Central RBK no ChatGPT

Plugin privado hospedado em ChatGPT Sites. A plataforma original continua em https://central-rbk.vercel.app.

## Ferramentas

- `buscar_clientes`: consulta somente ID e nome dos clientes ativos, com paginação.
- `criar_demanda`: cadastra vídeo ou post na coleção `itens`, etapa `roteiro`. Usa a tabela existente `RBK DADOS`, que a Central acompanha em tempo real.

Cliente, título, tipo e mês de entrega são obrigatórios. O briefing vai em `roteiro`. Não confundir data de publicação com prazo de entrega: a Central tem mês de entrega, data de gravação e data de publicação; prazos mais específicos de entrega ficam no briefing.

Cada pedido precisa de um `pedidoId` único, reutilizado em tentativas do mesmo pedido. A criação usa insert com resolução de conflito sem atualizar registros existentes. Reenvios nunca sobrescrevem edições feitas na Central. IDs repetidos com conteúdo diferente são recusados.

## Conexão pendente

Configure `SUPABASE_SERVICE_ROLE_KEY` **somente no ambiente privado do Site do plugin**. Obtenha a chave de servidor no projeto Supabase `tbwtafqviaptcxcnmsey`, em Settings / API Keys. A chave publicável usada pelo frontend não serve. Não coloque essa credencial em variáveis `VITE_`, código, GitHub ou mensagens de conversa.

Essa chave tem acesso elevado ao banco; o servidor limita as operações às duas ferramentas acima. Mantenha o Site e seu plugin privados: todos os visitantes autorizados do Site podem executar as ferramentas. Não torne o Site público. A identidade é fornecida pela camada autenticada de Sites; não hospede este Worker diretamente em outro serviço sem substituir essa autenticação.

Sem credencial o plugin recusa consultas e gravações. A presença da variável não comprova acesso: após configurar, teste `buscar_clientes`, depois crie uma demanda solicitada pelo usuário e confira em Produção.

Publique o Site com a capability `mcp`, instale/conecte o plugin associado na mesma conta ChatGPT e selecione-o na conversa. Disponibilidade por superfície/conta deve ser verificada no ChatGPT do usuário. Não depende de um GPT personalizado ou de Actions.

## Validação e publicação

`node --test test.mjs` testa validação, privacidade, ausência de configuração, criação, reenvio e cliente inativo, sem gravar no banco real.

`node build.mjs` gera o Worker para Sites. `.openai/hosting.json` guarda o ID do Site; a credencial nunca faz parte do build. Publique pelo fluxo Sites, preservando acesso privado. O deploy Vercel da aplicação não publica automaticamente esse plugin.
