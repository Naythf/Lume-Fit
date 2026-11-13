/* Private guide domain. No requests, inferred diagnoses or image analysis. */
globalThis.LumeGuideCore = (() => {
  const limits = {
    photosPerEntry: 4,
    photosTotal: 20,
    photoLength: 120000,
    entries: 1000,
  };
  const choices = {
    goal: {
      understand: "Conhecer meus hábitos",
      train: "Apoiar meus treinos",
      maintain: "Manter meu peso",
      gain: "Acompanhar ganho de peso",
      lose: "Acompanhar perda de peso",
    },
    context: {
      unknown: "Prefiro não informar",
      general: "Nenhuma dessas situações",
      pregnancy: "Gestação ou amamentação",
      clinical: "Condição de saúde, medicação ou dieta orientada",
      support: "Contar calorias ou me pesar me causa desconforto",
    },
    pattern: {
      omni: "Como de tudo",
      vegetarian: "Vegetariana · com ovos e leite",
      vegan: "Vegetal · sem alimentos de origem animal",
    },
    allergy: {
      unknown: "Prefiro não informar",
      none: "Não tenho restrições conhecidas",
      selected: "Quero indicar alimentos a evitar",
    },
    allergens: {
      milk: "Proteínas do leite",
      lactose: "Lactose",
      wheat: "Trigo",
      oats: "Aveia",
      corn: "Milho",
      mustard: "Mostarda",
      celery: "Aipo / salsão",
      sulfites: "Sulfitos",
      eggs: "Ovos",
      fish: "Peixes",
      shellfish: "Crustáceos e moluscos",
      peanut: "Amendoim",
      nuts: "Castanhas e nozes",
      soy: "Soja",
      gluten: "Glúten",
      sesame: "Gergelim",
      rice: "Arroz",
      beans: "Feijão",
      lentils: "Lentilha",
      chicken: "Frango",
      banana: "Banana",
      pumpkin: "Abóbora",
      zucchini: "Abobrinha",
      broccoli: "Brócolis",
      carrot: "Cenoura",
      leaves: "Alface",
      other: "Outra restrição / alergia",
    },
    activity: {
      sedentary: "Pouco movimento no dia",
      light: "Atividade leve",
      moderate: "Atividade moderada",
      active: "Atividade intensa",
    },
    sex: {
      unspecified: "Usar uma faixa entre as duas referências",
      female: "Referência feminina",
      male: "Referência masculina",
    },
    proteinMode: { daily: "Dia a dia", training: "Treino regular" },
    energyMode: {
      maintain: "Manutenção",
      gain: "Ganho gradual · +10%",
      lose: "Redução leve · −10%",
    },
    time: {
      15: "Até 15 minutos",
      30: "Até 30 minutos",
      60: "Tenho mais tempo",
    },
  };
  const text = (v, length) =>
    String(v ?? "")
      .trim()
      .slice(0, length);
  const choice = (key, v, fallback) =>
    Object.hasOwn(choices[key], v) ? v : fallback;
  function number(v, min, max) {
    if (v === "" || v === null || v === undefined || typeof v === "boolean")
      return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  }
  function date(v) {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = new Date(v + "T12:00:00Z");
    return Number.isFinite(+d) && d.toISOString().slice(0, 10) === v;
  }
  const photo = (v) =>
    typeof v === "string" &&
    v.length <= limits.photoLength &&
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v)
      ? v
      : "";
  function setup(v = {}) {
    v = v && typeof v === "object" ? v : {};
    return {
      complete: v.complete === true,
      goal: choice("goal", v.goal, "understand"),
      context: choice("context", v.context, "unknown"),
      age: number(v.age, 1, 110),
      weight: number(v.weight, 20, 400),
      height: number(v.height, 100, 250),
      target: number(v.target, 20, 400),
      sex: choice("sex", v.sex, "unspecified"),
      proteinMode: choice(
        "proteinMode",
        v.proteinMode,
        v.goal === "train" ? "training" : "daily",
      ),
      energyMode: choice("energyMode", v.energyMode, "maintain"),
      activity: choice("activity", v.activity, "moderate"),
      pattern: choice("pattern", v.pattern, "omni"),
      allergy: choice("allergy", v.allergy, "unknown"),
      avoids: [
        ...new Set(
          Array.isArray(v.avoids)
            ? v.avoids.filter((x) => Object.hasOwn(choices.allergens, x))
            : [],
        ),
      ],
      time: choice("time", v.time, "30"),
      avoidText: text(v.avoidText, 500),
      notes: text(v.notes, 300),
    };
  }
  function normalize(v) {
    const ids = new Set(),
      entries = [];
    for (const raw of Array.isArray(v?.entries) ? v.entries : []) {
      if (
        !raw ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(raw.id || "") ||
        ids.has(raw.id) ||
        !date(raw.date)
      )
        continue;
      const weight = number(raw.weight, 20, 400);
      if (weight === null) continue;
      ids.add(raw.id);
      entries.push({
        id: raw.id,
        date: raw.date,
        weight,
        notes: text(raw.notes, 500),
        photos: (Array.isArray(raw.photos) ? raw.photos : [])
          .map(photo)
          .filter(Boolean)
          .slice(0, limits.photosPerEntry),
      });
    }
    return {
      version: 1,
      routines: (Array.isArray(v?.routines) ? v.routines : [])
        .filter((x) => x && /^[a-zA-Z0-9_-]{1,80}$/.test(x.id || ""))
        .slice(0, 50)
        .map((x) => ({
          id: x.id,
          name: text(x.name, 80) || "Minha rotina",
          days: [
            ...new Set(
              (Array.isArray(x.days) ? x.days : []).filter(
                (d) => Number.isInteger(d) && d >= 0 && d <= 6,
              ),
            ),
          ],
          menu: (Array.isArray(x.menu) ? x.menu : [])
            .filter(
              (m) =>
                m &&
                /^[a-z0-9-]{1,60}$/.test(m.id || "") &&
                number(m.scale, 0.5, 2) !== null,
            )
            .slice(0, 8)
            .map((m) => ({ id: m.id, scale: number(m.scale, 0.5, 2) })),
        })),
      setup: setup(v?.setup),
      water: (Array.isArray(v?.water) ? v.water : [])
        .filter((x) => x && date(x.date) && number(x.ml, 0, 10000) !== null)
        .map((x) => ({ date: x.date, ml: number(x.ml, 0, 10000) }))
        .filter((x, i, a) => a.findIndex((y) => y.date === x.date) === i),
      menu: (Array.isArray(v?.menu) ? v.menu : [])
        .filter(
          (x) =>
            x &&
            /^[a-z0-9-]{1,60}$/.test(x.id || "") &&
            number(x.scale, 0.5, 2) !== null,
        )
        .map((x) => ({ id: x.id, scale: number(x.scale, 0.5, 2) }))
        .slice(0, 8),
      entries: entries.sort(
        (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
      ),
    };
  }
  function metrics(s, entries = []) {
    s = setup(s);
    const latest = trend(entries).last;
    const weight = latest?.weight ?? s.weight;
    const eligible = s.context === "general" && s.age >= 18 && s.age <= 100;
    const bmi =
      eligible && weight && s.height ? weight / (s.height / 100) ** 2 : null;
    // Mifflin-St Jeor estimates resting energy. Activity multiplier is a separate approximation.
    const factor = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    }[s.activity];
    const energy =
      eligible &&
      s.age >= 19 &&
      s.age <= 78 &&
      bmi >= 18.5 &&
      bmi <= 40 &&
      s.sex !== "unspecified"
        ? Math.round(
            ((10 * weight +
              6.25 * s.height -
              5 * s.age +
              (s.sex === "male" ? 5 : -161)) *
              factor) /
              50,
          ) * 50
        : null;
    const delta =
      weight && s.target && ["gain", "lose"].includes(s.goal)
        ? s.target - weight
        : null;
    return {
      eligible,
      weight,
      weightDate: latest?.date || "",
      bmi,
      energy,
      delta,
      factor,
    };
  }
  const meals = [
    {
      id: "cuscuz",
      name: "Cuscuz, ovos e fruta",
      kind: "Café da manhã",
      foods: ["Cuscuz de milho", "Ovos", "Fruta da estação"],
      tags: ["eggs"],
      pattern: "vegetarian",
      minutes: 15,
      tip: "Prepare o cuscuz no vapor e os ovos como preferir. A fruta acrescenta variedade.",
      why: "Cereal + fonte de proteína + fruta.",
    },
    {
      id: "aveia",
      name: "Aveia com banana",
      kind: "Café da manhã",
      foods: ["Aveia", "Banana", "Leite"],
      tags: ["milk", "gluten"],
      pattern: "vegetarian",
      minutes: 10,
      tip: "Cozinhe a aveia no leite ou deixe de molho na geladeira. Confira o rótulo da aveia se precisar evitar glúten.",
      why: "Cereal + fruta + fonte de proteína.",
    },
    {
      id: "pasta",
      name: "Tapioca com pasta de feijão",
      kind: "Café da manhã",
      foods: [
        "Goma de tapioca",
        "Feijão cozido amassado",
        "Tomate",
        "Fruta da estação",
      ],
      tags: [],
      pattern: "vegan",
      minutes: 15,
      tip: "Use feijão já cozido e temperos de casa para um recheio simples. A goma não substitui as fibras do feijão.",
      why: "Raiz + leguminosa + fruta.",
    },
    {
      id: "arroz",
      name: "O clássico do dia a dia",
      kind: "Almoço",
      foods: ["Arroz", "Feijão", "Frango", "Legumes e folhas"],
      tags: [],
      pattern: "omni",
      minutes: 30,
      tip: "Use arroz e feijão já preparados e varie os legumes conforme a estação.",
      why: "Cereal + leguminosa + proteína + vegetais.",
    },
    {
      id: "lentilha",
      name: "Arroz com lentilha e abóbora",
      kind: "Almoço",
      foods: ["Arroz", "Lentilha", "Abóbora", "Couve"],
      tags: [],
      pattern: "vegan",
      minutes: 30,
      tip: "Cozinhe uma quantidade extra de lentilha e congele porções para outros dias.",
      why: "Cereal + leguminosa + dois vegetais.",
    },
    {
      id: "omelete",
      name: "Arroz, feijão e omelete",
      kind: "Almoço",
      foods: ["Arroz", "Feijão", "Ovos", "Tomate e folhas"],
      tags: ["eggs"],
      pattern: "vegetarian",
      minutes: 15,
      tip: "Com arroz e feijão prontos, prepare uma omelete com os vegetais que tiver.",
      why: "Uma combinação familiar, com ovos e leguminosas.",
    },
    {
      id: "iogurte",
      name: "Iogurte, fruta e aveia",
      kind: "Lanche",
      foods: ["Iogurte natural", "Fruta", "Aveia"],
      tags: ["milk", "gluten"],
      pattern: "vegetarian",
      minutes: 5,
      tip: "Misture na hora de comer. Escolha o sabor pela fruta e confira os ingredientes do iogurte.",
      why: "Fruta + cereal + fonte de proteína.",
    },
    {
      id: "grao",
      name: "Pasta de grão-de-bico e legumes",
      kind: "Lanche",
      foods: ["Grão-de-bico cozido", "Cenoura", "Pepino", "Azeite"],
      tags: [],
      pattern: "vegan",
      minutes: 15,
      tip: "Amasse o grão-de-bico com água, limão e um pouco de azeite. Esta versão não leva tahine.",
      why: "Leguminosa + vegetais; pode acompanhar outra preparação.",
    },
    {
      id: "banana",
      name: "Banana com amendoim",
      kind: "Lanche",
      foods: ["Banana", "Amendoim sem sal"],
      tags: ["peanut"],
      pattern: "vegan",
      minutes: 5,
      tip: "Uma opção prática quando há pouco tempo. Ajuste a quantidade à sua fome e ao restante do dia.",
      why: "Fruta + oleaginosa, que concentra energia.",
    },
    {
      id: "sopa",
      name: "Sopa de feijão com legumes",
      kind: "Jantar",
      foods: ["Feijão", "Batata", "Cenoura", "Couve"],
      tags: [],
      pattern: "vegan",
      minutes: 30,
      tip: "Use feijão já cozido. Coloque a couve no final e sirva como uma preparação completa, com os grãos.",
      why: "Leguminosa + tubérculo + vegetais.",
    },
    {
      id: "peixe",
      name: "Peixe, mandioca e salada",
      kind: "Jantar",
      foods: ["Peixe", "Mandioca", "Folhas e tomate"],
      tags: ["fish"],
      pattern: "omni",
      minutes: 30,
      tip: "Cozinhe a mandioca e asse ou grelhe o peixe. Varie as folhas disponíveis.",
      why: "Fonte de proteína + raiz + vegetais.",
    },
    {
      id: "tofu",
      name: "Arroz com tofu e legumes",
      kind: "Jantar",
      foods: ["Arroz", "Tofu", "Brócolis", "Cenoura"],
      tags: ["soy"],
      pattern: "vegan",
      minutes: 30,
      tip: "Doure o tofu e misture aos legumes. Confira os ingredientes dos temperos prontos.",
      why: "Cereal + proteína vegetal + vegetais.",
    },
  ];
  function mealOptions(value) {
    const s = setup(value);
    if (
      s.context !== "general" ||
      !(s.age >= 18) ||
      s.allergy === "unknown" ||
      (s.allergy === "selected" &&
        (!s.avoids.length || s.avoids.includes("other")))
    )
      return [];
    return meals.filter(
      (m) =>
        (s.pattern === "omni" ||
          m.pattern === "vegan" ||
          (s.pattern === "vegetarian" && m.pattern === "vegetarian")) &&
        (s.allergy !== "selected" ||
          !m.tags.some((t) => s.avoids.includes(t))) &&
        m.minutes <= Number(s.time),
    );
  }
  function trend(entries) {
    const ordered = entries
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    return {
      first: ordered[0] || null,
      last: ordered.at(-1) || null,
      delta:
        ordered.length > 1 ? ordered.at(-1).weight - ordered[0].weight : null,
    };
  }
  const density = (kcal, grams) => {
    const e = number(kcal, 0, 100000),
      g = number(grams, 0.1, 100000);
    return e === null || g === null ? null : e / g;
  };
  return {
    limits,
    choices,
    number,
    date,
    photo,
    setup,
    normalize,
    metrics,
    meals,
    mealOptions,
    trend,
    density,
  };
})();
