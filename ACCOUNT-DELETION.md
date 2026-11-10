# Exclusão da própria conta — issue #54

Ajustes oferece backup e exclusão da conta. O usuário informa a senha atual, digita EXCLUIR e confirma a ação. Uma instância isolada do SDK autentica novamente sem persistir credenciais ou substituir a sessão aberta. Só então chama `lume_delete_own_account` com seu token recente. O RPC não recebe UUID de destino.

A função privada privilegiada valida o proprietário, uma sessão de autenticação pertencente a ele criada nos últimos cinco minutos e um método password recente no JWT. Uma conta com fator MFA verificado exige aal2; a interface atual não implementa um desafio MFA e apresenta a necessidade de verificação adicional. O código não usa user_metadata como autoridade. Nenhuma chave privilegiada chega ao navegador.

A remoção de sessões e da identidade é transacional; as referências existentes com ON DELETE CASCADE removem documento privado (incluindo refeições), perfil, amizades, bloqueios e limites por proprietário. O mesmo bloqueio de sincronização serializa gravações e exclusão. Se uma dependência impedir a exclusão, a transação inteira é revertida. O projeto atual não usa uploads em Storage: fotos são dados embutidos no documento; novos armazenamentos exigirão revisão deste fluxo.

O cache e os rascunhos da conta no dispositivo atual são removidos após confirmação do servidor. A notificação de exclusão encerra outras abas da mesma origem. Modo local e dados de outras contas são preservados. Backups exportados, caches em outros dispositivos e retenção de backups da infraestrutura não são apagados remotamente pelo navegador. O aviso de privacidade não promete remoção desses arquivos.

Falhas de transporte são resultados incertos. A interface não afirma sucesso nem limpa os registros locais sem `{deleted:true}`. O usuário deve verificar a conta antes de repetir. Ainda é necessário definir responsável, atendimento e retenção no aviso de privacidade.

Testes: `node account-deletion-checks.cjs` e `node account-deletion-db-checks.cjs`. Cobrem cancelamento, senha fora do armazenamento, limpeza por proprietário, confirmação digitada, sessão alheia, autenticação vencida, recovery em vez de password, MFA, cascatas, dados de outro usuário, negação anônima e rollback. Banco local via PGlite; nenhuma conta real foi excluída. A migração remota e o fluxo de login real ainda não foram validados.

Referências: https://supabase.com/docs/guides/auth/jwt-fields e https://supabase.com/docs/guides/auth/managing-user-data.
