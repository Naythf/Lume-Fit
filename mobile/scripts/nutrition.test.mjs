import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const box = vm.createContext({});
for (const file of ["guide-core.js", "food-restrictions.js", "nutrition.js"])
  vm.runInContext(
    readFileSync(new URL("../app-ui/" + file, import.meta.url), "utf8"),
    box,
  );
const C = box.LumeGuideCore,
  N = box.LumeNutrition;
const base = {
  complete: true,
  age: 25,
  weight: 65,
  height: 170,
  sex: "male",
  context: "general",
  activity: "moderate",
  pattern: "omni",
  allergy: "none",
  time: "30",
  proteinMode: "training",
  energyMode: "maintain",
};
const plain = (x) => JSON.parse(JSON.stringify(x));
test("energy works at age 18 and unspecified physiology returns a transparent range, not no estimate", () => {
  assert.deepEqual(
    plain(N.references({ ...base, age: 18 }).energy),
    [2500, 2500],
  );
  const r = N.references({ ...base, sex: "unspecified", age: 30 });
  assert.deepEqual(plain(r.energy), [2150, 2450]);
  assert.equal(r.reason, "");
  assert.deepEqual(plain(r.protein), [91, 130]);
  assert.equal(r.proteinReference, 104);
  assert.deepEqual(plain(r.drinks), [1600, 2000]);
  const missing = N.references({ ...base, height: "" });
  assert.equal(missing.energy, null);
  assert.match(missing.reason, /altura/);
  assert.notEqual(missing.protein, null);
});
test("context, age, extreme BMI and conservative reduction limits are explicit; gain/lose scenarios do not mutate data", () => {
  for (const context of ["clinical", "pregnancy", "support", "unknown"]) {
    const r = N.references({ ...base, context });
    assert.equal(r.energy, null);
    assert.equal(r.protein, null);
    assert.equal(r.drinks, null);
    assert.ok(r.reason.length);
  }
  for (const age of [17, 79])
    assert.equal(N.references({ ...base, age }).energy, null);
  assert.equal(N.references({ ...base, weight: 20 }).energy, null);
  const gain = N.references({ ...base, energyMode: "gain" });
  assert.deepEqual(plain(gain.energy), [2700, 2700]);
  const low = N.references({
    ...base,
    sex: "female",
    weight: 45,
    height: 150,
    activity: "sedentary",
    energyMode: "lose",
  });
  assert.equal(low.adjustmentBlocked, true);
  assert.deepEqual(plain(low.energy), plain(low.maintenance));
  assert.equal(base.energyMode, "maintain");
});
test("macronutrient chart conserves energy and percentages across supported profiles", () => {
  let verified = 0;
  for (const age of [18, 25, 45, 70])
    for (const weight of [45, 65, 85, 105])
      for (const height of [150, 170, 190])
        for (const sex of ["male", "female", "unspecified"])
          for (const activity of Object.keys(C.choices.activity))
            for (const proteinMode of ["daily", "training"]) {
              const r = N.references({
                  ...base,
                  age,
                  weight,
                  height,
                  sex,
                  activity,
                  proteinMode,
                }),
                m = r.macros;
              if (!m) continue;
              assert.ok(
                Math.abs(m.protein * 4 + m.carbs * 4 + m.fat * 9 - m.kcal) <
                  1e-7,
              );
              assert.ok(
                Math.abs(m.percent.reduce((sum, n) => sum + n, 0) - 100) < 1e-7,
              );
              assert.ok(m.carbs >= 0 && m.fat >= 0 && m.protein >= 0);
              assert.ok(m.percent[1] >= 45 - 1e-7);
              assert.ok(m.percent[2] >= 20 - 1e-7 && m.percent[2] <= 30 + 1e-7);
              verified++;
            }
  assert.ok(verified > 500);
});
test("verified food preparations and portion scaling use ingredient weights, never illustration size", () => {
  const t = N.totals("lunch-chicken", 1);
  assert.ok(Math.abs(t.energy - 496.8) < 1e-9);
  assert.ok(Math.abs(t.protein - 49.11) < 1e-9);
  assert.equal(N.foods.chicken[5], 410);
  const doubled = N.totals("lunch-chicken", 2);
  for (const key of ["energy", "protein", "carbs", "fat", "grams"])
    assert.ok(Math.abs(doubled[key] - t[key] * 2) < 1e-9);
  assert.equal(doubled.density, t.density);
  assert.equal(N.totals("unknown"), null);
  assert.equal(N.totals("lunch-chicken", 0), null);
  for (const recipe of N.recipes) {
    assert.ok(recipe.parts.every(([id, g]) => N.foods[id] && g > 0));
    assert.ok(N.totals(recipe.id).protein >= 0);
  }
});
test("allergen/pattern/time filters also apply to saved menu totals after preferences change", () => {
  const vegan = N.options({
    ...base,
    pattern: "vegan",
    allergy: "selected",
    avoids: ["soy", "peanut", "gluten"],
    time: "30",
  });
  assert.ok(vegan.length > 0);
  for (const r of vegan) {
    assert.equal(r.pattern, "vegan");
    assert.ok(!r.tags.some((x) => ["soy", "peanut", "gluten"].includes(x)));
  }
  const menu = [
    { id: "lunch-chicken", scale: 1 },
    { id: "dinner-tofu", scale: 1.5 },
  ];
  const totals = N.menuTotals(menu, { ...base, pattern: "vegan" });
  assert.equal(totals.count, 1);
  assert.equal(totals.energy, N.totals("dinner-tofu", 1.5).energy);
  assert.equal(N.options({ ...base, allergy: "unknown" }).length, 0);
  assert.equal(
    N.options({ ...base, allergy: "selected", avoids: ["other"] }).length,
    0,
  );
});
test("educational food portions stay readable without optional disclosure, while a personal menu requires confirmed context and restrictions", () => {
  const value = { ...base, context: "unknown", allergy: "unknown" };
  assert.equal(N.options(value).length, 0);
  assert.ok(N.library(value).length > 0);
  const filtered = N.library({
    ...value,
    pattern: "vegan",
    allergy: "selected",
    avoids: ["soy", "peanut", "gluten"],
  });
  assert.ok(filtered.length > 0);
  for (const recipe of filtered)
    assert.ok(
      !recipe.tags.some((t) => ["soy", "peanut", "gluten"].includes(t)),
    );
});
test("diary progress distinguishes unknown from genuine zero and never claims complete coverage", () => {
  assert.deepEqual(plain(N.progress([], "protein", 104)), {
    value: null,
    count: 0,
    total: 0,
    ratio: 0,
  });
  assert.deepEqual(
    plain(
      N.progress(
        [{ protein: 0 }, { protein: null }, { protein: 26 }],
        "protein",
        104,
      ),
    ),
    { value: 26, count: 2, total: 3, ratio: 0.25 },
  );
  assert.equal(N.progress([{ protein: 200 }], "protein", 104).ratio, 1);
  assert.equal(
    N.progress([{ protein: "" }, { protein: false }], "protein", 104).value,
    null,
  );
});
test("future or invalid imported weight cannot change nutrition references and is not deleted from the backup", () => {
  const data = C.normalize({
    setup: base,
    entries: [
      { id: "valid", date: "2020-01-01", weight: 67 },
      { id: "future", date: "9999-01-01", weight: 120 },
    ],
  });
  const r = N.references(data.setup, data.entries);
  assert.equal(r.weight, 67);
  assert.equal(r.weightDate, "2020-01-01");
  assert.equal(data.entries.length, 2);
});
test("private water and meal drafts survive normalization and backup without losing photos or weight", () => {
  const data = {
    setup: base,
    water: [
      { date: "2026-11-13", ml: "250,5" },
      { date: "2026-02-30", ml: 200 },
      { date: "2026-11-12", ml: -5 },
    ],
    menu: [
      { id: "lunch-chicken", scale: "1,5" },
      { id: 'unsafe"', scale: 1 },
    ],
    entries: [
      {
        id: "weight",
        date: "2026-11-13",
        weight: 65,
        photos: ["data:image/jpeg;base64,YWJj"],
      },
    ],
  };
  const clean = C.normalize(data);
  assert.equal(clean.water.length, 1);
  assert.equal(clean.water[0].ml, 250.5);
  assert.equal(clean.menu[0].scale, 1.5);
  assert.equal(clean.menu.length, 1);
  assert.equal(clean.entries[0].photos.length, 1);
  assert.deepEqual(
    plain(C.normalize(JSON.parse(JSON.stringify(clean)))),
    plain(clean),
  );
});
test("visual guide exposes calculated quantities, ingredients and one chevron, without external links or source wall", () => {
  box.window = box;
  box.state = { db: { nutrition: { meals: [] } } };
  box.activityKey = () => "2026-11-13";
  box.esc = (s) => String(s).replaceAll("<", "&lt;");
  vm.runInContext(
    readFileSync(
      new URL("../app-ui/nutrition-views.js", import.meta.url),
      "utf8",
    ),
    box,
  );
  const data = C.normalize({ setup: base });
  const html =
    box.LumeGuideVisual.summary(data) +
    box.LumeGuideVisual.food(data, {
      kind: "Almoço",
      recipe: "lunch-chicken",
      scale: 1,
    });
  assert.match(html, /2\.450/);
  assert.match(html, /91–130/);
  assert.match(html, /Proteínas/);
  assert.match(html, /120/);
  assert.doesNotMatch(html, /https?:|<a\b|Fontes e limites/);
  const fold = box.LumeGuideVisual.fold("Example", "Content");
  assert.equal((fold.match(/guide-disclosure-chevron/g) || []).length, 1);
  assert.doesNotMatch(fold, />\+</);
});
test("water and meal changes are private, reversible, bounded and atomic when storage fails", () => {
  const state = { db: { profile: { meuGuia: C.normalize({ setup: base }) } } };
  let writes = 0,
    fail = false;
  const ui = vm.createContext({
    LumeGuideCore: C,
    LumeNutrition: N,
    state,
    renderKnowledge: null,
    document: { getElementById: () => null, querySelector: () => null },
    saveDB: () => {
      writes++;
      return !fail;
    },
    toast() {},
    activityKey: () => "2026-11-13",
    studioChevron: () => "",
    esc: String,
  });
  ui.window = ui;
  vm.runInContext(
    readFileSync(new URL("../app-ui/guide.js", import.meta.url), "utf8"),
    ui,
  );
  const mod = ui.LumeGuide;
  mod.water(250);
  assert.equal(state.db.profile.meuGuia.water[0].ml, 250);
  mod.water(-250);
  assert.equal(state.db.profile.meuGuia.water[0].ml, 0);
  for (let i = 0; i < 50; i++) mod.water(250);
  assert.equal(state.db.profile.meuGuia.water[0].ml, 10000);
  mod.addMenu("lunch-chicken", 1);
  mod.addMenu("lunch-eggs", 1.5);
  assert.equal(state.db.profile.meuGuia.menu.length, 1);
  assert.equal(state.db.profile.meuGuia.menu[0].id, "lunch-eggs");
  const before = JSON.stringify(state.db);
  fail = true;
  mod.water(-250);
  mod.addMenu("dinner-tofu", 1);
  assert.equal(JSON.stringify(state.db), before);
  fail = false;
  const count = writes;
  state.db = { profile: {} };
  mod.water(250);
  mod.addMenu("lunch-chicken", 1);
  assert.equal(writes, count);
  assert.equal(state.db.profile.meuGuia, undefined);
});

test("explicit food text and separate lactose/milk exclusions constrain recipes without guessing unknowns", () => {
  const R = box.LumeFoodRestrictions;
  assert.deepEqual(
    Array.from(R.analyze("não posso ingerir leite; FRANGO; banana").keys),
    ["milk", "chicken", "banana"],
  );
  assert.equal(
    N.library({ ...base, avoidText: "não posso ingerir frango" }).some((r) =>
      r.parts.some((p) => p[0] === "chicken"),
    ),
    false,
  );
  assert.equal(
    N.library({ ...base, avoidText: "lactose" }).some((r) =>
      r.parts.some((p) => p[0] === "yogurt"),
    ),
    false,
  );
  assert.equal(
    N.options({ ...base, avoidText: "ingrediente desconhecido" }).length,
    0,
  );
  assert.ok(R.analyze("posso consumir leite").unknown.length);
  const d = C.normalize({
    setup: { ...base, avoidText: "banana" },
    routines: [
      {
        id: "plan1",
        name: "Semana",
        days: [1, 1, 8],
        menu: [{ id: "lunch-chicken", scale: 1 }],
      },
    ],
  });
  assert.deepEqual(Array.from(d.routines[0].days), [1]);
  assert.equal(d.setup.avoidText, "banana");
  assert.equal(d.routines[0].menu[0].scale, 1);
});

test("independent routine ingredient weights survive backups and totals scale without a global menu", () => {
  box.window = {};
  box.LumeFoodPlan = {};
  vm.runInContext(
    readFileSync(
      new URL("../app-ui/food-composer.js", import.meta.url),
      "utf8",
    ),
    box,
  );
  const f = box.window.FoodComposer;
  assert.equal(f.total([{ parts: [["rice", 150]] }]).energy, 192);
  assert.equal(f.total([{ parts: [["rice", 300]] }]).energy, 384);
  const d = C.normalize({
    routines: [
      {
        id: "independent",
        name: "Semana",
        meals: [
          {
            kind: "Almoço",
            time: "12:30",
            parts: [
              ["rice", 150],
              ["egg", 100],
            ],
          },
        ],
      },
    ],
  });
  assert.equal(d.routines[0].meals[0].time, "12:30");
  assert.equal(d.routines[0].meals[0].parts[0][1], 150);
  assert.equal(
    C.normalize(JSON.parse(JSON.stringify(d))).routines[0].meals[0].parts
      .length,
    2,
  );
  assert.equal(
    C.normalize({
      routines: [
        {
          id: "x",
          meals: [
            {
              parts: [
                ["rice", -5],
                ["egg", 999999],
              ],
            },
          ],
        },
      ],
    }).routines[0].meals[0].parts.length,
    0,
  );
});
