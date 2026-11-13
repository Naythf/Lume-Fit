# Lume Fit 0.4.0 — alterações e validação

Issue: https://github.com/Naythf/Lume-Fit/issues/76. Branch `feature/app-anatomy-panels`, baseada em `feature/app-header-refinements`. Alterações exclusivas do app offline. Sem serviço pago, conta nova, publicação em loja ou mudança no site.

## Resultado

- Mapa anatômico 2D frontal/posterior com principal em vermelho e auxiliares hachurados; atualização ao selecionar grupos no compositor e no editor. Veja ANATOMY-REVIEW.md para fontes e limites.
- Seletores do app abrem fora do grid, dentro da camada modal correta, inclusive sem Popover API. Valor nativo, callbacks, teclado e foco preservados. Colunas com largura mínima zero, mesma altura e alinhamento inferior.
- Entrada de rotina automática centralizada, texto curto e rótulo destacado. Halter dentro do próprio quadro, com 28 px antes do título.
- Cinco páginas no destaque: treino, alimentação, histórico, Guias e Amigos; cada uma com imagem, texto e destino próprios. Texto surge com movimento; sem setas ou pausa. Bolinhas, foco e toque param a troca automática; oito segundos de leitura por página. Movimento reduzido desativa rotação e transições.
- Diário alimentar com foto, espaçamento e botão visível. Histórico com botão contornado.
- Hub neutro preto/cinza, blur preservado, quatro destinos e cantos arredondados. “Saber” passa a “Guias e ferramentas”.
- Barras superiores dos sheets/confirmadores são botões acessíveis: toque/Enter fecha, arraste acompanha o dedo e fecha após o limiar, arraste curto retorna. Confirmação fechada pela barra resolve somente como cancelamento. Saídas interrompidas não fecham o próximo editor ou resolvem o próximo diálogo. Veto durante exclusão de conta preservado.

## Validação antes do APK

- `npm test`: 25 testes aprovados. `npm run typecheck` e `npm run lint`: aprovados. `node checks.cjs`: aprovado, incluindo regressões de rotina, sessões, alimentação, sincronização, privacidade e controles.
- Prévia local com CSP bloqueando conexões, recursos incorporados: mapa/compositor em 374 e 558 px; fallback de seletores sem Popover em 358 px. Após escolher “Já treino regularmente” e “45 minutos”, ambos os botões mantiveram o mesmo topo e altura de 56 px. Nenhuma rolagem horizontal observada nesses fluxos.
- Navegação real pelas cinco páginas; diário e histórico corretos; Guias e Amigos acessíveis sem ativar compartilhamento. Sem inclusão de dados de teste na prévia entregue (8086).
- Editor conferido em documento de QA preexistente no host isolado 8084; mudança de principal/auxiliares atualizou o mapa e foi cancelada sem salvar. Não foram removidos registros existentes.
- Hub: toque e arraste fecham, foco retorna à origem. Enter funciona em movimento reduzido. Confirmação de exclusão foi cancelada pela barra; rotina permaneceu. Corridas de substituição de editor/confirmação cobertas por teste automatizado.
- Fotos Pexels e vetores MIT locais, créditos acessíveis em Ajustes. Nenhum erro de console nos fluxos conferidos. Interface empacotada de aproximadamente 4,3 MB; origem HTTPS e armazenamento nativo preservados.

## Limites

Revisão de navegador não equivale a teste físico Android/iOS. Gestos, teclado virtual, reinstalação com retenção de dados e modo avião no aparelho precisam de teste no dispositivo. Nenhuma mudança de API nativa, schema ou autenticação foi necessária. Assinatura e versão do APK serão conferidas após a compilação.
