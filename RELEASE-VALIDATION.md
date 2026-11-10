# Validação para publicação — 10/11/2026, issue #60

Esta entrega reúne diário alimentar, foto opcional como ícone, sincronização com revisão atômica e exclusão da própria conta. Os PRs de implementação são #55, #56, #57 e #59.

## Banco remoto

O projeto `sbaixfmxjoekcjfikiro` voltou a responder depois do acesso ao painel. Estrutura, políticas e dependências foram conferidas antes das alterações. Migrações aplicadas pelo conector:

- `20261110193224`: safe_document_sync.
- `20261110193351`: self_account_deletion.

RLS continua habilitada. A execução das novas funções é negada a anon e permitida a authenticated; a autorização interna valida o próprio usuário. As referências das tabelas privadas e sociais à identidade possuem ON DELETE CASCADE. Nenhum documento de usuário existente foi alterado para testar a entrega.

## Integração real

Validação pela API pública Auth/PostgREST com contas temporárias exclusivas de QA:

- Login por senha com dois usuários e tokens reais.
- Cadastro público e sessão automática, conforme a configuração atual do projeto (confirmação automática de e-mail habilitada).
- Isolamento de documentos entre contas.
- Comparação atômica de revisão, conflito entre versões e repetição idempotente.
- Negação de atualização legada direta após proteção do documento.
- Perfis privados, solicitação/aceitação de amizade, whitelist e bloqueio bilateral.
- Rejeição de senha incorreta e de exclusão sem confirmação digitada.
- Exclusão da própria conta e recusa de gravação posterior com token antigo.

As contas temporárias foram excluídas pelo próprio fluxo e uma consulta administrativa confirmou zero contas restantes com o identificador da rodada. Não foram enviados e-mails de confirmação nem testada a entrega de mensagens de recuperação em uma caixa postal.

## Frontend e persistência

`node prepare-release.cjs`, `node checks.cjs` e `npm run test:db` aprovados. O CI dos quatro PRs passou em Node 22. A execução local usa Node 24.

Navegador local: criação e edição de refeição, valores opcionais e zero, persistência após recarregar, seleção de foto, JPEG quadrado carregado como ícone, reabertura e remoção da foto com retorno ao símbolo padrão. O layout móvel foi verificado com viewport de 390 px e sem overflow horizontal. Os testes de interface usaram uma origem de QA separada, não uma conta de usuário existente.

A revisão de publicação também corrigiu dois casos: uma gravação rejeitada por falta de armazenamento não permanece agendada para envio posterior, e falhar ao sair da conta não invalida o mecanismo de sincronização da sessão ainda aberta. Há testes de regressão para ambos.

## Privacidade e limites

Responsável e contato fornecidos pelo mantenedor: Lume Productions (identificação provisória), naythfol123az@gmail.com (canal temporário). Os dados ativos permanecem enquanto a conta existir ou até exclusão dos registros; não há exclusão automática por inatividade. O aviso distingue a remoção da conta de backups exportados, caches em outros aparelhos e retenção técnica dos provedores. O banco está em East US (North Virginia), Estados Unidos. Não há afirmação de conformidade jurídica automática.

Os advisors não apontaram novos avisos após as migrações. Os avisos informativos de RLS sem políticas das tabelas internas mantêm negação de acesso direto; a tabela preexistente public.Tabela não integra o app e foi preservada sem abrir acesso. A proteção contra senhas vazadas permanece desativada: o projeto está no plano Free e o recurso exige Pro ou superior. Não houve contratação de serviço pago. Referências de remediação: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

Celular físico, leitor de tela, instalação/atualização de PWA em aparelho real e entrega de e-mail de recuperação não foram exercitados pelo agente. Os testes automatizados de cache, autenticação e isolamento e a verificação de viewport não substituem esses testes manuais.
