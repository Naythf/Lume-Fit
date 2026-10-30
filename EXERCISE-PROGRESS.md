# Evolução por exercício — Issue #46

A seção Frequência → Evolução reúne melhores registros em todo o histórico, comparação com a sessão anterior, gráfico de carga/repetições/volume e detalhe das séries de cada treino. O gráfico mostra até 12 pontos recentes; o histórico abre oito sessões por vez e permite carregar anteriores. Os melhores registros não ficam limitados à janela do gráfico.

Durante a sessão guiada, Seu histórico neste exercício abre os mesmos dados em um painel, preservando a série digitada e o rascunho. O resumo final agora leva diretamente à seção Evolução. Nenhum dado de exemplo é publicado ou gravado em contas.

## Cálculos e identidade

- Dados derivados das sessões privadas já salvas. Sem migração, novo RPC, estimativa de 1RM ou armazenamento adicional.
- Um exercício usa seu identificador e o nome normalizado (acentos, caixa e espaços). Alterar o movimento com o mesmo ID separa os registros; exercícios duplicados em rotinas distintas com IDs próprios continuam separados. Não há união automática por nome ou por catálogo.
- Registros sem ID são agrupados por nome e rotina; quando falta o ID da rotina, usa-se o nome do treino como contexto. É um agrupamento legado conservador, sem afirmar equivalência com os exercícios atuais.
- Apenas séries válidas (0–2000 kg, 1–999 repetições inteiras, sem valores vazios/nulos/booleanos) e concluídas ou registradas no histórico entram nos cálculos. done=false é excluído. Datas inválidas/futuras são ignoradas. IDs de sessão repetidos contam uma única vez por exercício, usando a primeira ocorrência válida no documento.
- Carga máxima é a maior carga de uma série. Em empate, apresenta as melhores repetições nessa carga. O recorde de repetições por série informa a carga correspondente. Volume é a soma de kg × repetições por sessão do exercício, com número de séries e data.
- Comparação de repetições/volume com delta somente quando as cargas das séries e a quantidade de séries coincidem. Caso contrário, mostra os dois registros com contexto, sem afirmar melhora/piora. A ordem das cargas não muda a equivalência.
- Com zero carga adicional em todo o histórico, o gráfico abre em repetições e volume não é apresentado como recorde de esforço. O peso corporal não é estimado.
- Sem histórico há direção para registrar; um único treino é ponto de partida, sem delta fictício. Excluir ou editar sessões recalcula os resultados na próxima renderização.

## Validação

node prepare-release.cjs e node checks.cjs aprovados. exercise-progress-checks.cjs cobre identidade/renomeação, legado, séries inválidas, datas/futuro, duplicatas, comparação compatível, todos os registros vs janela do gráfico, exclusão/edição, zero carga, paginação, rascunho e reset de conta. O teste da comparação global da sessão guiada também rejeita nomes de movimento diferentes, mesmo com ID reutilizado.

Navegador com cenário temporário em memória, removido antes da publicação: 390 px sem overflow, gráfico e seletor customizado, exercício sem carga abrindo em repetições, detalhe de séries, consulta durante treino e retorno mantendo 14 kg/10 reps digitados. O rascunho de teste foi descartado. Conferência desktop em 1021 px. Dados reais e projeções sociais permanecem intactos.

Limites: análises descrevem números informados, sem medir técnica, amplitude, esforço, força isolada ou adequação do treino. Os pontos do gráfico têm espaçamento uniforme por sessão, não por intervalo de dias. A lista não tenta decidir automaticamente se duas variantes ou dois exercícios antigos são equivalentes.
