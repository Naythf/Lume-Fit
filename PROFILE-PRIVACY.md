# Perfil e privacidade — Issue #32

Primeira etapa da base social; não inclui lista de amigos, solicitações, busca ou rota pública de perfis. O editor permite nome, apresentação, username e escolhas individuais para foto, bio, frequência semanal/mensal e nomes/datas dos últimos dez treinos. Padrão: somente eu e todos os campos opcionais desligados. A prévia usa uma projeção explícita; nunca inclui peso, altura, sexo, cargas, exercícios, séries ou repetições.

## Ativação no Supabase

Atualização da Issue #34: migração aplicada ao projeto sbaixfmxjoekcjfikiro pela integração Supabase, com verificação de RLS, privilégios e RPC sem modificar documentos pessoais. As instruções abaixo ficam para instalação em outro ambiente.

1. No Supabase do Lume Fit, abrir SQL Editor → New query.
2. Copiar todo o conteúdo de `migrations/20261029-profile-privacy.sql` e executar. Pressupõe a estrutura user_data já existente; não é necessário executar novamente supabase-schema.sql se ela já está instalada. A migração é transacional e pode ser reaplicada, sem alterar os registros de user_data.
3. Na versão desta branch conectada ao Supabase, entrar na conta e abrir Meu perfil → Editar perfil e privacidade. O aplicativo consulta a configuração do servidor. Só depois dessa confirmação o botão passa de Salvar rascunho para Salvar perfil e privacidade.
4. Salvar o username para reservá-lo. A restrição UNIQUE resolve concorrência e retorna nome em uso. Compartilhar com Pessoas no Lume pede confirmação; voltar a Somente eu revoga a projeção na próxima leitura.

A prévia está conectada ao mesmo projeto com chave publishable pública. Entrar na conta habilita o fluxo real; Testar sem conta continua local. Config original e main preservados; nenhum perfil foi publicado automaticamente.

## Dados e acesso

- public.lume_profiles contém identidade e controles, com SELECT/INSERT/UPDATE somente para o proprietário via RLS. Acesso direto a linhas alheias e a user_data permanece bloqueado. Não há grant para anon.
- lume_save_profile é invoker, usa auth.uid() e não recebe user_id. Nome único em minúsculas (3–24 letras ASCII, números e underscore); nome 1–60, bio até 160, foto apenas data:image JPEG/PNG/WebP até 250 KB. Não há imagem remota, tracker ou bucket público.
- lume_my_profile retorna a linha do próprio usuário. A projeção compartilhada é calculada pela função privilegiada em lume_private, com search_path vazio e autenticação/visibilidade verificadas antes de ler o JSON privado. O RPC público lume_get_profile é invoker. Só authenticated pode executar a projeção; anon e PUBLIC não podem. O helper de datas não pode ser chamado pelo cliente.
- A projeção sempre inclui nome e username quando audience=members. Os demais campos exigem flags verdadeiras. A contagem usa dias distintos em America/Sao_Paulo; datas inválidas/futuras são ignoradas. O detalhe recente contém apenas nome e data, no máximo dez itens. Perfil private retorna null, inclusive para o dono nessa projeção; leitura própria usa lume_my_profile.
- profile.social no JSON existente é rascunho/preferência, não autoridade de publicação. A visibilidade confirmada vem da tabela no servidor. Sem conexão/migração não há reserva ou publicação. Modo local não simula sucesso remoto. Respostas atrasadas são descartadas após troca de conta; falhas preservam a configuração anterior.
- Nome/foto/bio alterados em outras áreas não são republicados automaticamente: o usuário precisa salvar o editor social de novo. Uma vez vista ou copiada por outra pessoa, uma informação compartilhada não pode ser recolhida de cópias externas.

## Validação

`npm ci --ignore-scripts`, `node prepare-release.cjs --check`, `node checks.cjs`, `node profile-db-checks.cjs`.

PGlite executa PostgreSQL real em WASM com auth.uid() e roles simulados: migração duas vezes, duas contas, nome duplicado, RLS, negação de anon, tentativa de escrever no perfil alheio, isolamento de user_data, ocultação de foto/bio mesmo armazenadas, whitelist, datas inválidas/futuras e revogação de visibilidade. Não substitui validação integrada com o Supabase remoto/JWT/PostgREST.

Testes JS: defaults privados, flags estritas, username, projeção por whitelist e dias em Brasília, rascunho sem reserva, conflito de nome, cancelamento, resposta atrasada após troca de conta e falha de persistência. Navegador local: editor, prévia seletiva, bio/frequências opt-in, rascunho salvo e reaberto com escolhas preservadas, sem publicação.

Referências de segurança usadas: https://supabase.com/docs/guides/database/functions e https://supabase.com/docs/guides/database/postgres/row-level-security.
