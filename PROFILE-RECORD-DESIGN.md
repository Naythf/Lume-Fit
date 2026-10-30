# Perfil e registros privados

Issue #48. Mantém a paleta existente (#000, #101010, #171717, #383838, #bdbdbd, #eee), tipografia do aplicativo e superfície contínua. Dados físicos usam uma lista de definições com unidades, sem diagnóstico ou indicador de saúde. Altura usa o parser existente para exibir cm; campos vazios continuam opcionais. Contadores são centralizados em duas colunas com acesso à frequência abaixo.

Cada registro aberto, no calendário ou histórico, oferece Simples/Detalhado. Detalhado é o padrão por sessão do aplicativo: tabela semântica com série, carga, repetições e totais, além do volume. Simples mantém a linha original. A troca sincroniza os registros visíveis sem reconstruir a seção, alterar foco ou fechar registros. Não escreve no banco, backup ou histórico; reinicia ao trocar de conta. Séries incompletas e valores inválidos não entram nos novos totais. Zero kg é descrito como sem carga adicional, sem estimar peso corporal.

Validação: checks.cjs, verificações de totais/inválidos, apresentação no navegador em desktop e iframe de 390px. Dados fictícios de QA permanecem apenas na memória da página local e os arquivos de QA são removidos antes de empacotar. Sem migração Supabase.

O modo detalhado conecta cada exercício diretamente à evolução correspondente, usando a mesma chave de identidade/legado e sem unir movimentos distintos.
