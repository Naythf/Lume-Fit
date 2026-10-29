# Lume Fit: padrão de trabalho

- Para cada correção, melhoria ou função, criar uma issue no GitHub antes de editar e usar uma branch dedicada. Abrir PR e mencionar `Closes #N` na descrição. Descrever validação e limitações antes de integrar à main e publicar.
- Preservar logo, preto e branco, dados reais e configuração Supabase. Não inserir exemplos nas contas nem alterar o schema sem necessidade. Não publicar segredos.
- Ler o código atual antes de editar. Priorizar celular e computador, hierarquia e feedback de interação.
- Movimento: entradas/saídas discretas, feedback de carregamento e progresso reais; skeleton somente para conteúdo realmente assíncrono; lazy loading onde útil. Respeitar prefers-reduced-motion, teclado e foco de modais. Não animar tudo indiscriminadamente.
- A referência solicitada https://github.com/kylezantos/design-principles retornou 404 em 27/10/2026. Não afirmar que essa skill foi instalada ou executada sem acesso confirmado.
- Cada mudança deve considerar observabilidade sem dados pessoais, qualidade/lint e testes unitários, de integração e de interface proporcionais ao risco. Não instalar todos os serviços citados como exemplos (Sentry, Datadog, New Relic, OpenTelemetry, Biome, Knip, Stryker, Codecov etc.) sem avaliar utilidade, custo e privacidade.
- Não adicionar rastreadores sem informar finalidade e implementar o controle necessário antes do carregamento. Não afirmar conformidade LGPD, inventar dados do responsável ou licenças de assets.
- Rodar `node checks.cjs`. Validar fluxos no navegador quando disponível; registrar claramente o que não foi testado. Atualizar o cache do PWA quando alterar assets.

- Seletores simples usam controls.js/css (LumeControls), preservando o select como fonte do formulário. Novos selects são melhorados automaticamente; manter rótulos, callbacks, navegação por teclado e compatibilidade de modais. Não substituir novamente pelos menus visuais nativos sem solicitação.
