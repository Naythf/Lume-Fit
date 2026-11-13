# Alimentação integrada · Closes #84

Prévia do app: Diário, Rotinas, Guia e Evolução. Rotinas privadas guardam nome, dias e escolhas de refeições/porções, separadas do consumo. Alterar restrições sinaliza rotinas incompatíveis e impede reativá-las sem revisão. Campos adicionais entram na normalização e backup existentes; nenhum schema remoto ou site publicado alterado.

Restrições: lista ampliada, lactose separada de proteínas do leite, alimentos individuais e campo explícito de exclusões por texto. Reconhecimento offline por termos e sinônimos, sem inferência clínica ou chamada de IA. A revisão antes de salvar mostra termos reconhecidos e desconhecidos. Texto desconhecido pausa uso personalizado; não é silenciosamente aceito como seguro. Lembretes gerais não são filtros. O catálogo filtrado continua limitado às combinações existentes, não é uma base universal de receitas. Exclusão de ingredientes não certifica ausência de contaminação cruzada.

Referências consultadas em 13/11/2026:
- Anvisa, perguntas e respostas sobre alergênicos: https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/perguntas-e-respostas-arquivos/rotulagem-de-alergenicos.pdf/@@download/file
- NIDDK, lactose: https://www.niddk.nih.gov/health-information/digestive-diseases/lactose-intolerance/eating-diet-nutrition
- NIDDK, doença celíaca e contaminação cruzada: https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease/eating-diet-nutrition

Validação: 53 testes, lint/typecheck e checks.cjs. Navegador isolado: salvar rotina, revisão explícita de frango/lactose, exclusão de frango das sugestões e sinalização da rotina anterior. QA usa dados sintéticos somente no localhost isolado. Instalação física e novo APK não fazem parte desta prévia. Versão APK 0.7.0 anterior não contém estas mudanças.
