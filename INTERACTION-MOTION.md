# Acabamento e movimento — issue #18

## Entrega
Botões primários claros recebem acabamento perolado com gradiente, borda refletiva, linha interna e sombra de profundidade. Hover eleva e passa um reflexo uma vez; pressionar comprime levemente. Montar minha rotina ganha formato compacto e ícone de foco, sem alterar sua ação. A navegação mantém o vidro e responde com iluminação, movimento do ícone no hover e um pulso curto no clique/ativação por teclado.

Todas as expansões details são melhoradas por motion.js: conteúdo abre em 320 ms e fecha em 240 ms com altura medida, seta sincronizada e suporte à inversão rápida. Ao terminar, a altura natural é restaurada. Sem animação de altura máxima arbitrária que deixaria pausas ou cortaria conteúdos maiores. O conteúdo fica inert durante o fechamento/recolhimento, sem prender o foco; erro de formulário reabre os painéis ancestrais imediatamente antes de apontar o campo. Sem persistência adicional.

O componente envolve o conteúdo depois do summary em .lume-disclosure-body, mantendo detalhes, resumo e controles originais. Um MutationObserver melhora as telas reconstruídas. Novos CSS devem preferir seletores de descendentes para o conteúdo; o summary continua filho direto do details. Animações de elementos removidos são canceladas.

Menus próprios passam a ter entrada mais suave e saída de 140 ms, removendo a interação e a exposição acessível enquanto fecham. Reabrir durante a saída cancela a animação anterior. Valores, callbacks e foco continuam funcionando. Movimento reduzido usa alternância imediata, sem pulso/reflexo/deslocamento; a semântica e a orientação estática das setas são preservadas. Sem dependências, rastreamento ou falsas esperas. PWA v19 inclui motion.js/css.

## Validação
node checks.cjs passou com sintaxe do novo script e todas as regressões anteriores. Navegador desktop: hidratação abre (147,6 px), recolhe (82 px), reverte rapidamente por Space e termina sem estado/altura presos; conteúdo recolhido fica inert. Menu metabólico fecha por Escape, reabre durante a saída e aceita End/Enter. O novo botão abre o gerador; detalhes dos exercícios revelam séries e repetições. Definir séries=0, recolher e tentar salvar reabre o painel e foca o campo inválido com validação nativa. Rascunho descartado; nenhum treino/rotina de teste foi salvo. Novo acabamento e navegação conferidos visualmente.

Pendente: aparelho móvel, leitor de tela, preferência de movimento reduzido em dispositivo real e navegadores sem Web Animations. Estes usam alternância imediata para details; versões sem suporte a inset/blur mantêm os fallbacks anteriores. Nenhuma alteração de Supabase ou revalidação de sincronização nesta mudança visual. PR empilhado sobre #17, main/site principal inalterados.
