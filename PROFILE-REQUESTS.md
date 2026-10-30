# Solicitações configuradas com o perfil — Issue #44

Receber solicitações de amizade agora é uma escolha explícita no editor Meu perfil → Editar perfil e privacidade, logo antes da visibilidade. Permitir convites revela nome/@ para busca exata, sem tornar o perfil privado visível. O texto explica essa diferença e que cada convite pode ser aceito ou recusado.

A confirmação de salvamento descreve a descoberta do nome/@ e a audiência das informações marcadas. Perfil privado com convites ativos também exige confirmação. Cancelar não envia alterações. Escolhas existentes do servidor têm prioridade sobre rascunhos; ninguém é ativado automaticamente.

Amigos mostra o recebimento atual logo acima da busca, com Configurar no perfil. O controle duplicado escondido no acordeão foi retirado da interface. Resultado vazio orienta conferir o @ e a opção no perfil, sem revelar se a outra pessoa existe ou bloqueou a busca.

A migração supabase/migrations/20261030011358_profile_request_preferences.sql acrescenta o RPC public.lume_save_profile_settings, invoker com search_path vazio, sem execução de anon/PUBLIC. Ele salva identidade/visibilidade e allow_requests na mesma transação, sob as políticas de propriedade existentes. O RPC antigo é preservado para versões anteriores e não muda a preferência de solicitações. Nenhuma tabela, política ou perfil existente é alterado pela migração.

Validação: node checks.cjs; testes PGlite de migração duas vezes, salvamento de solicitações independente de audiência, compatibilidade legada, conflitos sem alteração parcial, preferência nula rejeitada, anon negado e isolamento herdado. Testes JS de consentimento com perfil privado, flags estritas e atalho sem controle duplicado. Navegador em 700×572: escolher, confirmar, salvar e reabrir mantendo perfil privado. Cenário isolado, sem gravação em contas reais. Migração remota aplicada; permissões verificadas e escolhas existentes preservadas.

A revisão inicial encontrou ambas as migrações anteriores e os objetos esperados; não foi necessário reabrir RLS ou ampliar leitura de dados. Os avisos de advisors previamente documentados em FRIENDS.md permanecem independentes desta mudança.
