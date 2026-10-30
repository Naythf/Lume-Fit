# Lume Fit: padrão de trabalho

- Para cada correção, melhoria ou função, criar uma issue no GitHub antes de editar e usar uma branch dedicada. Abrir PR e mencionar `Closes #N` na descrição. Descrever validação e limitações antes de integrar à main e publicar.
- Preservar logo, preto e branco, dados reais e configuração Supabase. Não inserir exemplos nas contas nem alterar o schema sem necessidade. Não publicar segredos.
- Ler o código atual antes de editar. Priorizar celular e computador, hierarquia e feedback de interação.
- Movimento: entradas/saídas discretas, feedback de carregamento e progresso reais; skeleton somente para conteúdo realmente assíncrono; lazy loading onde útil. Manter a opção de seguir prefers-reduced-motion, teclado e foco de modais. Não animar tudo indiscriminadamente.
- A referência solicitada https://github.com/kylezantos/design-principles retornou 404 em 27/10/2026. Não afirmar que essa skill foi instalada ou executada sem acesso confirmado.
- Cada mudança deve considerar observabilidade sem dados pessoais, qualidade/lint e testes unitários, de integração e de interface proporcionais ao risco. Não instalar todos os serviços citados como exemplos (Sentry, Datadog, New Relic, OpenTelemetry, Biome, Knip, Stryker, Codecov etc.) sem avaliar utilidade, custo e privacidade.
- Não adicionar rastreadores sem informar finalidade e implementar o controle necessário antes do carregamento. Não afirmar conformidade LGPD, inventar dados do responsável ou licenças de assets.
- Rodar `node checks.cjs`. Validar fluxos no navegador quando disponível; registrar claramente o que não foi testado. Atualizar o cache do PWA quando alterar assets.

- Seletores simples usam controls.js/css (LumeControls), preservando o select como fonte do formulário. Novos selects são melhorados automaticamente; manter rótulos, callbacks, navegação por teclado e compatibilidade de modais. Não substituir novamente pelos menus visuais nativos sem solicitação.

- motion.js/css melhora details/summary dinamicamente: o conteúdo fica em .lume-disclosure-body; preservar rótulos, validação e movimento reduzido ao alterar expansões. Não depender de conteúdo como filho direto de details, exceto summary.

- Usar LumeMotionPreference como fonte única de movimento em JS e html[data-motion] em CSS. Conforme solicitação do usuário na Issue #22, Ativadas é o padrão quando não há escolha válida salva; preservar escolhas explícitas Seguir o sistema e Reduzidas. Não reintroduzir regras de prefers-reduced-motion que ignorem a escolha. Assets do service worker usam lista permitida, validação de tipo e rede primeiro, sem cachear APIs ou páginas de autenticação.

- Antes de testar/publicar alterações nos assets, rodar `node prepare-release.cjs`, depois `node checks.cjs`. Isso gera app-version.json e URLs versionadas no index. Copiar ambos e todos os assets alterados juntos para a prévia. Nunca gerar um hash com config.js. A prévia chatgpt.site não usa cache offline; o PWA fora dela continua disponível. updates.js verifica novas publicações e não recarrega automaticamente com treino, modal ou edição pendente.

- Sessões guiadas ficam em guided-workout.js/css. Rascunhos locais devem usar o escopo fornecido pela autenticação, nunca uma chave compartilhada entre contas. Preservar o snapshot do exercício, persistir a cada edição, usar prazos absolutos no descanso e derivar o histórico das séries atualmente concluídas. Não reutilizar cleanedSets antigo nem duplicar o id da sessão na conclusão.

- Perfil social: profile.social é rascunho; a autoridade de visibilidade e reserva de username é o servidor. Nunca publicar rascunhos automaticamente nem abrir user_data. Projeções compartilhadas usam whitelist, opt-in e funções/políticas testadas com duas contas; manter dados físicos e séries/cargas fora da projeção. Rodar npm ci --ignore-scripts e node profile-db-checks.cjs após alterar a migração. Migração remota aplicada na Issue #34 ao projeto sbaixfmxjoekcjfikiro; consultar PROFILE-PRIVACY.md.

- Amigos: friends.js/css usa somente RPC lume_friends e lume_get_profile, com estado em memória por sessão. Não cachear grafo em backups ou publicar dados de exemplo. RLS das tabelas privadas nega acesso direto; transições por par são serializadas no servidor. Bloqueio vale para busca, solicitações e projeção. Visibilidade friends exige amizade aceita, private continua privado. Novas regras exigem node friends-db-checks.cjs e node friends-checks.cjs.

- Confirmações podem abrir sobre editores: dialogOverlay deve ficar acima do sheet; somente a camada superior aceita foco/interação. Não apresentar confirmação pendente como salvamento de rede. RPCs do perfil têm prazo e AbortSignal; falhas de transporte não permitem afirmar que o servidor não gravou. Preservar campos e exigir verificação em caso de timeout.
