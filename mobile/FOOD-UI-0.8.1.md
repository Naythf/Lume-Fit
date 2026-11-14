# Alimentação 0.8.1 · Closes #88

- Separação de 18px após o grupo refeição/horário, inclusive quando não há ingredientes.
- Diário usa a mesma borda, superfície, medidas e estado aria-current das outras abas. O problema anterior era a borda depender de uma variável restrita à outra tela e a aba Diário não declarar o estado selecionado.
- Removido Meu guia do Lume Hub; o acesso permanece dentro de Alimentação.

54 testes, lint/typecheck e checks.cjs passaram. Navegador: espaçamento medido de18px, Diário selecionado, Hub com Frequência/Amigos/Ajustes, abas sem overflow horizontal em319/415/768px. Instalação no aparelho não executada. APK0.8.1/code11; mesma origem, dados e interface offline; site/schema preservados.
