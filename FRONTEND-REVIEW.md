# Interface v5 — issue #1

Preserva Supabase, dados, logo, paleta e funções da 4.1. Atualiza hierarquia, cartões, navegação, estados vazios, animações reduzíveis e informa a atividade da semana com dados reais. Não implementa ofensiva: as regras desse recurso ainda serão definidas.

## Validação
- `node checks.cjs`: sintaxe de app/auth/experience/sw, agregação semanal vazia, duplicados e registros fora da semana; referências HTML e PWA.
- Navegador desktop: modo local vazio, painel semanal, formulário de rotina com foco inicial, Escape, aviso de privacidade antes do login e retorno do foco.
- Ainda necessário: teste visual em aparelhos móveis, fluxo completo de treino e persistência, duas contas reais, recuperação e sincronização Supabase, atualização de PWA instalado e auditoria automatizada de acessibilidade. Os ajustes responsivos não substituem esses testes.

## Transparência e pendências
Não foram encontrados analytics ou publicidade no código. Não foram adicionados rastreadores nem serviços externos de observabilidade; o status existente de sincronização foi preservado. Não há banner de consentimento para categorias opcionais inexistentes. Avisos descrevem armazenamento local, cache e serviços usados.

Os textos publicados são informativos. Responsável, contato público, base legal de cada tratamento (incluindo informações relacionadas à saúde), retenção, localização do banco e eventual transferência internacional precisam ser definidos antes de alegar conformidade LGPD. Não há exclusão integral de conta na UI. Não foram inventados CNPJ, endereço ou licenças das imagens existentes. O mantenedor precisa confirmar o direito de uso desses assets.

Referência consultada: guia de cookies da ANPD, https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf/@@display-file/file
Referência Motion Principles solicitada retornou 404. Não foi instalada.

## Publicação
Integrar o PR na main para publicação pelo fluxo existente do GitHub Pages. Cache atualizado para v10; abrir novamente o PWA conectado para obter os assets novos. Não há migração de banco.

## Ajustes da issue #3
- Espaçamento explícito entre conta, sincronização e menu, com maior área interna nas linhas.
- Saber: introdução ilustrada, prévia das quatro métricas, cartões SVG, hidratação em litros e mL, escala numérica de IMC e comparação entre peso atual e desejado. Ícones decorativos não simulam dados registrados. Mantidas fórmulas e validações.
- Animações de entrada, ilustração discreta e detalhes expansíveis; redução de movimento respeitada. Sem novas imagens de terceiros ou bibliotecas.
- Testes adicionais: 70 kg / 175 cm / 25 anos; hidratação 2,1–2,45 L, IMC 22,9, energia 2.337–2.594 kcal no intervalo das equações; diferença de 5 kg; bloqueio de entrada com 17 anos. Dados apenas em testes, não nas contas.
- Conferido no navegador desktop: campos, resultado, estado sem objetivo e espaçamento de Ajustes. Validação móvel em aparelho continua pendente.
