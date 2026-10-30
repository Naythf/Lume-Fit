# Amigos e visibilidade

Issue #38. Nova aba Amigos, adicionada ao Lume Hub preservando seis itens em uma linha no celular. Rotas e dados anteriores preservados.

## Experiência

- Busca exata por @, com texto informando que enviar pedido revela nome e @ ao destinatário.
- Amigos, solicitações recebidas/enviadas e bloqueados separados. Aceitar, recusar, cancelar, remover, bloquear e desbloquear.
- Recebimento de solicitações começa desativado, inclusive para perfis existentes. Ativar exige confirmação e explica a descoberta do nome e @ mesmo com perfil privado. Desativar mantém convites existentes.
- Perfil oferece Somente eu, Somente amigos e Pessoas no Lume. As flags de foto/bio/frequências/treinos continuam opt-in. Private nunca é aberto pela amizade.
- Abrir o perfil consulta novamente a projeção do servidor. Um perfil já aberto é um snapshot: revogações futuras são verificadas ao reabrir. Não há notificações push ou atualização em tempo real nesta entrega; Atualizar consulta as listas.
- Modo local mostra uma explicação honesta: conexões exigem conta e nome de usuário confirmado. Nenhum grafo é exportado/importado ou persistido em localStorage.

## Banco e autorização

`supabase/migrations/20261030000800_friends_and_private_sharing.sql`, criado com Supabase CLI 2.122.0 e aplicado ao projeto sbaixfmxjoekcjfikiro pela integração. Versão remota: 20261030001241.

- Adição de allow_requests=false e audiência friends, preservando configurações anteriores.
- friendships (par canônico), blocks (direcional) e request_limits em lume_private. RLS ativa, nenhum grant de tabela a anon/authenticated e nenhum acesso direto; somente as funções autorizadas operam o grafo.
- O RPC público lume_friends é SECURITY INVOKER; o validador privilegiado fica no schema privado, search_path vazio e auth.uid() obrigatório. Não aceita user_id do cliente. Wrapper e helper negados a PUBLIC/anon.
- Transições de cada par são serializadas por advisory lock. Apenas destinatário aceita/recusa, apenas remetente cancela. Pedidos cruzados não aceitam amizade implicitamente. Desbloquear não restaura amizade.
- Bloqueio bilateral é verificado em busca, solicitações, lista e projeção, inclusive para audiência members. Autor do bloqueio vê apenas sua própria lista.
- Limite de 20 pedidos/hora por remetente, 24 horas de espera após encerrar a conexão e limite defensivo de 200 conexões ativas por pessoa. O limite de 200 é uma barreira defensiva, não uma quota estrita sob múltiplos pares concorrentes; contadores por remetente são atômicos.
- user_data permanece privado. Não há novos grants de histórico, medidas ou cargas. Username pode mudar, mas relações são ligadas ao UUID interno.
- O wrapper de autenticação verifica escopo antes e depois de RPCs, impedindo chamadas por handles antigos após trocar conta.

## Validação

- node prepare-release.cjs, node checks.cjs, node profile-db-checks.cjs e node friends-db-checks.cjs aprovados.
- PostgreSQL local/PGlite: migração duas vezes; três perfis e uma quarta conta sem perfil; isolamento, consentimento, descoberta, transições e duplicatas, cancelamento/recusa/remoção, limites, bloqueio bilateral, revogação e ausência de dados brutos.
- JS: validação, consentimento cancelado, ações, escape/whitelist de perfil, respostas atrasadas e impedimento de RPC antes de transmitir após mudança de conta.
- Navegador: modo local real; cenário isolado com RPC de teste para conferir listas, aceite, cancelamento, perfil e confirmação de solicitações. Cenário temporário removido antes da publicação. Conferência responsiva em 390 e 1021 px.
- Remoto: migração aplicada; anon sem EXECUTE; authenticated autorizado ao wrapper; RLS em todas as tabelas privadas; mock auth.uid sem conta negado com PROFILE_REQUIRED e sem acesso a user_data. Documentos e perfis existentes preservados, grafo vazio. Nenhuma conta real ou relação de exemplo criada.
- Limitação: login e fluxo entre dois JWTs de contas reais não exercitados pelo agente. Não havia dois perfis reais disponíveis. A autorização foi exercitada com roles/claims no PostgreSQL local e negação remota.

## Advisors

Após a migração, advisor lista INFO de RLS sem políticas nas três tabelas lume_private: negação por padrão é intencional e reforçada por ausência de grants. Não adicionar políticas permissivas para apagar o aviso.

O aviso existente da tabela public.Tabela permanece: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Proteção contra senhas vazadas continua desativada, configuração anterior e independente desta entrega: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Configuração centralizada (Issue #44)

A preferência de receber solicitações passou ao editor de perfil e é salva atomicamente pelo RPC lume_save_profile_settings. Amigos mostra o estado e um atalho para o editor. Ver PROFILE-REQUESTS.md. As ações antigas requests_on/off continuam disponíveis para clientes anteriores, sem aparecer como controles duplicados na nova interface.
