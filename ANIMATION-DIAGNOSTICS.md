# Animações e atualização da interface

Issue #20. A preferência real do dispositivo do usuário ainda não foi observada. Duas condições no código explicavam possíveis diferenças: movimento reduzido do sistema desativava silenciosamente os efeitos e o service worker anterior priorizava assets antigos.

Ajustes → Animações mostra a preferência efetiva. Seguir o sistema continua sendo o padrão; Ativadas e Reduzidas são escolhas locais por navegador. O teste visual informa início e conclusão, indisponibilidade de Web Animations ou modo reduzido. A aura, seletores, expansões e rolagem usam a mesma política. Mudanças do sistema e de outras abas são acompanhadas.

Cache v20 usa rede primeiro para assets conhecidos, com fallback offline do mesmo arquivo. Valida MIME e o marcador do HTML do aplicativo; nunca devolve index.html como JavaScript ou CSS. APIs, autenticação e respostas 401/403 não recebem fallback. Uma recarga pode ser necessária para substituir o worker anterior. Não apagar os dados do site.

Validação: node checks.cjs passou, incluindo política de movimento, storage bloqueado, listener legado, sincronização entre abas, atualização e fallback do cache e proteção contra HTML de autenticação. No navegador de teste: Reduzidas resulta em aura sem animação; Ativadas resulta em lume-aura-rise e o teste visual conclui. Preferência persiste após recarga. Não validado no dispositivo do usuário ou em sessão Supabase real; prévia usa modo local.
