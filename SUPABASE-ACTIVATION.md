# Ativação e correções — Issue #34

Projeto verificado via conector e config: sbaixfmxjoekcjfikiro, Lumi Fit. Migração profile_privacy_foundation aplicada via apply_migration. RLS original de user_data preservada. Teste remoto transacional com UUID sem registros: leitura alheia bloqueada, perfil próprio/projeção inexistente nulos. Após migração: um documento privado preservado, zero perfis criados, RPC negada a anon e permitida a authenticated. Nenhum dado pessoal alterado.

Prévia agora usa URL e chave publishable do conector, sem service_role. Config original preservado. Demo continua local; rascunhos não são publicados automaticamente. Login com senha/JWT real não executado pelo agente; proprietário pode entrar para validar.

Advisors: sem novos avisos da migração. Avisos anteriores: Tabela com RLS sem política e proteção de senhas vazadas desativada. [RLS sem política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) e [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Não abrir permissões de Tabela só para remover aviso.

Retomada ocupa a largura inteira da grade desktop, com hero/estatísticas abaixo. Últimos treinos usam imagem/ícone da rotina; fallback pelo nome se não existir. Corrigido exercício no singular.

Revisão visual em iframe de 1021×572: card de retomada e conteúdo tinham 658 px, grid-column 1/-1 e botão contido. Clique Retomar validado. Registro demo gerado pela UI mostrou novo SVG 160×90 em bloco 48 px e texto 1 exercício. Corrigido bloqueio de cliques após fechar a rotina automática: o navegador gerencia a inércia do diálogo nativo; somente a personalização mantém bloqueio manual. Nenhum dado fictício foi enviado a conta real.
