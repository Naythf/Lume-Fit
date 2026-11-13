/* Numeric references and food portions. Sources/methods: GUIDE-VISUAL-0.7.0.md. */
globalThis.LumeNutrition = (() => {
  const C = LumeGuideCore;
  function references(value, entries = []) {
    const now = new Date(),
      today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
    entries = C.normalize({ entries }).entries.filter((e) => e.date <= today);
    const s = C.setup(value),
      m = C.metrics(s, entries),
      weight = m.weight;
    const missing = [];
    if (!s.age) missing.push("idade");
    if (!weight) missing.push("peso");
    if (!s.height) missing.push("altura");
    let reason = "";
    if (s.context !== "general")
      reason =
        s.context === "unknown"
          ? "Confirme seu contexto para personalizar."
          : "Seu contexto pede referências definidas com acompanhamento.";
    else if (!s.age || s.age < 18 || s.age > 78)
      reason = !s.age
        ? "Informe sua idade para calcular."
        : "Esta equação foi limitada aqui a adultos de 18 a 78 anos.";
    else if (missing.length)
      reason = "Complete " + missing.join(", ") + " para calcular.";
    else if (m.bmi < 18.5 || m.bmi > 40)
      reason =
        "Para estas medidas, use uma referência de energia definida em avaliação individual.";
    const ready = !reason;
    const base =
      weight && s.height && s.age
        ? 10 * weight + 6.25 * s.height - 5 * s.age
        : null;
    const offsets =
      s.sex === "male" ? [5, 5] : s.sex === "female" ? [-161, -161] : [-161, 5];
    const round = (x) => Math.round(x / 50) * 50;
    const maintenance = ready
      ? offsets.map((x) => round((base + x) * m.factor))
      : null;
    let adjustment =
      s.energyMode === "gain" ? 1.1 : s.energyMode === "lose" ? 0.9 : 1;
    // A goal is a starting reference, not permission for an aggressive diet.
    const lowFloor = s.sex === "female" ? 1200 : 1500;
    const adjusted = maintenance?.map((x) => round(x * adjustment));
    const adjustmentBlocked =
      !!adjusted &&
      s.energyMode === "lose" &&
      (m.bmi < 20 || adjusted[0] < lowFloor);
    if (adjustmentBlocked) adjustment = 1;
    const energy = maintenance?.map((x) => round(x * adjustment)) || null;
    const protein =
      m.eligible && weight
        ? (s.proteinMode === "training"
            ? [weight * 1.4, weight * 2]
            : [weight * 0.83, weight * 0.83]
          ).map((x) => Math.round(x))
        : null;
    const proteinReference = protein
      ? Math.round(weight * (s.proteinMode === "training" ? 1.6 : 0.83))
      : null;
    const drinks = m.eligible
      ? s.sex === "female"
        ? [1600, 1600]
        : s.sex === "male"
          ? [2000, 2000]
          : [1600, 2000]
      : null;
    const totalWater = m.eligible
      ? s.sex === "female"
        ? [2000, 2000]
        : s.sex === "male"
          ? [2500, 2500]
          : [2000, 2500]
      : null;
    const kcal = energy ? Math.round((energy[0] + energy[1]) / 2) : null;
    let macros = null;
    if (kcal && proteinReference) {
      const proteinKcal = proteinReference * 4,
        proteinPct = (proteinKcal / kcal) * 100;
      const fatPct = Math.min(30, 100 - proteinPct - 45);
      if (proteinPct <= 35 && fatPct >= 20) {
        const fat = (kcal * fatPct) / 100 / 9,
          carbs = (kcal - proteinKcal - fat * 9) / 4;
        macros = {
          protein: proteinReference,
          carbs,
          fat,
          kcal,
          percent: [proteinPct, ((carbs * 4) / kcal) * 100, fatPct],
        };
      }
    }
    return {
      ...m,
      missing,
      reason,
      maintenance,
      energy,
      protein,
      proteinReference,
      drinks,
      totalWater,
      macros,
      adjustmentBlocked,
      adjustment,
    };
  }
  // TACO/NEPA-Unicamp, 2011. Values per 100 g edible portion; stated preparation.
  const foods = {
    rice: ["Arroz branco cozido", 128, 2.5, 28.1, 0.2, 3],
    oats: ["Aveia em flocos, seca", 394, 13.9, 66.6, 8.5, 7],
    beans: ["Feijão carioca cozido", 76, 4.8, 13.6, 0.5, 561],
    lentils: ["Lentilha cozida", 93, 6.3, 16.3, 0.5, 577],
    tofu: ["Tofu", 64, 6.6, 2.1, 4, 584],
    chicken: ["Peito de frango grelhado, sem pele", 159, 32, 0, 2.5, 410],
    egg: ["Ovo inteiro cozido", 146, 13.3, 0.6, 9.5, 488],
    yogurt: ["Iogurte natural", 51, 4.1, 1.9, 3, 448],
    banana: ["Banana-prata, sem casca", 98, 1.3, 26, 0.1, 182],
    peanut: ["Amendoim cru", 544, 27.2, 20.3, 43.9, 557],
    pumpkin: ["Abóbora cabotiá cozida", 48, 1.4, 10.8, 0.7, 64],
    zucchini: ["Abobrinha italiana cozida", 15, 1.1, 3, 0.2, 70],
    broccoli: ["Brócolis cozido", 25, 2.1, 4.4, 0.5, 100],
    carrot: ["Cenoura cozida", 30, 0.8, 6.7, 0.2, 109],
    leaves: ["Alface crespa crua", 11, 1.3, 1.7, 0.2, 78],
    water: ["Água", 0, 0, 0, 0, 0],
  };
  const recipes = [
    {
      id: "breakfast-eggs",
      kind: "Café da manhã",
      name: "Ovos, arroz e banana",
      pattern: "vegetarian",
      tags: ["eggs"],
      minutes: 15,
      parts: [
        ["egg", 100, "2 ovos médios · sem casca"],
        ["rice", 100, "cerca de 4 colheres de sopa"],
        ["banana", 80, "1 unidade pequena · sem casca"],
      ],
      tip: "Use arroz já pronto e ovos cozidos. As medidas caseiras são aproximadas.",
    },
    {
      id: "breakfast-oats",
      kind: "Café da manhã",
      name: "Aveia, iogurte e banana",
      pattern: "vegetarian",
      tags: ["milk", "gluten"],
      minutes: 5,
      parts: [
        ["oats", 40, "cerca de 4 colheres de sopa"],
        ["yogurt", 170, "1 pote · confira o tamanho"],
        ["banana", 80, "1 unidade pequena · sem casca"],
      ],
      tip: "Misture na hora ou deixe na geladeira de um dia para o outro. Confira o rótulo da aveia.",
    },
    {
      id: "breakfast-plant",
      kind: "Café da manhã",
      name: "Aveia com banana e amendoim",
      pattern: "vegan",
      tags: ["gluten", "peanut"],
      minutes: 10,
      parts: [
        ["oats", 50, "cerca de 5 colheres de sopa"],
        ["banana", 100, "porção sem casca"],
        ["peanut", 20, "pequeno punhado"],
        ["water", 150, "para cozinhar a aveia"],
      ],
      tip: "Cozinhe a aveia com água e finalize com banana e amendoim. Pese a parte comestível.",
    },
    {
      id: "lunch-chicken",
      kind: "Almoço",
      name: "Arroz, feijão e frango",
      pattern: "omni",
      tags: [],
      minutes: 30,
      art: true,
      parts: [
        ["rice", 150, "cerca de 6 colheres de sopa"],
        ["beans", 100, "porção com caldo, conforme preparo"],
        ["chicken", 120, "1 filé médio · peso pronto"],
        ["broccoli", 80, "porção de legumes"],
        ["carrot", 60, "porção de legumes"],
      ],
      tip: "Os valores consideram as preparações listadas, sem óleo extra. Se usar azeite ou outro ingrediente, ele também conta.",
    },
    {
      id: "lunch-lentils",
      kind: "Almoço",
      name: "Arroz, lentilha e abóbora",
      pattern: "vegan",
      tags: [],
      minutes: 30,
      parts: [
        ["rice", 150, "cerca de 6 colheres de sopa"],
        ["lentils", 180, "porção já cozida"],
        ["pumpkin", 120, "porção já cozida"],
        ["leaves", 40, "folhas higienizadas"],
      ],
      tip: "A combinação de cereal e leguminosa amplia as fontes de proteína. Varie os vegetais e o tempero.",
    },
    {
      id: "lunch-eggs",
      kind: "Almoço",
      name: "Arroz, feijão e ovos",
      pattern: "vegetarian",
      tags: ["eggs"],
      minutes: 15,
      parts: [
        ["rice", 150, "cerca de 6 colheres de sopa"],
        ["beans", 150, "porção com caldo, conforme preparo"],
        ["egg", 100, "2 ovos médios · sem casca"],
        ["zucchini", 100, "porção já cozida"],
      ],
      tip: "Com arroz e feijão prontos, complete com ovos e abobrinha. Óleo ou molho adicionais mudam os valores.",
    },
    {
      id: "snack-yogurt",
      kind: "Lanche",
      name: "Iogurte com aveia",
      pattern: "vegetarian",
      tags: ["milk", "gluten"],
      minutes: 5,
      parts: [
        ["yogurt", 170, "1 pote · confira o tamanho"],
        ["oats", 30, "cerca de 3 colheres de sopa"],
        ["banana", 80, "1 unidade pequena · sem casca"],
      ],
      tip: "A fruta muda o sabor sem exigir outra preparação. Porções do rótulo podem ser diferentes.",
    },
    {
      id: "snack-banana",
      kind: "Lanche",
      name: "Banana e amendoim",
      pattern: "vegan",
      tags: ["peanut"],
      minutes: 5,
      parts: [
        ["banana", 100, "porção sem casca"],
        ["peanut", 25, "pequeno punhado"],
      ],
      tip: "Prático para levar. O amendoim concentra energia: tamanho do punhado faz diferença.",
    },
    {
      id: "snack-lentils",
      kind: "Lanche",
      name: "Pasta de lentilha e legumes",
      pattern: "vegan",
      tags: [],
      minutes: 15,
      parts: [
        ["lentils", 150, "porção já cozida"],
        ["carrot", 100, "porção já cozida"],
      ],
      tip: "Amasse a lentilha já cozida com um pouco da água do preparo. Tempere e sirva com cenoura.",
    },
    {
      id: "dinner-tofu",
      kind: "Jantar",
      name: "Arroz com tofu e legumes",
      pattern: "vegan",
      tags: ["soy"],
      minutes: 30,
      parts: [
        ["rice", 150, "cerca de 6 colheres de sopa"],
        ["tofu", 200, "porção escorrida"],
        ["broccoli", 100, "porção já cozida"],
        ["carrot", 80, "porção já cozida"],
      ],
      tip: "O teor de proteína do tofu varia por marca. Estes valores usam o tofu da tabela, não uma versão concentrada.",
    },
    {
      id: "dinner-chicken",
      kind: "Jantar",
      name: "Frango com arroz e abóbora",
      pattern: "omni",
      tags: [],
      minutes: 30,
      parts: [
        ["chicken", 100, "1 filé pequeno · peso pronto"],
        ["rice", 150, "cerca de 6 colheres de sopa"],
        ["pumpkin", 150, "porção já cozida"],
      ],
      tip: "Use o peso pronto do frango. Prepare a abóbora e aproveite arroz já cozido.",
    },
    {
      id: "dinner-soup",
      kind: "Jantar",
      name: "Feijão com legumes e arroz",
      pattern: "vegan",
      tags: [],
      minutes: 30,
      parts: [
        ["beans", 200, "porção já cozida"],
        ["rice", 120, "cerca de 5 colheres de sopa"],
        ["carrot", 100, "porção já cozida"],
        ["zucchini", 100, "porção já cozida"],
        ["water", 150, "caldo adicional"],
      ],
      tip: "A água altera o volume e a densidade energética da sopa, mas não acrescenta calorias.",
    },
  ];
  function totals(id, scale = 1) {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe || C.number(scale, 0.5, 2) === null) return null;
    const result = { energy: 0, protein: 0, carbs: 0, fat: 0, grams: 0 };
    for (const [key, g] of recipe.parts) {
      const f = foods[key],
        ratio = (g * scale) / 100;
      result.grams += g * scale;
      ["energy", "protein", "carbs", "fat"].forEach(
        (k, i) => (result[k] += f[i + 1] * ratio),
      );
    }
    result.density = result.energy / result.grams;
    return result;
  }
  function options(value) {
    const s = C.setup(value);
    if (
      s.context !== "general" ||
      !(s.age >= 18) ||
      s.allergy === "unknown" ||
      (s.allergy === "selected" &&
        (!s.avoids.length || s.avoids.includes("other")))
    )
      return [];
    return library(s);
  }
  function library(value) {
    const s = C.setup(value);
    return recipes.filter(
      (r) =>
        (s.pattern === "omni" ||
          r.pattern === "vegan" ||
          (s.pattern === "vegetarian" && r.pattern === "vegetarian")) &&
        (s.allergy !== "selected" ||
          !r.tags.some((t) => s.avoids.includes(t))) &&
        r.minutes <= Number(s.time),
    );
  }
  function menuTotals(menu, value) {
    const allowed = new Set(options(value).map((r) => r.id)),
      valid = menu.filter((x) => allowed.has(x.id));
    return valid.reduce(
      (out, x) => {
        const t = totals(x.id, x.scale);
        if (t)
          for (const k of ["energy", "protein", "carbs", "fat", "grams"])
            out[k] += t[k];
        return out;
      },
      {
        energy: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        grams: 0,
        count: valid.length,
      },
    );
  }
  function progress(meals, key, target) {
    const known = meals.filter(
      (m) =>
        m[key] !== null &&
        m[key] !== undefined &&
        m[key] !== "" &&
        typeof m[key] !== "boolean" &&
        Number.isFinite(Number(m[key])) &&
        Number(m[key]) >= 0,
    );
    const value = known.length
      ? known.reduce((sum, m) => sum + Number(m[key]), 0)
      : null;
    return {
      value,
      count: known.length,
      total: meals.length,
      ratio: value !== null && target > 0 ? Math.min(1, value / target) : 0,
    };
  }
  return {
    references,
    foods,
    recipes,
    totals,
    options,
    library,
    menuTotals,
    progress,
  };
})();
