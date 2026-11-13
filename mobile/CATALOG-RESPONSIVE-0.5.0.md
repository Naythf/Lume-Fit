# App 0.5.0 — catálogo, movimento e adaptação de layout

Issue #78. Alterações somente no pacote offline; site publicado e banco permanecem inalterados.

## Seleção de exercícios

O catálogo anterior tinha 38 movimentos. A escolha já era independente dos ícones, mas a oferta pequena e a ordenação por quantidade de equipamento limitavam o resultado. O app passa a ter 85 movimentos explícitos. As ilustrações são uma camada de apresentação: quando não há uma imagem correspondente, aparece equipamento neutro, sem excluir o exercício nem ilustrar outra variação como se fosse a mesma.

- Novos movimentos com peso corporal, elásticos, halteres, barra, máquinas e kettlebells; banco e suporte de segurança são requisitos explícitos quando necessários. Supino com barra exige barra + banco + suporte. Não inferir esses apoios apenas por marcar Academia.
- Elegibilidade conserva modalidade, equipamentos e experiência. Metadados incluem grupo principal, auxiliares, padrão, família, descrição própria e registro por repetições. Exercícios cronometrados/ballísticos não foram encaixados artificialmente no formato de repetições.
- Seleção determinística considera foco, cobertura semanal de grupos/padrões e movimentos básicos compatíveis com experiência. Evita famílias repetidas no mesmo dia, limita repetição do mesmo principal na sessão e mantém compostos antes dos acessórios.
- A elevação em W não completa automaticamente uma sessão quando há puxadas/remadas com resistência disponíveis. Continua no catálogo como alternativa de controle, com sua diferença descrita.
- O tempo disponível é um teto, não uma obrigação de preencher cada minuto. Estimativas e quantidade de movimentos usam os mesmos intervalos: 120 s para força, 90 s para músculos e 60 s nos demais objetivos suportados, além da preparação, duração das séries e transições. Séries/repetições continuam rascunhos editáveis, sem sugerir cargas máximas ou progressões automáticas.
- Mobilidade continua exigindo formato próprio e condicionamento é identificado como componente de fortalecimento. A ausência de um foco compatível e os limites de cobertura/recuperação continuam visíveis.

Fontes consultadas em 13/11/2026:

- [ACSM, resumo oficial das diretrizes 2026](https://acsm.org/resistance-training-guidelines-update-2026/?nocache=1775184380): individualizar por objetivos/capacidade e considerar diferentes modalidades de resistência; não há um tipo de equipamento universalmente superior para todos. O artigo integral não ficou acessível pelos endpoints consultados; não se afirma revisão integral.
- [NASM Exercise Library](https://www.nasm.org/resource-center/exercise-library): conferência de movimentos, grupos, equipamento e complexidade. Descrições em português foram escritas para o app; não foram copiadas imagens ou instruções da biblioteca.
- [NSCA, tipos de equipamento](https://www.nsca.com/certification/nsca-cpt/essentials-of-personal-training--3rd-edition/excerpts/types-of-resistance-training-equipment/): adequação de equipamentos ao contexto de treinamento.
- Skills locais `fitness` e `gym` utilizadas como apoio de estrutura/revisão, não como validação clínica das regras. As heurísticas de ordenação do Lume não são um ranking científico individual de eficácia.

Não se conhece execução, tolerância, lesões ou capacidade individual apenas pelas preferências preenchidas. O gerador permanece uma sugestão geral editável para adultos; não houve certificação clínica ou teste de resultado físico. Os novos IDs/equipamentos pertencem a esta versão do app; clientes antigos podem não reconhecer esses metadados, embora nome, séries e grupos manuais continuem no documento.

## Interface

- A rotação do destaque retoma após toque, seleção ou gesto. Hover e foco por toque não interrompem permanentemente o timer. Foco de teclado, gesto pressionado, janela aberta, tela fora de vista e movimento reduzido pausam temporariamente. Fotos, palavras e destino mudam juntos, com surgimento por opacity/transform.
- Ícone Automático passa a usar desenho SVG e rótulo “Pelo nome”. Nova rotina recebe ícone desenhado, tamanho legível e posição própria em telefones estreitos.
- Rótulos longos e valores dos seletores podem refluír; Idade e Equação metabólica ficam em linhas próprias quando necessário. Formulários alimentares e campos numéricos alinham pela base.
- Cartões de revisão separam imagem/título, grupos, equipamento, motivo, detalhes e ações. O mapa expandido ocupa a largura disponível. Rodapé e ações têm tamanhos mínimos consistentes, sem empurrar conteúdo para fora da caixa.
- Divisórias verticais do resumo removidas. Aura com opacidade 0,2 e fundo neutro suavizado; blur das superfícies preservado.

## Evidência

- 31 testes aprovados, incluindo 1.600 combinações do novo gerador: tempo, equipamento, experiência, grupos, famílias sem duplicação, independência de ilustrações e elegibilidade dos apoios. Casos de carrossel cobrem rotação após toque, texto/foto/ação sincronizados, retomada após pausas temporárias e gesto solto fora do cartão.
- `npm run typecheck`, `npm run lint` e `node checks.cjs` aprovados. Sem dependência nova ou mudança de API nativa.
- Navegador Chromium/IAB, larguras reais de 320, 337, 375, 390, 558, 768 e 1280 px; retrato de 571/700/852 px. Guias, formulário alimentar, perfil, seletor de ícone, editor de exercício e cartões do compositor conferidos por renderização e dimensões DOM. Foi corrigido um caso adicional de overflow de “Desenvolvimento” na grade de ícones em 558/768 px.
- Depois de um toque no destaque Alimentação (índice 1), em 25,7 s o navegador mostrou Amigos (índice 4), com imagem 4 e destino friends, sem outro clique. As capturas estáticas mostram estados, não comprovam taxa de quadros; não foi medido desempenho de compositor/60 fps.
- Rascunho de 3 dias/força/60 min com halteres+banco resultou em seis movimentos e estimativa de 58 min por sessão. A nota exibida usou os mesmos 120 s do cálculo. Nenhuma rotina foi salva durante essa revisão.
- Dados de exercício preexistentes foram apenas abertos em um host de QA isolado e a edição foi cancelada. Nenhuma conta real, sessão concluída, medida corporal ou publicação social foi criada.

Prévia/viewport de navegador não equivalem a teste físico Android/iOS, teclado virtual, ajuste de fonte do sistema ou todas as resoluções possíveis. Essas verificações permanecem para o aparelho. A assinatura, versão, pacote e recursos do APK devem ser conferidos após a compilação.
