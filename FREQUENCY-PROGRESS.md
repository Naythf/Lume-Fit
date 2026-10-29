# Frequência, histórico e evolução — issue #12

## Entrega
A navegação principal passa a ter cinco destinos. Histórico fica dentro de Frequência, junto com Calendário e Evolução. Atalhos antigos de início e o término de um treino continuam levando ao histórico, agora nessa seção. Não há migração de sessões, troca de IDs ou mudança do schema/RLS/configuração Supabase.

Calendário inicia na segunda-feira, tem dias selecionáveis, setas de teclado com passagem de mês, navegação de mês e retorno a hoje. Um dia com treino registrado é claro; a rotina atual aparece como planejamento em dias de hoje em diante; dias futuros sem rotina agendada são descanso do plano atual. O app não inventa planejamento histórico nem marca faltas passadas com base na rotina atual. Quando não há nenhum dia agendado, informa que o planejamento precisa ser configurado. Selecionar um dia mostra as séries registradas e as rotinas planejadas. Treinar em um dia sem rotina agendada não muda retroativamente o planejamento.

Resumos distinguem dias ativos e treinos concluídos. A comparação semanal considera o mesmo número de dias transcorridos na semana anterior; no mês atual compara com o período equivalente do mês anterior, limitado ao último dia existente. Meses passados comparam meses completos. Meses futuros não mostram comparação. Os gráficos anteriores de oito semanas/seis meses foram preservados, contando dias distintos.

Evolução permite selecionar exercício e métrica: carga máxima por sessão, soma das repetições ou volume (carga registrada × repetições). IDs preservam a identidade entre renomeações. Exercícios de rotinas excluídas continuam disponíveis a partir do histórico; entradas antigas sem ID usam o nome como fallback e podem agrupar homônimos. O gráfico mostra os últimos 12 registros; a tabela contém todos os pontos e a variação textual usa primeiro/último do histórico completo. Volume não mede esforço total, principalmente com carga adicional zero; a interface explica esse limite. Não há promessa de evolução física nem inferência de hipertrofia.

## Metas e sequência
`profile.frequencyGoals` é um array opcional de políticas `{week:'YYYY-MM-DD',days:1..7}`, com semana iniciada numa segunda-feira. Normalização valida as datas, deduplica a semana e ordena; registros antigos sem metas continuam sem meta automática. A sugestão do formulário usa a disponibilidade do perfil, mas só é ativada após salvar.

A primeira meta vale na semana atual, sem premiar semanas anteriores. Alterações começam na próxima segunda-feira e preservam o valor das semanas antigas. Salvar de novo substitui apenas a política agendada para a próxima semana. Escolher o valor atual cancela uma alteração pendente.

A sequência conta semanas consecutivas com o número alvo de dias ativos, sem somar dois treinos no mesmo dia. A semana atual ainda aberta mantém a sequência anterior; atingir a meta a acrescenta imediatamente. Semana encerrada abaixo da meta reinicia a sequência. Dias de descanso não exigem ação e não quebram a sequência. Melhor sequência é recalculada dos registros e das políticas, inclusive após exclusões de treinos. Não há congelamento pago, notificações, comparação social ou recompensas fictícias.

## Datas e compatibilidade
Os cálculos usam datas locais do navegador. Timestamps ISO são convertidos para o dia local; datas legadas sem horário são interpretadas como dias locais, sem deslocamento UTC. Aritmética de dias usa calendário, não soma de 24 horas, para atravessar horário de verão. Datas inválidas e registros em dias futuros não entram nas contagens, mas os dados originais continuam no backup. Início, perfil e Frequência compartilham a contagem de dias. A antiga meta mensal fixa de 20 dias foi substituída no início pelo progresso da meta semanal configurada.

Estado de calendário, seleção de exercício e seção é limpo ao sair/trocar de conta. Metas são armazenadas no documento privado já usado pelo app. A prévia continua com configuração Supabase vazia para testar em modo local.

## Direção visual e acessibilidade
Mantém a família tipográfica do aplicativo e a paleta: fundo #050505/#111111, superfície #141414, bordas #444444, texto #EEEEEE e apoio #BBBBBB. O calendário organiza a leitura; o cartão de constância tem destaque e os dados de resumo usam divisórias discretas. No celular, calendário e detalhes empilham. Alvos, nomes de controles, rótulos, foco e tabela de métricas ficam acessíveis; o mapa não foi alterado. Transições respondem às mudanças de seção e gráfico, respeitando movimento reduzido. Sem skeleton ou atraso artificial em cálculos locais, sem novos serviços/rastreadores. PWA v16 inclui frequency.js/css.

## Validação
`node checks.cjs` passou com todas as regressões anteriores, incluindo as 180 combinações do gerador. Novos casos cobrem duplicidade no mesmo dia, sequência/melhor sequência, semana aberta/encerrada, quebra e retomada, políticas históricas, ausência de metas, primeira meta sem conquistas retroativas, alteração futura/cancelamento, datas inválidas/futuras, meses de tamanhos diferentes, ano bissexto, virada de ano, exercícios excluídos/sem ID, carga zero, filtros de séries e métricas, compatibilidade de backup e gráficos semanais/mensais. Aritmética de datas foi verificada em America/Sao_Paulo, America/New_York (incluindo horário de verão) e UTC.

Navegador desktop: abrir Frequência sem meta, salvar primeira meta, concluir um treino local com 20 kg × 10, abrir Histórico integrado e Evolução (20 kg, 10 reps, 200 kg × reps), trocar métrica e consultar tabela; alterar meta de 1 para 2 dias e confirmar valor atual preservado e início em 02/11/2026; próximo mês com rotinas nas datas corretas; selecionar data e usar teclado atravessando novembro/outubro; recarregar com sessões e metas preservadas; gráficos de oito semanas/seis meses. Fixtures apenas no navegador local de QA, sem inserir dados nos arquivos do aplicativo.

Pendente: validação em aparelho móvel e leitor de tela, atualização de PWA instalado, cadastro/login reais e isolamento/sincronização com duas contas Supabase. Nenhuma afirmação de que a nuvem foi validada. PR empilhado sobre #11; a main e o site principal permanecem inalterados.
