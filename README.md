# Central RBK

Gestão de clientes, produção, agenda e financeiro da RBK Mídias com Vue 3, Vite e Supabase.

## Integração com ChatGPT

O conector privado de demandas está em `integrations/chatgpt/`. Consulte o README dessa pasta para configuração e publicação independente em Sites. O código foi preparado para consultar clientes e criar conteúdos de produção; é necessário publicar o plugin e configurar sua credencial privada antes de usá-lo. O deploy da Vercel não ativa essa integração sozinho.

## Supabase

1. Em um projeto novo, execute a migração em `supabase/migrations/` pelo SQL Editor. Ela prepara a tabela `RBK DADOS` e o bucket privado `anexos`.
2. Crie o usuário em **Authentication > Users** e execute o comando comentado no fim da migração com o e-mail autorizado. Só contas autorizadas leem ou gravam dados da Central. Se já estiver conectado à Central, saia e entre novamente.
3. Use `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publicável) em `.env.local`. Na Vercel, adicione as mesmas variáveis de ambiente antes do build.

## Cobranças e permutas

No cadastro do cliente, preencha separadamente o valor mensal em dinheiro e o valor mensal em permuta. Valores antigos continuam como dinheiro; a permuta começa em zero até ser informada.

No Financeiro, escolha o mês e use **Editar mês** para ajustar somente aquele período. **Não cobrar neste mês** retira dinheiro e permuta dos totais e remove os alertas de atraso, mantendo os valores guardados. Use **Reativar cobrança** para desfazer. Cobranças já pagas precisam ter o pagamento desfeito antes de serem dispensadas ou de terem o valor em dinheiro corrigido.

A permuta aparece separadamente como prevista, sem aumentar o dinheiro recebido, a receber ou atrasado. O painel e a mensagem de cobrança usam somente a parcela em dinheiro. Os novos campos são persistidos no JSON da tabela existente; não há migração de banco necessária.

Validação das regras: `node --test tests/financeiro.test.mjs` (Node 24 ou superior).

## Contas a pagar

O resumo **Saldo previsto** cruza as entradas em dinheiro do Financeiro com todas as despesas do mês selecionado, mostrando sobra ou falta. Valores já pagos/recebidos continuam no total previsto, com os pendentes destacados separadamente. A projeção ignora permutas, cobranças dispensadas e despesas excluídas; não representa saldo bancário nem inclui saldo anterior. Filtros da lista, inclusive Todos os meses, não alteram o mês desse resumo.

Use a seção **Contas a pagar** (no celular, **A pagar**) para cadastrar despesas com descrição, fornecedor, categoria, valor, vencimento e observações. É possível registrar pagamento na data escolhida, marcar como paga hoje, desfazer pagamento, editar e excluir com opção de restaurar. O filtro **Todos os meses** permite localizar atrasos de períodos anteriores.

Os totais seguem o mês de vencimento e ignoram contas excluídas. Registrar pagamento não realiza transferência bancária. As despesas ficam na coleção financeira existente, com `tipoRegistro: conta_pagar`, separadas dos recebimentos dos clientes. Isso preserva as permissões, a sincronização e o backup já existentes, sem exigir migração de banco.

Para contas recorrentes, marque **Repetir todos os meses** e informe o primeiro vencimento e o **Último mês (inclusive)**. A Central salva todos os meses de uma vez, até 120 meses, com pagamentos independentes. Dias 29, 30 ou 31 são ajustados ao último dia dos meses mais curtos, retomando o dia original nos demais. É possível converter uma conta avulsa já cadastrada sem duplicar o primeiro lançamento. A lista mostra a parcela e até quando a conta vai. Editar ou excluir uma parcela afeta somente aquele lançamento.

Testes: `node --test tests/*.test.mjs`.

## Executar localmente

```bash
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. O painel pede o login do Supabase.

Para importar um JSON da Central RBK, entre com a conta autorizada e clique em **Restaurar backup**. O backup importa os registros por ID. Os arquivos anexados ficam no Storage e são armazenados separadamente.

