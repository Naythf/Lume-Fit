# Meu guia · aplicativo 0.6.0

Issue #80. Reforma exclusiva da interface incorporada; o site publicado e o schema do servidor permanecem iguais.

## Experiência

“Meu guia” substitui “Guias e ferramentas” no Hub, no destaque inicial e na própria seção. A primeira visita apresenta o propósito e oferece uma configuração de quatro etapas: intenção, contexto, medidas opcionais e alimentação. É possível explorar antes de configurar. Voltar preserva as respostas em memória; sair sem salvar descarta o rascunho. Só Concluir guarda as preferências.

Resumo, Alimentação e Evolução separam tarefas. O resumo explica cada medida antes do valor; no celular, cada leitura ocupa a largura disponível. O IMC é descritivo, sem diagnóstico ou indicador de gordura. Mifflin-St Jeor com fator de atividade é uma aproximação arredondada a 50 kcal, sem déficit, superávit ou prazo de mudança de peso. O recurso restringe estimativas a adultos no contexto geral; energia exige 19–78 anos e IMC 18,5–40, limites conservadores do recurso, não critérios diagnósticos. Referências fisiológicas da equação são opcionais. A hidratação distingue água total de água para beber, com contexto para clima, esforço e restrições clínicas.

Alimentação explica proteínas, carboidratos, gorduras, fibras, micronutrientes e organização do prato. Densidade energética inclui exemplo explícito e cálculo de kcal/g a partir da mesma porção. Doze combinações editoriais brasileiras são filtradas por padrão alimentar, tempo e ingredientes a evitar. Não há calorias inferidas de fotografias nem dieta individual. Restrições desconhecidas, outra restrição não listada, menoridade ou contextos que pedem avaliação pausam as sugestões; textos educativos e registros continuam disponíveis. Notas livres são lembretes, não filtros. Rótulos, substituições e contaminação cruzada exigem conferência.

Evolução permite peso/data, observações e até quatro fotos opcionais por registro. Um registro por data, edição, exclusão com confirmação, galeria e comparação de dois momentos. Gráfico dos últimos 40 registros com datas reais, histórico paginado completo e variação primeiro–último sem inferir gordura/músculo. Novo registro não altera o peso do perfil; o mais recente pode atualizar as estimativas. Fotos preservam enquadramento, têm até 640 px no lado maior e até 120.000 caracteres codificados cada, limite de 20 fotos no histórico. Redimensionamento por canvas remove metadados do arquivo reexportado, sem IA. O original do usuário não é modificado.

## Dados e segurança

`profile.meuGuia` integra o documento privado existente, com normalização permitida apenas no pacote do app. Não há novas tabelas, serviços, permissões nativas ou chaves de armazenamento globais. Backups e a sincronização existente preservam preferências, registros, notas e imagens. O perfil social mantém sua whitelist e não recebe esses campos. Clientes do site preservam campos adicionais do perfil, sem apresentar esta interface.

Imagens aceitam somente JPEG/PNG/WebP, limite de arquivo 8 MB e decodificação de até 40 milhões de pixels. A seleção é preparada atomicamente: falha não adiciona um lote parcial. Salvamento aguarda processamento. Respostas tardias verificam documento, instância do formulário, janela e token; outra conta ou editor substituto não recebe imagens. Falha de armazenamento restaura o documento anterior e mantém o editor para recuperação. Outros registros não são apagados para liberar espaço. O limite de fotos não garante espaço se o documento já contiver muitos dados; exportar backup continua disponível.

## Referências e skills

Conteúdo e links também aparecem no app, consultados em 13/11/2026:

- [Guia Alimentar brasileiro, Ministério da Saúde, 2014](https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf): cultura alimentar, alimentos e preparações, planejamento e atenção às refeições.
- [OMS, alimentação saudável, 2026](https://www.who.int/news-room/fact-sheets/detail/healthy-diet): variedade e função dos macronutrientes.
- [EFSA, referência de água total](https://www.efsa.europa.eu/sites/default/files/2017_09_DRVs_summary_report.pdf): água de alimentos e bebidas, condições de referência.
- [Mifflin et al., 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/): equação de gasto em repouso. O fator de atividade é uma aproximação separada, não resultado medido pelo estudo.
- [NHS, IMC em adultos](https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults): cálculo e limites.
- [NHS England, registro de peso](https://www.england.nhs.uk/long-read/how-to-record-your-weight/): consistência das medições.
- [CDC, frutas, vegetais e energia, 2026](https://www.cdc.gov/healthy-weight-growth/healthy-eating/fruits-vegetables.html): água, fibras e concentração de energia.
- [Cronometer, estrutura de referências e objetivos](https://support.cronometer.com/hc/en-us/articles/33180044162836-Mobile-Targets): referência de separação de tarefas e explicações, sem copiar telas ou assets e sem integrar serviço.

Skills consultadas: Impeccable (contexto do projeto já lido diretamente, pois o helper não estava disponível), Nutrition e Meal Planner. As duas últimas foram instaladas com o instalador oficial em `work/design-skills` a partir de `clawic/skills`, para consulta local nos próximos turnos. Seus fluxos de memória pessoal, serviços ou recomendações clínicas não foram ativados: aqui a tarefa é composição do produto. A skill Haver foi avaliada e descartada por depender de serviço externo com limites/assinatura. A nutrition-strategist foi descartada por conter instruções genéricas de finanças misturadas à nutrição. Nenhum custo foi contratado.

## Validação

Testes cobrem normalização/backup, valores opcionais, datas, entradas inseguras, filtros em todas as combinações de alérgenos listados, limites das estimativas, densidade, variação, fotos assíncronas, isolamento de conta/editor, lote inválido, falha de espaço e data duplicada/futura no editor. Verificação visual em 320, 337, 390, 768 e 1280 px; fluxo de configuração, retorno, seletor/calendário, cálculo, registro com duas imagens, galeria e reabertura no modo local. Prévia QA bloqueia conexões externas. CI executa lint, tipos e testes antes do APK.

Limites: instalação, seletor de fotos/câmera, leitor de tela e modo avião no Android físico precisam de teste no aparelho. iPhone não foi compilado/validado nesta máquina Windows. Não houve revisão clínica de um nutricionista, consulta de conta real nem novo teste de sincronização remota com duas contas; a integração usa o documento privado existente e os testes de escopo/normalização.
