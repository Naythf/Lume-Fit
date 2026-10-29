# Rotina automática — issue #10

## Comportamento
A aba Treinos oferece “Montar minha rotina”. O compositor copia preferências do perfil para um rascunho independente: modalidades combinadas, objetivo, até três prioridades musculares, dias, tempo, equipamentos e experiência. O mapa existente destaca os focos selecionados. Nenhuma escolha substitui preferências ou rotinas existentes.

Antes de salvar, a pessoa pode renomear as rotinas, trocar movimentos por alternativas compatíveis do mesmo grupo principal, remover e ordenar movimentos, editar séries/repetições e consultar notas e mapa principal/auxiliares. Salvar adiciona rotinas com IDs novos ao JSON privado já usado pelo app. Fechar, Escape, rever preferências e sair da conta não persistem rascunhos. Histórico, rotinas anteriores, imagens e IDs antigos são preservados. O catálogo é uma referência explícita; mudanças manuais continuam disponíveis após salvar.

## Catálogo e regras
`exercise-catalog.js` declara cada exercício com ID, grupo principal, auxiliares, padrão de movimento, equipamentos obrigatórios, modalidades, complexidade inicial e nota curta de execução. O gerador não infere músculos pelo nome. Exercícios sem equipamento estão sempre disponíveis. Marcar Academia não presume máquinas ou halteres. A seleção de modalidades funciona como união de ambientes possíveis, não como exigência de que toda sessão use todas as modalidades.

A seleção usa apenas os exercícios elegíveis. Até três dias usam corpo inteiro; quatro a seis alternam superiores e inferiores. O foco escolhido recebe prioridade, junto com variedade de padrões. Empates favorecem equipamento disponível e menor repetição de exercícios entre dias. Não há exercícios duplicados numa mesma sessão. O número de movimentos depende do tempo e das séries, limitado a seis. A estimativa explicita 5 min de preparação, 40 s por série, 60/90 s de intervalo e 45 s de transição por exercício. Não é duração medida; sessões podem ser menores que o tempo disponível. Alertas de foco ausente, grupos não cobertos e dias consecutivos são recalculados após editar o rascunho, incluindo domingo/segunda.

A classificação de experiência e a seleção são regras editoriais, não avaliação física validada. Os objetivos mudam parâmetros iniciais de um rascunho geral; não há progressão adaptativa, cálculo de carga, avaliação clínica, medida de ativação ou garantia de equilíbrio individual. As sugestões são para adultos; não coletam lesões/condições clínicas. Mobilidade é bloqueada com explicação, pois exige catálogo e registro de duração próprios. Condicionamento informa que o rascunho cobre fortalecimento e não substitui a parte aeróbica. Registros por tempo e prescrição clínica ficam fora desta versão.

Referências primárias consultadas para padrões gerais e exemplos, sem copiar imagens ou textos:
- CDC: https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html
- ACE, biblioteca: https://www.acefitness.org/resources/everyone/exercise-library/
- ACE, flexão com joelhos: https://www.acefitness.org/resources/everyone/exercise-library/13/bent-knee-push-up/
As referências não validam o algoritmo nem todos os ajustes editoriais do catálogo.

## Dados, movimento e acesso
Sem alteração de schema/RLS/credenciais Supabase. `catalogId` opcional é preservado na normalização quando o nome ainda corresponde ao catálogo. Músculos são salvos explicitamente e podem ser corrigidos. Modal nativo com foco/teclado, campos rotulados, status para validação, controles de mover com nomes acessíveis, layout de uma coluna no celular e movimento reduzido respeitado. Sem atraso falso, skeleton artificial, rastreador ou serviço adicional. PWA v15 inclui os três novos assets.

## Validação
`node checks.cjs`: sintaxe de todos os scripts, regressões anteriores, 180 combinações de modalidade/experiência/duração/número de dias, filtros de equipamento e nível, duração inicial no orçamento, unicidade por sessão, foco indisponível, intervalo domingo/segunda, objetivo não suportado, compatibilidade de backup, cancel/reset sem persistência, append com IDs únicos e proteção contra duplo salvamento.

Navegador desktop: abertura com preferências do perfil; dois dias com foco em tríceps; troca de supino por flexão, renomear rotina, abrir mapa e séries; rejeitar mínimo de repetições superior ao máximo; salvar duas rotinas preservando a antiga; recarregar e recuperar os dados locais; reordenar e remover exercícios; recalcular aviso de foco ausente; fechar sem salvar. Dados de QA apenas no armazenamento local do navegador.

Pendente: teste em aparelho móvel, cadastro/login reais, isolamento entre duas contas no servidor e atualização de PWA instalado. A prévia permanece em demonstração sem credenciais Supabase. A main não foi alterada; PR empilhado sobre a base de personalização #9.
