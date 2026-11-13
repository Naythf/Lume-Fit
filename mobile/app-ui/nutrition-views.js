/* Compact, data-led views for the private guide. No external links. */
window.LumeGuideVisual = (() => {
  const C = LumeGuideCore,
    N = LumeNutrition;
  const num = (v, d = 0) =>
    v === null || v === undefined
      ? "—"
      : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: d });
  const range = (v, d = 0) =>
    !v ? "—" : v[0] === v[1] ? num(v[0], d) : `${num(v[0], d)}–${num(v[1], d)}`;
  const chevron =
    '<svg class="guide-disclosure-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
  const info = (key, label = "Entender") =>
    `<button type="button" class="nv-info" onclick="LumeGuide.explain('${key}')" aria-label="${label}">${label}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 9v5m0-8v1"/></svg></button>`;
  const fold = (title, body) =>
    `<details class="guide-fold"><summary><span>${title}</span>${chevron}</summary><div>${body}</div></details>`;
  const button = (label, action, primary = false) =>
    `<button type="button" class="${primary ? "primary-btn" : "guide-button"}" onclick="${action}">${label}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>`;
  const coverage = (p) =>
    p.value === null
      ? "Sem valores registrados hoje"
      : `${p.count} de ${p.total} ${p.total === 1 ? "refeição informada" : "refeições com valor"}`;
  const bar = (p, name) =>
    `<div class="nv-track" role="progressbar" aria-label="${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p.ratio * 100)}" aria-valuetext="${p.value === null ? "Sem valor informado" : num(p.value, 1) + " informado; " + coverage(p)}"><span style="--fill:${p.ratio}"></span></div>`;
  const currentMeals = () =>
    (state.db.nutrition?.meals || []).filter(
      (m) => m.date === activityKey(new Date()),
    );
  function summary(data) {
    const r = N.references(data.setup, data.entries),
      s = data.setup,
      meals = currentMeals(),
      energyRef = r.macros?.kcal || r.energy?.[0],
      water = (data.water || []).find(
        (x) => x.date === activityKey(new Date()),
      ),
      waterRef = r.drinks ? Math.round((r.drinks[0] + r.drinks[1]) / 2) : null;
    const e = N.progress(meals, "energy", energyRef),
      p = N.progress(meals, "protein", r.proteinReference),
      w = {
        value: water?.ml ?? null,
        ratio: waterRef ? Math.min(1, (water?.ml || 0) / waterRef) : 0,
      };
    return `<div class="nv-summary-toolbar"><span>Suas referências diárias</span><button class="nv-edit" type="button" onclick="LumeGuide.quickConfig()">Ajustar dados</button></div><section class="nv-energy studio-reveal" aria-label="Referência de energia"><header><h3>Energia diária</h3>${info("energy", "Como calculamos")}</header>${
      r.energy
        ? `<div class="nv-energy-value"><strong>${range(r.energy)}</strong><span>kcal / dia</span></div><p class="nv-energy-caption">${s.energyMode === "maintain" || r.adjustmentBlocked ? "Manutenção · estimativa" : s.energyMode === "gain" ? "Ganho gradual · +10%" : "Redução leve · −10%"}${s.sex === "unspecified" ? " · faixa" : ""}</p><div class="nv-energy-modes" aria-label="Cenário de energia">${[
            ["maintain", "Manter"],
            ["gain", "Ganhar"],
            ["lose", "Reduzir"],
          ]
            .map(
              ([mode, label]) =>
                `<button type="button" aria-pressed="${s.energyMode === mode}" onclick="LumeGuide.energyMode('${mode}')">${label}</button>`,
            )
            .join(
              "",
            )}</div><div class="nv-consumed"><span>${e.value === null ? "Registre refeições para comparar." : `${num(e.value)} kcal informadas hoje`}</span>${bar(e, "Energia informada hoje")}${e.value !== null ? `<small>${coverage(e)}</small>` : ""}</div>`
        : `<div class="nv-missing"><strong>Vamos completar seu cálculo.</strong><p>${esc(r.reason)}</p>${button("Completar dados", "LumeGuide.quickConfig()")}</div>`
    }</section>
    <div class="nv-pair"><section class="nv-protein studio-reveal"><header><h3>Proteínas</h3>${info("protein", "Sobre proteínas")}</header><strong class="nv-number">${r.protein ? range(r.protein) : "—"} <small>${r.protein ? "g / dia" : ""}</small></strong><div class="nv-protein-guide" aria-label="Cálculo da referência por peso">${r.protein && r.weight ? `<div><b>${num(r.weight, 1)} <small>kg</small></b><span>× ${s.proteinMode === "training" ? "1,4–2,0" : "0,83"} g/kg</span></div>` : "<span>Informe seu contexto<br>e peso atual</span>"}</div><div class="nv-protein-mode" aria-label="Rotina para referência de proteína">${["daily", "training"].map((mode) => `<button type="button" aria-pressed="${s.proteinMode === mode}" onclick="LumeGuide.proteinMode('${mode}')">${mode === "daily" ? "Dia a dia" : "Treino"}</button>`).join("")}</div><div class="nv-logged">${p.value === null ? "Sem valor informado hoje" : `${num(p.value, 1)} g informadas hoje`}</div>${bar(p, "Proteína informada hoje")}<small>${p.value === null ? "Use o diário para acompanhar." : coverage(p)}</small></section>
    <section class="nv-water studio-reveal"><header><h3>Água e bebidas</h3>${info("water", "Sobre hidratação")}</header><strong class="nv-number">${
      r.drinks
        ? range(
            r.drinks.map((x) => x / 1000),
            1,
          )
        : "—"
    } <small>${r.drinks ? "L / dia" : ""}</small></strong><div class="nv-glass" role="img" aria-label="${water ? num(water.ml) + " mL registrados hoje" : "Sem líquidos registrados hoje"}"><div class="nv-liquid" style="--water:${w.ratio}"></div><span>${water ? `${num(water.ml)} mL` : "Sem registro"}</span></div><div class="nv-water-actions"><button type="button" aria-label="Desfazer 250 mililitros de hoje" onclick="LumeGuide.water(-250)" ${!water?.ml ? "disabled" : ""}>−</button><button type="button" onclick="LumeGuide.water(250)">+ 250 mL</button></div><small>Registre só o que você bebeu.</small></section></div>
    ${r.macros ? macroPanel(r) : ""}<section class="nv-next studio-reveal"><img src="__NUTRITION_PLATE__" alt="Ilustração de arroz, feijão, frango e vegetais" width="180" height="180"><div><h3>Transforme números em comida.</h3><p>Veja porções e ajuste uma refeição para entender o que muda.</p>${button("Explorar refeições", "LumeGuide.go('food')", true)}</div></section>
    ${fold("Outros indicadores", `<dl class="nv-secondary"><div><dt>IMC descritivo</dt><dd>${r.bmi ? num(r.bmi, 1) + " kg/m²" : "Complete suas medidas"}</dd></div>${r.delta !== null ? `<div><dt>Diferença até o peso informado</dt><dd>${r.delta > 0 ? "+" : ""}${num(r.delta, 1)} kg</dd></div>` : ""}</dl><p>O IMC relaciona peso e altura. Não distingue músculo de gordura. A diferença de peso não prevê prazo nem resultado.</p>`)}<p class="nv-footnote">Estimativas de partida. Ajuste conforme sua resposta e acompanhamento profissional.</p>`;
  }
  function macroPanel(r) {
    const m = r.macros;
    return `<section class="nv-macros studio-reveal"><header><h3>Como essa energia se divide</h3>${info("macros", "Entender a divisão")}</header><div class="nv-macro-stack" role="img" aria-label="Exemplo de divisão: proteína ${num(m.percent[0])}%, carboidratos ${num(m.percent[1])}%, gorduras ${num(m.percent[2])}%">${m.percent.map((pct, i) => `<span class="nv-segment-${i}" style="--share:${pct};width:${pct}%"></span>`).join("")}</div><dl>${[
      ["Proteínas", m.protein],
      ["Carboidratos", m.carbs],
      ["Gorduras", m.fat],
    ]
      .map(
        ([label, value], i) =>
          `<div><dt><i class="nv-segment-${i}"></i>${label}</dt><dd>${num(value)} <small>g</small></dd></div>`,
      )
      .join(
        "",
      )}</dl><p class="nv-footnote">${r.energy[0] !== r.energy[1] ? "Exemplo calculado no centro da faixa de energia." : "Uma divisão possível para a referência calculada."}</p></section>`;
  }
  function food(data, view) {
    const r = N.references(data.setup, data.entries),
      options = N.library(data.setup),
      groups = ["Café da manhã", "Almoço", "Lanche", "Jantar"],
      list = options.filter((x) => x.kind === view.kind),
      recipe = list.find((x) => x.id === view.recipe) || list[0],
      scale = view.scale || 1;
    return `<div class="nv-heading"><h2 tabindex="-1">Quanto cabe no prato?</h2><button class="nv-edit" onclick="LumeGuide.quickConfig()" type="button">Preferências</button></div><p class="nv-context">Escolha uma refeição. Mude a porção e veja kcal e nutrientes acompanharem a mudança.</p><div class="nv-meal-tabs" aria-label="Tipo de refeição">${groups.map((g) => `<button type="button" aria-pressed="${g === view.kind}" onclick="LumeGuide.kind('${g}')">${g}</button>`).join("")}</div>
    ${
      !options.length
        ? `<section class="nv-missing"><h3>Nenhuma combinação com estes filtros.</h3><p>Reveja o tempo de preparo e os alimentos a evitar, ou escolha outro grupo.</p>${button("Configurar preferências", "LumeGuide.quickConfig()", true)}</section>`
        : !recipe
          ? `<p class="nv-footnote">Nenhuma opção deste grupo atende aos seus filtros. Ajuste o tempo ou escolha outro grupo.</p>`
          : `<div class="nv-recipe-options" aria-label="Escolher combinação">${list.map((x) => `<button type="button" aria-pressed="${x.id === recipe.id}" onclick="LumeGuide.recipe('${x.id}')">${esc(x.name)}</button>`).join("")}</div>${recipePanel(
              recipe,
              scale,
              r,
              N.options(data.setup).some((x) => x.id === recipe.id),
            )}`
    }
    ${menuPanel(data, r)}<section class="nv-learn studio-reveal"><h3>Entenda com exemplos</h3>${fold(
      "Proteínas: de onde vêm?",
      `<p>Ovos, frango, leite, feijões, lentilhas e tofu podem contribuir. Eles fornecem quantidades diferentes por porção.</p><div class="nv-food-compare">${[
        ["chicken", 100],
        ["egg", 100],
        ["lentils", 150],
        ["tofu", 150],
      ]
        .map(
          ([key, g]) =>
            `<div><span>${esc(N.foods[key][0])}<small>${g} g do alimento</small></span><strong>${num((N.foods[key][2] * g) / 100, 1)} g <small>de proteína</small></strong></div>`,
        )
        .join(
          "",
        )}</div><p>Gramas do alimento e gramas de proteína são medidas diferentes. Varie as fontes ao longo do dia.</p>`,
    )}${fold("Carboidratos e gorduras, na prática", `<p>Arroz, aveia, frutas e leguminosas ajudam a fornecer energia. Gorduras também entram na conta: 1 g de proteína ou carboidrato corresponde a cerca de 4 kcal; 1 g de gordura, a 9 kcal.</p><p>Óleo adicionado ao preparo muda os valores. As porções exibidas usam exatamente os alimentos e preparações listados.</p>`)}${densityPanel()}${fold("Organizar a alimentação", `<p>Varie alimentos in natura e preparações de casa. Alterne vegetais, cereais e fontes de proteína conforme gosto, orçamento e acesso.</p><p>Na alimentação exclusivamente vegetal, a adequação de vitamina B12 exige atenção específica e orientação. Não use as combinações como garantia de adequação de todos os nutrientes.</p>`)}<p class="nv-footnote">Composição estimada dos ingredientes. Marcas, preparo e medidas caseiras variam. Confira rótulos e contaminação cruzada quando houver restrições.</p></section>`;
  }
  function recipePanel(recipe, scale, r, canPlan) {
    const t = N.totals(recipe.id, scale),
      proteinPct = r.proteinReference
        ? (t.protein / r.proteinReference) * 100
        : null;
    return `<article class="nv-recipe studio-reveal"><header><div><h3>${esc(recipe.name)}</h3><p>${recipe.minutes} min · preparação aproximada</p></div>${recipe.art ? '<img src="__NUTRITION_PLATE__" alt="Ilustração da combinação, sem representar a gramagem" width="150" height="150">' : ""}</header><p class="nv-footnote">${recipe.tags.length ? "Contém: " + recipe.tags.map((t) => C.choices.allergens[t]).join(", ") + ". " : ""}Confira rótulos e ingredientes usados.${canPlan ? "" : " Exemplo educativo; confirme contexto e restrições antes de usar no seu rascunho."}</p><div class="nv-portions"><span>Tamanho da porção</span><div aria-label="Multiplicador de porção">${[0.5, 0.75, 1, 1.25, 1.5, 2].map((x) => `<button type="button" aria-pressed="${scale === x}" onclick="LumeGuide.portion(${x})">${num(x, 2)}×</button>`).join("")}</div></div><div class="nv-recipe-nutrients" aria-live="polite"><div><strong>${num(t.energy)}</strong><span>kcal</span></div><div><strong>${num(t.protein, 1)} <small>g</small></strong><span>proteínas</span></div><div><strong>${num(t.carbs, 1)} <small>g</small></strong><span>carboidratos</span></div><div><strong>${num(t.fat, 1)} <small>g</small></strong><span>gorduras</span></div></div>${proteinPct !== null ? `<p class="nv-recipe-contribution">≈ ${num(proteinPct)}% da referência visual diária de proteína</p>` : ""}<ul class="nv-ingredients">${recipe.parts.map(([key, g, measure]) => `<li><div><strong>${esc(N.foods[key][0])}</strong><span>${scale === 1 ? esc(measure) : "Quantidade ajustada à porção"}</span></div><b>${num(g * scale, 1)} <small>${key === "water" ? "mL" : "g"}</small></b></li>`).join("")}</ul><p class="nv-recipe-tip">${esc(recipe.tip)}</p>${button(canPlan ? "Adicionar ao meu rascunho" : "Definir preferências para usar", canPlan ? `LumeGuide.addMenu('${recipe.id}',${scale})` : "LumeGuide.quickConfig()", true)}<p class="nv-footnote">Imagem ilustrativa. Os pesos e valores são os da lista; a foto não mede a porção.</p></article>`;
  }
  function menuPanel(data, r) {
    const allowed = new Set(N.options(data.setup).map((x) => x.id)),
      valid = (data.menu || []).filter((x) => allowed.has(x.id)),
      totals = N.menuTotals(data.menu || [], data.setup),
      outside = (data.menu || []).length - valid.length;
    if (!data.menu?.length)
      return `<section class="nv-menu-empty"><h3>Seu rascunho do dia</h3><p>Adicione combinações para comparar as quantidades do conjunto. Isso não cria registros no diário.</p></section>`;
    return `<section class="nv-day-menu studio-reveal"><h3>Seu rascunho do dia</h3><p class="nv-footnote">Uma combinação por tipo de refeição. Escolher outra do mesmo tipo substitui a anterior.</p>${valid
      .map((x) => {
        const recipe = N.recipes.find((y) => y.id === x.id),
          t = N.totals(x.id, x.scale);
        return `<div class="nv-menu-row"><div><small>${recipe.kind} · ${num(x.scale, 2)}×</small><strong>${esc(recipe.name)}</strong><span>${num(t.energy)} kcal · ${num(t.protein, 1)} g de proteína</span></div><button class="nv-edit" type="button" onclick="LumeGuide.removeMenu('${x.id}')" aria-label="Remover ${esc(recipe.name)} do rascunho">Remover</button></div>`;
      })
      .join(
        "",
      )}${outside ? `<p class="nv-footnote">${outside} ${outside === 1 ? "combinação salva não atende" : "combinações salvas não atendem"} aos filtros atuais e não entra no total. <button class="nv-edit" type="button" onclick="LumeGuide.clearIncompatibleMenu()">Remover do rascunho</button></p>` : ""}<div class="nv-menu-totals"><strong>${num(totals.energy)} <small>kcal no rascunho</small></strong><span>${num(totals.protein, 1)} g proteínas · ${num(totals.carbs, 1)} g carboidratos · ${num(totals.fat, 1)} g gorduras</span></div>${r.macros ? `<div class="nv-menu-reference"><span>Energia: ${num((totals.energy / r.macros.kcal) * 100)}% do exemplo diário (${num(r.macros.kcal)} kcal)</span>${bar({ ratio: Math.min(1, totals.energy / r.macros.kcal), value: totals.energy, count: valid.length, total: valid.length }, "Energia do rascunho comparada ao exemplo diário")}</div>` : ""}<p class="nv-footnote">Rascunho para comparar porções. O total só representa os itens adicionados, sem inferir outras refeições ou adequação clínica.</p></section>`;
  }
  function densityPanel() {
    return fold(
      "Densidade energética: mesmo peso, energias diferentes",
      `<p>É a quantidade de kcal por grama. Água acrescenta peso e volume sem acrescentar energia; alimentos mais concentrados podem caber em porções menores.</p><div class="nv-density-bars">${[
        ["zucchini", 100],
        ["rice", 100],
        ["peanut", 100],
      ]
        .map(([key, g]) => {
          const f = N.foods[key];
          return `<div><div><span>${esc(f[0])}</span><strong>${f[1]} kcal</strong></div><i style="--fill:${f[1] / 544}"></i><small>100 g · ${num(f[1] / 100, 2)} kcal/g</small></div>`;
        })
        .join(
          "",
        )}</div><p>Densidade energética não mede, sozinha, a qualidade do alimento. Observe nutrientes, quantidade e contexto.</p><form id="guideDensity" onsubmit="LumeGuide.density(event)"><div class="guide-form-grid"><div class="field"><label for="densityEnergy">Energia da mesma porção (kcal)</label><input id="densityEnergy" name="energy" type="number" min="0" max="100000" step="any" required inputmode="decimal"></div><div class="field"><label for="densityGrams">Peso da porção (g)</label><input id="densityGrams" name="grams" type="number" min="0.1" max="100000" step="any" required inputmode="decimal"></div></div><button class="guide-button" type="submit">Calcular kcal por grama</button><output id="guideDensityResult" role="status"></output></form>`,
    );
  }
  function explanation(key, data) {
    const s = data.setup,
      r = N.references(s, data.entries);
    const content = {
      energy: [
        "Sua referência de energia",
        `<div class="nv-explain-number">${range(r.energy)} <small>kcal/dia</small></div><p>${r.energy ? "Estimativa de manutenção pela equação de Mifflin-St Jeor, multiplicada pela atividade diária. Não é uma medição do seu gasto." : esc(r.reason)}</p>${s.sex === "unspecified" ? "<p>Como você não escolheu uma referência fisiológica, mostramos as duas pontas da equação. Não inferimos sexo ou identidade.</p>" : ""}<p>O ajuste de +10% ou −10%, quando escolhido, é um cenário inicial do guia, não um resultado garantido. Não estimamos prazo de mudança de peso.</p>${r.adjustmentBlocked ? "<p>A redução foi desativada por ficar abaixo dos limites conservadores deste recurso. A manutenção foi preservada.</p>" : ""}<p>As barras usam o centro da faixa para comparação visual. O resultado é arredondado a 50 kcal. Reavalie com base na evolução, na sua saúde e em orientação individual.</p>`,
      ],
      protein: [
        "Proteína em gramas, sem confusão",
        `<div class="nv-explain-number">${range(r.protein)} <small>g/dia</small></div><p>${s.proteinMode === "training" ? "Para treino regular, a referência é 1,4–2,0 g por kg de peso/dia. Usamos 1,6 g/kg para desenhar as barras e o exemplo de macronutrientes." : "Para o dia a dia, usamos a referência populacional adulta de 0,83 g por kg/dia. Ela não equivale a uma avaliação da sua necessidade individual."}</p><p>${r.weight ? `${num(r.weight, 1)} kg × ${s.proteinMode === "training" ? "1,6" : "0,83"} = ${num(r.proteinReference)} g na referência visual.` : "Informe um peso para personalizar."}</p><p>100 g de alimento não são 100 g de proteína. Na tabela usada aqui, 100 g de peito de frango grelhado fornecem cerca de 32 g de proteína.</p><p>Condições renais, gestação, tratamentos e outras situações precisam de uma referência individual.</p>`,
      ],
      water: [
        "Quanto beber?",
        `<div class="nv-explain-number">${
          r.drinks
            ? range(
                r.drinks.map((x) => x / 1000),
                1,
              )
            : "—"
        } <small>L/dia de líquidos</small></div><p>É um ponto de partida aproximado para bebidas, derivado de referências populacionais de água total. ${
          r.totalWater
            ? `A água total de referência é ${range(
                r.totalWater.map((x) => x / 1000),
                1,
              )} L/dia, contando também alimentos.`
            : ""
        }</p><p>A divisão usa aproximadamente 80% em bebidas. Quando há uma faixa, o copo usa seu centro para comparação visual. A água dos alimentos varia; calor e treino podem aumentar a necessidade. Não é uma obrigação de beber água além de tudo o que já bebe.</p><p>Registre manualmente o que bebeu com +250 mL. O botão − desfaz 250 mL de hoje. Não aumente líquidos contra uma restrição profissional.</p>`,
      ],
      macros: [
        "Uma divisão possível",
        `<p>Os gramas de proteína usam a referência escolhida. As gorduras ficam entre 20% e 30% da energia; carboidratos completam o exemplo, preservando ao menos 45%.</p><p>O cálculo usa cerca de 4 kcal/g para proteínas e carboidratos e 9 kcal/g para gorduras. Na faixa de energia, usamos o centro apenas para este exemplo visual.</p><p>São referências para entender quantidades, não uma dieta completa. Os alimentos da tabela podem ter energia diferente da soma simplificada por fatores, fibras e arredondamentos.</p>`,
      ],
    };
    const [title, body] = content[key] || content.energy;
    return `<div class="nv-explanation"><h3>${title}</h3>${body}${button("Ajustar minhas referências", "closeSheet();LumeGuide.quickConfig()", true)}<button class="guide-button" onclick="closeSheet()" type="button">Fechar</button></div>`;
  }
  return { summary, food, fold, explanation };
})();
