# Salvamento do perfil — Issue #42

Causa reproduzida: editor #sheet e #dialogOverlay tinham z-index 20; o editor vinha depois no DOM e cobria a confirmação de compartilhamento. A Promise aguardava consentimento e nenhum RPC havia sido enviado, mas o botão dizia Salvando.

Correção: confirmação em z-index 60, camada inferior inerte, foco/Tab limitados à camada superior e restauração ao cancelar. Antes do consentimento o botão diz Aguardando confirmação; Salvando é reservado à operação real. O formulário permanece intacto ao cancelar.

O RPC de perfil agora tem prazo de 15 segundos com AbortSignal encaminhado pelo wrapper da sessão. Timeout libera o botão e preserva os campos; o texto reconhece resultado remoto incerto e pede verificar a configuração antes de nova tentativa. Não há repetição automática nem falso sucesso. Um cancelamento de transporte não garante rollback no servidor. Nenhuma migração, chave ou dado real foi alterado.

Validação: node prepare-release.cjs e node checks.cjs; testes de consentimento pendente/cancelado, timeout com AbortController, campos/estado preservados e AbortSignal encaminhado, além dos casos existentes de conflito e troca de conta. Navegador: antes, duas camadas ativas, editor por cima e zero chamadas; depois, confirmação por cima, editor inerte, foco no diálogo, cancelamento com zero chamadas e sucesso com exatamente uma chamada no cenário isolado. Viewport 700×572 conferido. Nenhum perfil real publicado pelo agente; login real continua com o usuário.
