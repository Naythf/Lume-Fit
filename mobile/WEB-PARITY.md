# Interface compartilhada com a web

A prioridade confirmada pelo usuário é reproduzir a versão web, incluindo animações e recursos, sem Figma nem gastos. A tela inicial agora hospeda a própria página https://naythf.github.io/Lume-Fit/ em WebView, sem barras/abas nativas adicionais, sem reimplementar CSS e sem desativar as animações da página. Na prévia web, um iframe mostra a mesma página.

Isso disponibiliza a interface existente de treinos, histórico, frequência, alimentação/foto, perfil, amigos, preferências e conta. Não significa que todos os fluxos foram validados em WebView. Não declarar “100% igual e testado” antes da comparação em aparelho real.

A primeira abertura depende da internet. Não há pacote offline completo embutido. O armazenamento do site dentro da WebView é separado do Chrome e do protótipo nativo anterior; não há migração ou login automático. Os dados AsyncStorage do protótipo foram preservados. O comportamento de contas e sincronização continua sendo o código publicado, sem mudar Supabase, políticas ou dados remotos.

Backup: a ação original de exportar é adaptada para a folha de compartilhamento nativa via arquivo temporário, sem enviar dados a servidor adicional. Apenas a página Lume pode emitir essa mensagem. Seleção de fotos/importação usa os controles de arquivo da WebView. Ainda validar permissões, cancelamento, arquivos grandes, compartilhamento/restauração, sessão/reabertura, recuperação por e-mail, teclado, animações/redução e retorno do Android em aparelho real. Cache de WebView não é garantia de operação offline.

Navegação interna fica restrita ao HTTPS e caminho Lume-Fit. Links externos HTTPS/e-mail abrem fora do contêiner; não se permite HTTP ou acesso arbitrário a arquivos locais. Nenhuma senha ou token é copiado para a camada nativa. O app continua apto a ser empacotado futuramente como APK; não foi gerado APK nesta correção.

O README anterior descreve a experiência parcial de referência; este documento prevalece quanto à interface ativa. Regras puras e código do protótipo foram mantidos fora das rotas, para preservar recuperação futura dos dados anteriores.
