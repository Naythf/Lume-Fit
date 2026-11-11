# Interface empacotada e offline · 0.1.1

O usuário confirmou esta escolha em 11/11/2026: preservar a interface HTML/CSS/JavaScript e as animações, incorporando todos os recursos ao APK. A documentação anterior WEB-PARITY.md descreve a abordagem hospedada descartada.

## Inicialização

`scripts/package-web.mjs` lê os arquivos reais do site e incorpora estilos, scripts, imagens e Supabase SDK 2.76.1 em `src/generated/packaged-web.json`. O SDK é vendorizado com licença MIT e SHA-256 conferido; a compilação não o baixa de CDN. O JSON é gerado em `prepare`, nas verificações e antes da exportação, e entra no bundle Metro/Hermes pelo import estático. Não é um cache preenchido após uma visita online.

O native host usa `source={{html: packaged.html, baseUrl: WEB_URL}}`. O HTML vem do APK. A base HTTPS conserva a origem anterior do armazenamento Android conforme a semântica `loadDataWithBaseURL`; ela não é uma requisição inicial ao site. Repetir o teste de atualização sobre a versão 0.1.0 no aparelho antes de afirmar preservação validada de todos os dados. Não desinstalar nem limpar o app para atualizar. A versão continua usando o mesmo identificador/chave de teste; versionCode sobe para 2.

O gerador não altera o site raiz. Adapta apenas sua cópia empacotada: troca os recursos por conteúdo inline, desativa registro de service worker e verificação/recarregamento pelo site. Atualizações da interface passam a vir em um novo APK. CSS, componentes, regras e scripts de movimento são os mesmos; preferências salvas continuam respeitadas. A prévia web usa o documento incorporado em srcDoc.

## Uso sem rede

Desde a primeira abertura, a tela de entrada e o botão “Testar sem conta (somente neste dispositivo)” estão no pacote. O modo local permite rotinas, treino/retomada, histórico, alimentação/fotos, cálculos e personalização sem autenticação. Seus registros não são enviados automaticamente à conta. Login, recuperação de senha, leitura/sincronização da conta e amigos continuam precisando de rede. Esta etapa não adiciona uma nova sessão offline de conta autenticada nem modifica o contrato CAS do servidor.

O backup nativo continua pela folha de compartilhamento; importação e fotos usam arquivos locais. Ambos precisam de teste físico para permissões e seleção. O armazenamento do APK permanece separado do Expo Go e Chrome, sem migração automática entre eles. Não apagar dados para resolver atualização.

## Verificação

`npm test` verifica recursos inline, sintaxe dos scripts, SDK local, ausência de atualização hospedada e uso da fonte HTML pelo host, além das regras anteriores. `npm run typecheck` e `npm run lint` conferem o código mobile; os checks da raiz conferem regressões do site.

`npm run offline:qa` serve o documento em 127.0.0.1:8084 com CSP `connect-src 'none'`, bloqueando fetch/websocket e recursos externos. Na sessão de QA isolada foram criados rotina/exercício, concluída uma série de 20 kg × 8, recarregado/retomado o treino e salvo o resumo. Alimentação abriu; imagens foram confirmadas como data URLs carregadas, zero scripts externos e movimento `full`. Nenhuma conta real foi acessada e os dados de QA não são empacotados.

A simulação de navegador não substitui instalar o APK e testar em modo avião, nem comprova fotos, compartilhamento e origem de armazenamento iOS. O workflow verifica o marcador `LUME_PACKAGED_OFFLINE_V1` dentro do bundle do APK, assinatura de teste igual à anterior e ausência da permissão de sobreposição, além do pacote/hash. Não declarar todos os fluxos 100% validados.

## Reproduzir

```text
npm ci
npm run typecheck
npm run lint
npm test
npm run export:web
npm run offline:qa
```

O build Android segue o workflow gratuito no repositório público, sem EAS ou publicação em loja. Saída: `Lume-Fit-0.1.1-offline.apk`. A assinatura continua sendo de teste; para loja, definir chave privada própria e revisar a distribuição.
