# Foto opcional da refeição — issue #58

O editor permite adicionar, trocar e remover a foto. A imagem é o ícone do registro no diário; sem foto, aparece o símbolo de alimentação. Cancelar o editor não altera o registro. A foto só é persistida ao salvar a refeição.

São aceitos arquivos JPEG, PNG e WebP de até 8 MB. O navegador decodifica a imagem, recorta o centro em quadrado de até 384 px e reencoda em JPEG, descartando metadados do arquivo original. O valor armazenado é uma data URL raster limitada a 160.000 caracteres; URLs externas e SVG são rejeitados. Falhas preservam a foto anterior. Troca de conta/editor ou seleção de outra foto invalida decodificações atrasadas.

O campo `nutrition.meals[].photo` é opcional e preservado na normalização e no backup JSON. A foto permanece no documento privado junto da refeição, sem entrar em projeções sociais. Não foi adicionado upload público nem alterado o schema. O armazenamento de muitas fotos pode atingir a quota local; o salvamento mantém o aviso de falta de espaço e o acesso ao backup.

Validação: `node prepare-release.cjs` e `node checks.cjs` aprovados. Novos testes cobrem foto ausente, backup, formatos/tamanho, recorte/compressão, remoção, troca de conta durante decodificação e substituição inválida durante upload. Navegador local: seleção de um asset de teste do próprio repositório em origem de QA, imagem JPEG 384×384 carregada no ícone, persistência após recarregar, edição e remoção com retorno ao ícone padrão. Nenhuma foto de usuário foi enviada ou inserida em conta real. Nuvem e celular físico não revalidados.
