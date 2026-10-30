# Revisão da rotina automática

Issue #50. Continuidade do compositor existente, preservando paleta monocromática (#090909, #111, #1c1c1c, #333, #bbb, #eee), fonte e mapa muscular. A revisão mostra lógica do gerador, semana navegável, inventário de séries por grupo principal e avisos atualizados. No celular, a semana se reorganiza em duas colunas sem exigir rolagem horizontal.

Mudança de dia conserva nome, séries, repetições e movimentos. Um destino ocupado troca os dias das duas sessões. O plano não é regenerado nem reordenado automaticamente; avisos de dias consecutivos continuam disponíveis. Retornar às preferências conserva o rascunho em memória; retomar restaura as preferências originais. Gerar outro plano pede confirmação dentro do compositor. Fechar ou trocar de conta descarta somente esse rascunho.

Inventário é descritivo: conta cada série no músculo principal uma única vez; auxiliares não são somados outra vez. Não estima ativação, recuperação nem uma dose ideal. Séries inválidas são sinalizadas, e o salvamento mantém validação integral. Alterações não sobrescrevem rotinas existentes nem modificam preferências do perfil. Nenhuma mudança no banco ou telemetria.

Validação: checks.cjs mantém os 180 cenários do gerador; automatic-review-checks.cjs cobre inventário, valores inválidos, troca de dias sem mutação de origem, preservação das edições, retorno ao rascunho, confirmação de regeneração e escrita somente ao salvar. QA visual com dados temporários locais, sem publicar na conta.
