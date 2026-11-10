# Lume Fit mobile · primeira etapa

Aplicativo React Native com Expo SDK 58 e TypeScript, desenvolvido diretamente em código. Sem Figma, sem assinatura adicional, sem EAS pago e sem publicação nas lojas. O site da raiz permanece independente.

## O que funciona

- Início com identidade, logo e imagem existentes; indicadores e semana derivados de registros reais.
- Criação, edição e exclusão confirmada de rotinas, com dia opcional e vários exercícios.
- Sessão guiada com carga, repetições, conclusão explícita de séries e validação dos limites existentes na web.
- Rascunho persistido a cada edição, retomada após reabertura e descanso por prazo absoluto.
- Conclusão confirmada, histórico somente das séries concluídas e detalhe por exercício.
- Falhas de leitura bloqueiam alterações; falhas de gravação são mostradas. Concluir ou excluir só altera o estado após a gravação local ter sucesso.
- Prévia web do mesmo código React Native; não é um WebView do site.

Este é o primeiro fluxo funcional, não a migração completa. Ainda faltam autenticação/sincronização com comparação atômica, importação/exportação do backup web sem perder campos, perfil/amigos, alimentação com foto opcional, gráficos detalhados, catálogo e gerador automático, personalização e exclusão da conta. Essas funções continuam no site atual.

## Executar sem contratar serviços

Requisitos: Node 24 e npm. Dentro de `mobile/`:

```powershell
npm ci
npm run web
```

Para abrir a prévia empacotada: `npm run export:web`, depois `npm run preview`, em `http://127.0.0.1:8082`. Este endereço funciona somente no computador que está executando o servidor.

Para Android com Expo Go compatível instalado, `npm start` e abrir o projeto pelo QR code na mesma rede. Para compilar um aplicativo Android próprio localmente, é necessário o Android Studio/SDK/JDK configurado; usar `npx expo run:android --device`. Não é necessário publicar no Google Play para desenvolver.

Para iOS, o código é compartilhado desde o início. Testar um development build em iPhone sem assinatura Apple paga depende de compilação local com Xcode/Mac, segundo a documentação atual. Não comprar hardware nem ativar inscrição paga nesta fase. Uma prévia no Safari não comprova funcionamento nativo. Referência: https://docs.expo.dev/develop/development-builds/introduction/.

## Dados e privacidade

Este app começa vazio em modo local, sem contas ou exemplos. Usa AsyncStorage para esta primeira versão de rotinas e séries, em `lume_fit_mobile_local_v1`, separada do site e dos escopos de conta. Não usa analytics nem envia registros ao backend. AsyncStorage não é armazenamento criptografado e não receberá senhas ou tokens. Limpar os dados do app/navegador ou desinstalar pode remover os registros. Não há backup implementado ainda: usar como versão de desenvolvimento até concluir essa proteção.

Não importar automaticamente o cache da web, conectar uma conta ou transformar este namespace local em cache autenticado. A etapa de nuvem precisa manter os contratos CAS, revisão do servidor, isolamento por conta, retomada e recuperação explícita de conflito do site. Migração para SQLite e fotos em arquivos privados deve ser deliberada, com compatibilidade e limpeza, sem presumir criptografia.

## Estrutura

`src/app/` contém somente rotas e navegação Expo Router. `src/screens/` compõe telas; `src/components/` reúne os elementos reutilizados; `src/theme.ts` centraliza a identidade; `src/domain/` contém regras puras e testes; `src/state/` adapta a persistência. As transições estão sem animação nesta base; não ignorar preferências do usuário ao adicionar movimento.

## Verificar

```powershell
npm run typecheck
npm run lint
npm test
npm run export:web
```

Na raiz, executar também `node prepare-release.cjs --check` e `node checks.cjs`. Alterar somente `mobile/` não exige atualizar o cache do PWA. A CI mobile testa a prévia web sem EAS ou credenciais das lojas. Exportar bundles JavaScript nativos é uma conferência adicional, não substitui compilar APK/IPA nem testar aparelhos.

## Skills usadas como referência

Cópias locais consultadas de `expo-design-system`, `expo-native-ui`, `expo-project-structure`, `expo-router` e `expo-ui`, em `expo/skills` revisão `a9e5bd3fa00b4e61f632e43f85da73aee1942582` (MIT). Elas foram baixadas para a área de trabalho, não registradas globalmente. A marca/paleta existente prevalece sobre exemplos de cores das skills. Controles React Native básicos e navegação são suficientes nesta primeira etapa; não instalar `@expo/ui` sem um componente que o justifique. Nenhum comando de envio de feedback ou serviço pago foi executado por instrução dessas referências.

## Antes de ampliar os testes

Verificar teclado, retorno/gestos, fonte ampliada, VoiceOver/TalkBack, suspensão, retomada e falhas reais de armazenamento em aparelhos. Conferir avisos transitivos de `npm audit` do toolchain Expo/ESLint; não aplicar downgrade de SDK via `npm audit fix --force`. Não declarar o app pronto para distribuição enquanto essas validações e a migração restante estiverem pendentes.
