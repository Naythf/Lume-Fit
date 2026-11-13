/* Offline recognition of explicit exclusions; never diagnoses or guesses unknown words. */
globalThis.LumeFoodRestrictions = (() => {
  const clean = (x) =>
    String(x || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const aliases = {
    milk: [
      "leite",
      "proteina do leite",
      "proteinas do leite",
      "caseina",
      "caseinato",
      "whey",
      "soro de leite",
      "laticinios",
      "queijo",
      "iogurte",
      "manteiga",
      "creme de leite",
    ],
    lactose: ["lactose"],
    eggs: ["ovo", "ovos", "albumina", "clara", "gema"],
    fish: ["peixe", "peixes", "atum", "sardinha", "salmao"],
    shellfish: ["camarao", "crustaceos", "moluscos", "mariscos"],
    peanut: ["amendoim"],
    nuts: [
      "castanha",
      "castanhas",
      "nozes",
      "amendoa",
      "avelã",
      "pistache",
      "macadamia",
      "peca",
      "pinoli",
    ],
    soy: ["soja", "tofu", "proteina de soja"],
    gluten: [
      "gluten",
      "celiaca",
      "celiaco",
      "doenca celiaca",
      "centeio",
      "cevada",
      "malte",
    ],
    wheat: ["trigo", "farinha de trigo"],
    oats: ["aveia"],
    corn: ["milho"],
    sesame: ["gergelim", "tahine"],
    mustard: ["mostarda"],
    celery: ["aipo", "salsao"],
    sulfites: ["sulfitos"],
    rice: ["arroz"],
    beans: ["feijao", "feijoes"],
    lentils: ["lentilha", "lentilhas"],
    chicken: ["frango", "galinha", "aves"],
    banana: ["banana", "bananas"],
    pumpkin: ["abobora", "cabotia"],
    zucchini: ["abobrinha"],
    broccoli: ["brocolis"],
    carrot: ["cenoura"],
    leaves: ["alface"],
    strawberry: ["morango"],
    tomato: ["tomate"],
    beef: ["carne bovina", "carne vermelha"],
    pork: ["porco", "carne suina"],
    garlic: ["alho"],
    onion: ["cebola"],
  };
  const labels = (k) =>
    LumeGuideCore.choices.allergens[k] ||
    {
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
      strawberry: "Morango",
      tomato: "Tomate",
      beef: "Carne bovina",
      pork: "Carne suína",
      garlic: "Alho",
      onion: "Cebola",
    }[k] ||
    k;
  function analyze(text) {
    const keys = new Set(),
      unknown = [];
    for (let part of String(text || "")
      .slice(0, 500)
      .split(/[,;\n]+|\s+e\s+/)) {
      part = clean(part).replace(
        /^(eu )?(nao posso (comer|ingerir|consumir)|nao (como|consumo)|evitar|evito|sem|alergia (a|ao)|intolerancia (a|ao)) /,
        "",
      );
      if (!part) continue;
      const found = Object.entries(aliases).find(([, words]) =>
        words.some((w) => clean(w) === part),
      );
      if (found) keys.add(found[0]);
      else unknown.push(part);
    }
    return { keys: [...keys], unknown };
  }
  function compatible(r, s) {
    const blocked = new Set([
      ...(s.allergy === "selected" ? s.avoids : []),
      ...analyze(s.avoidText).keys,
    ]);
    const tags = new Set(r.tags);
    const contains = r.parts.map((p) => p[0]);
    if (contains.includes("yogurt")) {
      tags.add("milk");
      tags.add("lactose");
    }
    if (contains.includes("oats")) {
      tags.add("oats");
      tags.add("gluten");
    }
    return (
      !contains.some((k) => blocked.has(k)) &&
      ![...tags].some((k) => blocked.has(k))
    );
  }
  function field(s) {
    return `<div class="field"><label for="guideAvoidText">Outros alimentos que não posso ou prefiro não comer</label><textarea id="guideAvoidText" name="avoidText" rows="3" maxlength="500" placeholder="Ex.: não posso ingerir leite; frango; banana">${esc(s.avoidText || "")}</textarea><small>Separe por vírgula ou ponto e vírgula. Vamos pedir sua revisão antes de salvar.</small></div>`;
  }
  async function review(s) {
    const a = analyze(s.avoidText),
      chosen = s.allergy === "selected" ? s.avoids.map(labels) : [];
    return await lumeConfirm(
      "Confira suas restrições",
      `Preferência: ${LumeGuideCore.choices.pattern[s.pattern]}. Evitar: ${[...new Set([...chosen, ...a.keys.map(labels)])].join(", ") || "nenhum alimento indicado"}. ${a.unknown.length ? "Não reconhecido: " + a.unknown.join(", ") + ". O planejamento personalizado fica pausado até esclarecer. " : ""}As informações estão corretas? Confira também rótulos, derivados e contaminação cruzada. Leite sem lactose ainda pode conter proteínas do leite.`,
    );
  }
  return { analyze, compatible, field, review, labels };
})();
