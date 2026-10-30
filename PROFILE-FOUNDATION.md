# Personalização — etapa 1 / issue #8

## Escopo entregue
- Questionário de cinco etapas depois do acesso confirmado pelo Supabase ou da entrada no modo local: apresentação, modalidades/objetivo, focos musculares, disponibilidade/equipamentos e revisão.
- Exibido uma vez por perfil novo ou existente ainda não personalizado. “Fazer isso depois” preserva os dados existentes e permite editar pelo perfil mais tarde. Nenhum peso, altura, idade ou foto obrigatório. Cancelar edição não salva o rascunho.
- Perfil pelo avatar no cabeçalho e por Ajustes, com nome, apresentação, modalidades combináveis, objetivo, foco, disponibilidade, equipamentos e atividade real. Privado, sem compartilhamento nem serviços sociais.
- Músculos principais e auxiliares no editor/lista/registro; mapa esquemático frente/costas, sugestão explicitamente identificada e substituição manual. O ícone não determina a classificação. Exercícios desconhecidos ficam a definir. Não há mensuração de ativação muscular ou crescimento.

## Dados e compatibilidade
`profile.trainingPreferences` tem version=1, modes, goal, focus, days, minutes e equipment. `profile.onboardingComplete` controla a primeira apresentação, `bio` é opcional e visibility é private. Tudo permanece no JSON já isolado por usuário em public.user_data e no cache correspondente. Não há alteração do schema ou política de acesso. O app não faz consulta de perfis alheios e não publica informações.

Exercícios podem ter muscleMode=auto/manual, primaryMuscle e secondaryMuscles. Campos opcionais preservados na normalização e no início de treino. A edição antiga de dados corporais agora mantém os demais campos do perfil; não substitui preferências por acidente. IDs, imagens próprias e histórico preservados. Rascunho do questionário é descartado ao sair da conta.

## Classificação muscular
As correspondências são referências educativas por nome/variação, não um catálogo validado para prescrever treinos. Há somente dez grupos amplos, sem percentuais de ativação. O mapa é esquemático. A seleção manual tem prioridade, inclusive “Não definido”.
Referências consultadas para exemplos de movimentos de empurrar e tríceps:
- NASM, Barbell Bench Press: https://www.nasm.org/resource-center/exercise-library/barbell-bench-press
- NASM, Close Grip Bench Press: https://www.nasm.org/resource-center/exercise-library/close-grip-bench-press
- ACE, estudo de exercícios de tríceps: https://www.acefitness.org/certifiednewsarticle/3008/ace-study-identifies-best-triceps-exercises/
Antes de implementar geração automática, ampliar e revisar o catálogo por exercício, equipamentos, variações, modalidade e tipo de registro. Não usar as regras de correspondência isoladamente como prescrição.

## Verificação
`node checks.cjs`: sintaxe e regressões existentes; normalização de preferências e modalidades combinadas; classificação automática e manual; exclusão de campos inválidos/duplicados; perfil legado/histórico preservados; rascunhos descartados entre contas; skip e cancel sem perda de dados.
Navegador desktop: questionário completo, modalidades Academia + Em casa, tríceps, dia e equipamento; salvar; recarregar e entrar sem repetir questionário; perfil persistido; criar exercício, exibir músculos e ajustar manualmente foco e auxiliar. Dados de teste somente no navegador de QA, não nos arquivos.
Pendente: cadastro/login reais com confirmação, isolamento com duas contas Supabase no servidor, aparelho móvel e atualização de PWA instalado. A RLS configurada precisa ser validada no banco real antes de considerar compartilhamento.

## Continuidade
Esta entrega não implementa rotina automática, amigos/perfil público, alimentação, ofensiva ou movimentação do Histórico para Frequência. São próximas etapas do plano aprovado, com issues próprias. Nenhum botão sugere que esses recursos já estão ativos. Cache PWA v14 inclui personalization.js e personalization.css.

A etapa seguinte de rotina automática está descrita em AUTOMATIC-ROUTINES.md (issue #10); o escopo acima documenta a primeira entrega.
