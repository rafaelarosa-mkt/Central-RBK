# Google Agenda na Central

Sincronização de leitura de `rafaelabose@gmail.com`: a Agenda consulta os eventos do mês ao abrir, ao trocar de mês, ao voltar à aba e a cada minuto enquanto visível. Cada consulta substitui o conjunto anterior, refletindo adições, edições e exclusões sem duplicar registros no Supabase. Eventos recorrentes são expandidos pelo Google; eventos de vários dias aparecem em cada dia correspondente. Horários são exibidos em America/Sao_Paulo.

Os eventos do Google são editados no Google. Os eventos próprios da Central continuam independentes. A conexão é individual por navegador e vinculada à conta autenticada da Central. Não há sincronização em segundo plano com a tela fechada, nem cópia dos eventos Google para o banco da Central.

## Ativação

1. No projeto Google Cloud Central RBK (`famous-smithy-515001-h3`), ative Google Calendar API.
2. Configure a tela OAuth e, se estiver em teste, inclua `rafaelabose@gmail.com` nos usuários de teste.
3. Crie um cliente OAuth do tipo Aplicativo da Web, com o URI de redirecionamento **exato**:
   `https://central-rbk.vercel.app/api/google-calendar?action=callback`
4. Na Vercel / Settings / Environment Variables, configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` para Production. Não use prefixo VITE para essas credenciais. As variáveis existentes `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` também são usadas pelo servidor para validar a sessão da Central.
5. Faça novo deploy. Abra Agenda e clique em Conectar Google Agenda, escolhendo `rafaelabose@gmail.com`. Autorize leitura dos eventos.

Escopos: `openid email https://www.googleapis.com/auth/calendar.events.readonly`. Não é solicitada permissão para editar ou apagar eventos.

O token de renovação fica criptografado com AES-GCM em cookie Secure/HttpOnly, vinculado ao usuário Supabase. Cookies de estado expiram em 10 minutos e o fluxo usa state e PKCE. A chave secreta do Google permanece no servidor. Ao desconectar, a conexão é removida deste navegador. Para revogar o acesso de todos os navegadores, use as permissões de apps na Conta Google.

Se a tela de consentimento estiver em Testing, o Google pode expirar a autorização offline após sete dias; para uso contínuo, configure o status de produção conforme as exigências do Google. Revogação e expiração solicitam nova conexão. As permissões do Google não são transferidas pelo plugin do ChatGPT.

O servidor roda nas Vercel Functions. `vite` local sozinho não executa `/api`; use o ambiente Vercel para testes completos. Depois da configuração, validar com um evento autorizado: criar/alterar/excluir no Google e conferir a próxima atualização na Central, além de um evento de dia inteiro e um recorrente. Testes locais não comprovam a autorização real.
