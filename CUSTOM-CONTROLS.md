# Controles e atmosfera — issue #14

## Escopo
Menus de seleção próprios em todas as telas atuais: botão com chevron SVG, lista monocromática com opção escolhida, rolagem e busca em listas com oito ou mais opções. A busca aceita múltiplas palavras sem depender de acentos. Opções desativadas não são selecionáveis, grupos de opções são apresentados, opções ocultas não aparecem. As expansões de painéis mantêm a semântica de details/summary, mas usam a seta desenhada do aplicativo em vez do marcador visual do navegador.

Calendário: a coluna de detalhes passa para baixo entre 900 e 1199 px (inclui a largura de 1021 px da anotação), mantendo largura confortável e dias mais altos. A partir de 1200 px, o calendário reserva ao menos 410 px antes dos detalhes. Telas menores continuam empilhadas e têm espaçamento próprio.

O fundo é preto com iluminação em gradientes fixos, sem a repetição do fundo anterior. Duas camadas de aura branca sobem em ciclos longos, com intervalos invisíveis e baixa opacidade. Não capturam cliques e ficam fora da árvore acessível. Movimento reduzido desativa as camadas animadas. Não há imagem externa, canvas, rastreamento ou biblioteca adicional. O ícone de Ajustes é uma engrenagem simétrica SVG, alinhada ao centro.

## Componente e dados
`controls.js` melhora os selects simples existentes; o elemento original fica oculto como fonte do valor, mantendo IDs, nomes, FormData, validação e callbacks. Não é preciso reescrever os formulários. Menus são anexados junto ao controle e usam Popover quando disponível para evitar recorte em janelas/áreas com rolagem; há fallback com posicionamento fixo. Seletores intencionalmente ocultos e múltiplos não são convertidos.

Setas, Home/End, Enter, Escape, Tab e busca por texto são suportados. Listas longas recebem campo de busca. Rótulos, estado expandido/selecionado/desativado, opção ativa e contagem de resultados são expostos na árvore de acessibilidade. Clique fora fecha a lista. Escape é tratado antes do diálogo externo. Foco retorna ao controle correspondente mesmo quando a seleção reconstrói o formulário. Rascunhos e seleções continuam seguindo as regras já existentes; não há migração ou mudança de Supabase.

MutationObserver acompanha formulários reconstruídos, alterações de opções/desativação e remoção do controle, sem manter referências fortes a formulários antigos. Componentes não escrevem estado persistido por conta própria. Labels e opções são inseridos com textContent. PWA v17 inclui controls.js/css.

## Direção visual
Mantém tipografia e paleta existentes: preto #050505, superfície #141414/#171717, borda #505050/#626262, texto #EEEEEE e apoio #BBBBBB. A seleção escolhida recebe fundo claro; o item sob foco usa contorno. Texto longo pode quebrar na lista, enquanto o valor fechado usa elipse. O foco visual e os alvos de interação permanecem explícitos.

## Validação
`node checks.cjs` passou com todas as regressões anteriores e novos casos para busca sem acentos/múltiplas palavras, ausência de resultados, opções ocultas/desativadas e navegação circular por opções habilitadas, além de sintaxe e assets.

No navegador desktop: lista de exercícios com 13 opções; busca por “triceps” encontra “tríceps”; seta/Enter altera o exercício e mantém foco após reconstrução; End/Enter altera a métrica. Na janela de meta, escolher 3 dias atualiza o formulário sem abrir menu nativo; cancelar preserva a meta salva. No diálogo do gerador, a lista aparece acima do conteúdo, Escape fecha apenas o menu, seleção de objetivo é preservada ao mudar os dias. No editor de exercício, a rotina desativada continua desativada, busca de “biceps” altera o grupo e a desativação dos auxiliares; cancelar mantém o exercício salvo. Conferida presença da camada decorativa sem interceptar eventos e animação configurada.

Pendente: leitor de tela, aparelho móvel/toque, browser sem Popover e medição física no viewport exato de 1021 px (correção aplicada por breakpoint correspondente). A prévia continua em modo demonstração; main, banco e site principal permanecem inalterados.
