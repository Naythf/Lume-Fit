# Sincronização protegida — issue #53

O RPC `lume_sync_document` compara atomicamente `updated_at`, serializa gravações por proprietário e usa um UUID por tentativa lógica. O carimbo vem do servidor. Repetir uma requisição cuja resposta se perdeu não duplica a gravação; reutilizar o UUID com outro conteúdo é rejeitado.

Cada aba guarda seu próprio documento pendente por conta no navegador. Recarregar retoma o rascunho dessa aba. Ajustes permite recuperar rascunhos de outras abas e exportar o documento. Em conflito, a gravação para; carregar a nuvem exige confirmação e mantém o rascunho anterior recuperável. Não há mesclagem automática ou substituição forçada.

A migração mantém documentos antigos graváveis por clientes antigos até o primeiro salvamento pelo RPC novo. Depois disso, RLS bloqueia update/delete diretos por clientes antigos para impedir sobrescritas sem comparação de versão. Essas abas precisam atualizar o aplicativo. Publicar o frontend e ativar a migração de forma coordenada; se o RPC não estiver disponível, as edições ficam locais com erro explícito. Não há fallback para upsert sem proteção.

Validado com `node document-sync-checks.cjs` e `node document-sync-db-checks.cjs`, incluindo duas abas com a mesma revisão, rascunhos por conta, repetição após perda da resposta, edição durante gravação, troca de conta e negação de clientes legados após proteção. Os testes de banco usam PGlite, não JWTs de contas remotas.

O servidor remoto retornou timeout durante a preparação. Migração remota, login real e múltiplos aparelhos ainda precisam ser validados. O cache local e rascunhos não substituem um backup exportado. Rascunhos antigos são mantidos até exclusão da conta neste dispositivo; podem conter dados privados.
