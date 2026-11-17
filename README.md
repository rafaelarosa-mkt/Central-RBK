# Central RBK

Gestão de clientes, produção, agenda e financeiro da RBK Mídias com Vue 3, Vite e Supabase.

## Integração com ChatGPT

O conector privado de demandas está em `integrations/chatgpt/`. Consulte o README dessa pasta para configuração e publicação independente em Sites. O código foi preparado para consultar clientes e criar conteúdos de produção; é necessário publicar o plugin e configurar sua credencial privada antes de usá-lo. O deploy da Vercel não ativa essa integração sozinho.

## Supabase

1. Em um projeto novo, execute a migração em `supabase/migrations/` pelo SQL Editor. Ela prepara a tabela `RBK DADOS` e o bucket privado `anexos`.
2. Crie o usuário em **Authentication > Users** e execute o comando comentado no fim da migração com o e-mail autorizado. Só contas autorizadas leem ou gravam dados da Central. Se já estiver conectado à Central, saia e entre novamente.
3. Use `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publicável) em `.env.local`. Na Vercel, adicione as mesmas variáveis de ambiente antes do build.

## Ambiente local

```bash
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. O painel pede o login do Supabase.

Para importar um JSON da Central RBK, entre com a conta autorizada e clique em **Restaurar backup**. O backup importa os registros por ID. Os arquivos anexados ficam no Storage e são armazenados separadamente.

