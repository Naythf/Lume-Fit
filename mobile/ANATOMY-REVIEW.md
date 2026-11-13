# Mapa anatômico 2D do aplicativo

Escopo: regiões musculares superficiais em vistas frontal/posterior masculinas, para acompanhar a escolha de grupos. Não é mapa de ativação, intensidade, diagnóstico ou anatomia cirúrgica. A seleção é a fonte do destaque, não uma inferência visual.

## Origem e licença

- Vetores: https://github.com/HichamELBSI/react-native-body-highlighter (main), `assets/bodyFront.ts` e `assets/bodyBack.ts`, consultados em 12/11/2026. MIT, copyright 2022 ELABBASSI Hicham; licença integral em `assets/anatomy/LICENSE-Hicham.txt` e no HTML incorporado. Os caminhos curvos foram extraídos sem IA generativa, sem redesenho ou mudança de proporções.
- ViewBox original: frente `0 0 724 1448`; costas `724 0 724 1448`. Mesma escala, eixo vertical e proporção em ambas as vistas. Não misturar com o antigo modelo WebGL ou com polígonos de outro pacote.
- Revisão de ilustração: skill `surgical-anatomy-illustration`, modo Review, instalada de https://github.com/DRZ-hang/surgical-illustration em `work/design-skills/surgical-anatomy-illustration`. Usada apenas para conferir localização, simetria, hierarquia e rótulos. Nenhuma geração de imagem ou orientação cirúrgica.

## Conferência dos grupos

Referências de localização: OpenStax, Anatomy and Physiology 2e, [membro superior e cintura escapular](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs) e [membro inferior e cintura pélvica](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs).

| Grupo no Lume | Regiões do SVG | Revisão |
|---|---|---|
| Peito | chest, frontal | Correto para localização geral dos peitorais |
| Ombros | deltoids, frontal/posterior | Correto para região deltoidea bilateral |
| Bíceps | biceps, frontal | Correto para braço anterior |
| Tríceps | triceps, posterior | Correto para braço posterior |
| Costas | trapezius, upper-back, lower-back, posterior | Agrupamento amplo, coerente com o nome do app; não distingue músculos profundos |
| Abdômen e core | abs, obliques, frontal | Região abdominal superficial; não representa todo o core profundo |
| Quadríceps | quadriceps, frontal | Correto para coxa anterior |
| Posterior de coxa | hamstring, posterior | Correto para coxa posterior |
| Glúteos | gluteal, posterior | Correto para região glútea |
| Panturrilhas | calves, posterior | Correto para perna posterior; canela anterior não é pintada |

Cabeça, cabelo, pescoço, mãos, pés, joelhos e tornozelos permanecem neutros, inclusive na seleção de todos os grupos. Nenhum destaque depende de coordenadas aproximadas ou da câmera 3D. Principal sólido vermelho; auxiliares com hachuras, também identificados por texto. Principal tem prioridade sobre auxiliares.

## Revisão de funcionamento

- Frente/costas com mesma altura, sem deformação; conferidas no compositor, no detalhe e no editor de exercício, inclusive em tela de 374 px.
- Selecionar Peito atualiza a região frontal imediatamente. Costas e Panturrilhas atualizam apenas as regiões posteriores correspondentes. Testes automatizados cobrem todos os grupos e impedem pintura de cabeça/extremidades.
- IDs únicos de patterns por desenho evitam interferência entre SVGs de telas diferentes. Chaves desconhecidas/importadas são descartadas. Caminhos e nomes do asset são validados durante o empacotamento.
- Editor usa os valores reais dos campos; cancelar não salva a prévia. O mapa segue a sugestão existente pelo nome ou a escolha manual. Não muda a prescrição nem a classificação do catálogo.
- Limites que precisam de revisão profissional: contornos anatômicos de detalhe, variação individual/sexo e contribuição de músculos profundos. Não foi feita validação clínica por anatomista. Não se pode verificar ativação ou recrutamento por essa ilustração.

## Distribuição

Todos os vetores e licenças ficam no pacote offline. O equipamento 3D é mantido apenas para halter/kettlebell; não há mais renderização corporal WebGL em runtime. O site publicado permanece inalterado.
