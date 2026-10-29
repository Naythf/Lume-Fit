# Ajustes e seleção do plano — Issue #24

Ajustes contém os grupos expansíveis Preferências (animações) e Backup e restauração (exportar/restaurar JSON). Atalhos duplicados de foto, dados, treinos e exercícios foram removidos. A entrada Meu perfil abre o perfil, com Alterar foto e Editar dados (nome, idade, peso, altura). Importação continua usando a confirmação existente antes de substituir dados. A escolha de movimento preserva o grupo Preferências aberto ao redesenhar Ajustes.

Seleções de modalidade, foco muscular, equipamentos e dias no plano automático atualizam os botões e mapa sem recriar o formulário ou repetir a animação de entrada. Preservam foco, campos, rolagem e dados ainda não salvos. Atualizações na revisão também não repetem a animação da tela inteira. Cache PWA v22.

Verificação: node checks.cjs; cobertura de alternância de seleção sem substituir formulário/rolagem e sem salvar rascunho. Validação visual em prévia local: grupos abrem/fecham suavemente; alternar movimento preserva ambos abertos; Editar dados abre formulário com rótulos e cancelar preserva o nome; selecionar Academia e Tríceps mantém foco no botão e opacidade 1, atualizando o mapa. Exportação/importação mantêm o fluxo existente; não foi executada substituição de dados reais. Nenhuma migração Supabase.
