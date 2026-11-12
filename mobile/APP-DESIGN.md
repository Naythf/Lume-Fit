# Lume Fit — reforma exclusiva do aplicativo

12/11/2026 · Issue #70 · sem alteração dos assets do site publicado.

## Direção

Glass monocromático de academia: canvas #08090b, superfície #1a1c20, texto #f5f5f6, apoio #bfc2ca, linhas brancas a 13%. Tipografia do sistema já disponível offline; corpo 16px, apoio 14px, títulos 25–44px. Raio maior nas superfícies de navegação e menor nos controles. A memória visual é o halter sobre fundo escuro; não acrescentar acentos coloridos ou fontes externas.

O painel mantém o próximo treino em destaque, atividade semanal e histórico. Os indicadores numéricos ficam em expansão, sem excluir os dados. Hub: Início, Treinos, Alimentação, Mais. Frequência/histórico, Amigos, Saber e Ajustes permanecem acessíveis em Mais. O editor mostra parâmetros e execução; foco muscular e aparência ficam em expansão. Revelações usam IntersectionObserver, apenas uma vez por seção, transform/opacity e LumeMotionPreference. Conteúdo nunca depende da animação para aparecer.

## Referências consultadas

- [Hevy — rotinas e treino](https://help.hevyapp.com/hc/en-us/articles/33703513582871-Workouts-vs-Routines-in-Hevy-What-They-Mean-and-How-to-Use-Them): separar planejamento e registro.
- [Fitbod — reforma da aba de treino](https://fitbod.me/blog/a-better-workout-tab/): hierarquia, timer legível, ações secundárias e acesso a instruções pelo exercício. Referência de interação, não cópia de assets.
- [Quaternius — Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html): modelos coerentes, licença CC0 e distribuição gratuita Standard. Não é atlas anatômico nem demonstração biomecânica certificada.

## Skills pesquisadas e usadas

Instaladas localmente para este projeto em `work/design-skills` (disponíveis para consulta nos próximos turnos; não houve instalação global):

- [frontend-design — Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design): direção intencional e hierarquia.
- [visual-design — mthines](https://github.com/mthines/agent-skills/tree/main/skills/design/visual-design): cores, tipografia e identidade.
- [animations — mthines](https://github.com/mthines/agent-skills/tree/main/skills/design/animations): composição, revelação e movimento reduzido. Aplicada à interface HTML dentro do APK.
- [visual-asset-curation — SkillMedev](https://github.com/SkillMedev/skills/tree/main/skills/visual-asset-curation): seleção e tratamento coerente de assets.
- [image-license-rights — SkillMedev](https://github.com/SkillMedev/skills/tree/main/skills/image-license-rights): registro de origem e licença.

Pesquisa de modelos realizada nas fontes oficiais. Skills dependentes de bibliotecas pagas ou MCP de simulação não foram necessárias. Screencast/video-analyser não instalados; validação visual usa navegador, sem afirmar medição de 60fps.

## Assets e licenças

Registro: Universal Base Characters [Standard], Quaternius, obtido em 12/11/2026 pelo download gratuito oficial do [Itch.io](https://quaternius.itch.io/universal-base-characters). CC0 1.0, confirmada na página e no arquivo License_Standard.txt. Uso: ilustrações incorporadas ao app, sem revenda de biblioteca. Personagens sintéticos; nenhuma pessoa identificável, marca ou propriedade fotografada. Autor declara ausência de IA generativa na página. Atribuição não obrigatória sob CC0, mantida em documentação e bundle. Material original substituído por cinza metálico e luz de estúdio; geometrias e rig preservados. Poses por família são ilustrações, não vídeos instrutivos ou mapas de ativação.

Three.js 0.187.0 (MIT) e esbuild 0.28.2 são ferramentas locais. Three.js e licença CC0 são incluídos no HTML empacotado. Halter/kettlebell em geometria procedural própria, mesmo material e iluminação. Imagem de halteres já existente preservada no painel. Rejeitados assets de apps comerciais (sem licença para redistribuir), pacotes pagos e mistura de personagens de autores diferentes.

O runtime usa um único WebGLRenderer e cacheia imagens dos modelos. Não mantém animações 3D rodando, não baixa modelos e oferece texto quando WebGL indisponível. Fonte em app-ui/models.js, GLTF/bin original em assets/models. Para reconstruir o bundle: na raiz, `npm install --prefix ../design-tools three@0.187.0 esbuild@0.28.2`, depois `node mobile/scripts/build-model-assets.mjs`. O build Android usa o bundle pronto versionado, sem depender dessa pasta de ferramentas.

## Descrições e vídeos

Descrições pessoais e links ficam em `profile.exerciseGuides`, por ID do exercício, dentro do documento privado existente. O perfil preserva campos adicionais inclusive em clientes web anteriores; não criar tabela, sessão, chave global ou projeção pública. O backup normal já inclui esse perfil. Orientações automáticas vêm do catálogo explícito quando ID e nome coincidem; não inventar instruções de movimentos desconhecidos nem gerar prescrições por nome.

URLs permitem apenas HTTPS e hosts/caminhos específicos de YouTube, TikTok e Instagram; rejeitam credenciais, scripts e domínios parecidos. YouTube/TikTok têm carregamento explícito do player; nenhum iframe ou SDK externo é carregado antes do toque. Instagram e links curtos sem ID de vídeo mantêm acesso ao original. Serviços externos podem impedir incorporação; link original permanece disponível. Vídeos exigem rede e não são baixados. Ao fechar a ficha, o player é removido.

## Validação

TypeScript, lint, testes de domínio/empacotamento, validação de URLs e regressões da raiz. QA visual em 390px com todas as conexões bloqueadas. Ainda é necessário testar desempenho, WebGL, fontes com escala de acessibilidade e players reais em Android/iPhone físicos. Não afirmar paridade 100%, precisão anatômica ou prontidão para loja.
