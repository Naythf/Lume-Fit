import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const core = readFileSync(
  new URL("../app-ui/guide-core.js", import.meta.url),
  "utf8",
);
const ctx = vm.createContext({});
vm.runInContext(core, ctx);
const C = ctx.LumeGuideCore;
const plain = (v) => JSON.parse(JSON.stringify(v));
const base = {
  complete: true,
  age: 30,
  context: "general",
  height: 170,
  weight: 65,
  sex: "female",
  activity: "moderate",
  allergy: "none",
  pattern: "omni",
  time: "30",
};
test("private guide normalizes untrusted backup fields, optional zeros, dates and photos", () => {
  const photo = "data:image/jpeg;base64,YWJj";
  const raw = {
    setup: {
      ...base,
      age: "",
      weight: false,
      avoids: ["milk", "milk", "garbage"],
      notes: "x".repeat(400),
    },
    entries: [
      {
        id: "a",
        date: "2026-02-28",
        weight: "65,4",
        photos: [
          photo,
          "javascript:alert(1)",
          "data:image/svg+xml;base64,YWJj",
        ],
      },
      { id: "a", date: "2026-02-28", weight: 70 },
      { id: "b", date: "2026-02-30", weight: 50 },
      { id: "c", date: "2026-02-27", weight: null },
    ],
  };
  const clean = C.normalize(raw);
  assert.equal(clean.entries.length, 1);
  assert.equal(clean.entries[0].weight, 65.4);
  assert.deepEqual(plain(clean.entries[0].photos), [photo]);
  assert.equal(clean.setup.age, null);
  assert.equal(clean.setup.weight, null);
  assert.deepEqual(plain(clean.setup.avoids), ["milk"]);
  assert.equal(clean.setup.notes.length, 300);
  assert.deepEqual(
    plain(C.normalize(JSON.parse(JSON.stringify(clean)))),
    plain(clean),
  );
});
test("estimates require adult general context and stated equation; latest check-in takes priority without profile mutation", () => {
  assert.equal(C.metrics(base).energy, 2150);
  assert.ok(Math.abs(C.metrics(base).bmi - 22.49135) < 0.001);
  for (const context of ["unknown", "clinical", "pregnancy", "support"]) {
    const m = C.metrics({ ...base, context });
    assert.equal(m.energy, null);
    assert.equal(m.bmi, null);
  }
  assert.equal(C.metrics({ ...base, age: 17 }).energy, null);
  assert.equal(C.metrics({ ...base, sex: "unspecified" }).energy, null);
  assert.equal(C.metrics({ ...base, age: 80 }).energy, null);
  assert.equal(C.metrics({ ...base, weight: 20 }).energy, null);
  const entries = [
    { date: "2026-11-02", weight: 67 },
    { date: "2026-11-01", weight: 69 },
  ];
  const m = C.metrics(base, entries);
  assert.equal(m.weight, 67);
  assert.equal(m.weightDate, "2026-11-02");
  assert.equal(base.weight, 65);
  assert.equal(entries[0].weight, 67);
  assert.equal(
    C.metrics({ ...base, goal: "lose", target: 60 }, entries).delta,
    -7,
  );
});
test("meal suggestions respect every allergen combination, dietary pattern and preparation time; unknown restrictions pause", () => {
  const keys = Object.keys(C.choices.allergens).filter((x) => x !== "other");
  for (let mask = 0; mask < 2 ** keys.length; mask++) {
    const avoids = keys.filter((_, i) => mask & (2 ** i));
    for (const pattern of ["omni", "vegetarian", "vegan"]) {
      const options = C.mealOptions({
        ...base,
        pattern,
        allergy: avoids.length ? "selected" : "none",
        avoids,
        time: "15",
      });
      for (const m of options) {
        assert.ok(!m.tags.some((t) => avoids.includes(t)));
        assert.ok(m.minutes <= 15);
        if (pattern === "vegan") assert.equal(m.pattern, "vegan");
        if (pattern === "vegetarian") assert.notEqual(m.pattern, "omni");
      }
    }
  }
  for (const patch of [
    { allergy: "unknown" },
    { allergy: "selected", avoids: [] },
    { allergy: "selected", avoids: ["other"] },
    { context: "clinical" },
    { age: 17 },
  ])
    assert.equal(C.mealOptions({ ...base, ...patch }).length, 0);
});
test("density and weight comparisons never invent zero values or fat-loss claims", () => {
  assert.equal(C.density(100, 200), 0.5);
  assert.equal(C.density(0, 200), 0);
  assert.equal(C.density("", 200), null);
  assert.equal(C.density(100, 0), null);
  assert.equal(C.trend([]).delta, null);
  assert.equal(C.trend([{ date: "2026-01-01", weight: 50 }]).delta, null);
  assert.equal(
    C.trend([
      { date: "2026-11-02", weight: 67 },
      { date: "2026-11-01", weight: 69 },
    ]).delta,
    -2,
  );
});
test("packaged normalization preserves private guide through document export/import and leaves social projection unchanged", () => {
  const { html } = JSON.parse(
    readFileSync(
      new URL("../src/generated/packaged-web.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(
    html.includes(
      "out.profile.meuGuia=LumeGuideCore.normalize(out.profile.meuGuia)",
    ),
  );
  const app = html.match(
    /<script data-lume-source="app.js">([\s\S]*?)<\/script>/,
  )[1];
  const normalize = app.slice(
    app.indexOf("function normalizeDB"),
    app.indexOf("function normalizeFoodDiary"),
  );
  const box = vm.createContext({
    LumeGuideCore: C,
    initialData: () => ({ profile: {}, routines: [] }),
    normalizeFoodDiary: (v) => v || { meals: [] },
    normalizeSocialProfile: () => ({}),
    normalizeTrainingPreferences: () => ({}),
    normalizeFrequencyGoals: () => ({}),
  });
  vm.runInContext(normalize + ";globalThis.run=normalizeDB;", box);
  const data = {
    profile: {
      name: "Private",
      meuGuia: {
        setup: base,
        entries: [
          {
            id: "entry",
            date: "2026-11-13",
            weight: 65,
            photos: ["data:image/jpeg;base64,YWJj"],
            notes: "Private note",
          },
        ],
      },
    },
    sessions: [],
    routines: [],
    nutrition: { meals: [] },
  };
  assert.deepEqual(
    plain(box.run(JSON.parse(JSON.stringify(data))).profile.meuGuia),
    plain(C.normalize(data.profile.meuGuia)),
  );
  const social = readFileSync(
    new URL("../../social-profile.js", import.meta.url),
    "utf8",
  );
  assert.ok(!social.includes("meuGuia"));
});

function editorHarness() {
  let pending,
    closes = 0,
    saves = 0,
    serial = 0,
    fail = false,
    values = { date: "2026-11-13", weight: "65.4", notes: "Private" };
  const nodes = { sheet: { classList: { contains: () => true } } },
    bitmap = {
      width: 1200,
      height: 800,
      close() {
        closes++;
      },
    };
  const state = { db: { profile: { meuGuia: C.normalize({ setup: base }) } } };
  const box = vm.createContext({
    LumeGuideCore: C,
    window: {},
    state,
    renderKnowledge: null,
    studioChevron: () => "",
    uid: () => "new-entry-" + ++serial,
    esc: String,
    document: {
      getElementById: (id) => nodes[id] || null,
      createElement: () => ({
        getContext: () => ({ fillRect() {}, drawImage() {} }),
        toDataURL: () => "data:image/jpeg;base64,YWJj",
      }),
    },
    activityKey: () => "2026-11-13",
    openSheet() {
      for (const id of [
        "guideWeightForm",
        "guidePhotoGrid",
        "guidePhotos",
        "guidePhotoStatus",
        "guideWeightStatus",
        "guideWeightSave",
      ])
        nodes[id] = {};
    },
    closeSheet() {
      delete nodes.guideWeightForm;
    },
    toast() {},
    saveDB() {
      saves++;
      return !fail;
    },
    lumeConfirm: async () => true,
    FormData: class {
      constructor() {
        return new Map(Object.entries(values));
      }
    },
    createImageBitmap: () => new Promise((resolve) => (pending = resolve)),
  });
  box.window = box;
  vm.runInContext(
    readFileSync(new URL("../app-ui/guide.js", import.meta.url), "utf8"),
    box,
  );
  return {
    mod: box.window.LumeGuide,
    nodes,
    state,
    get saves() {
      return saves;
    },
    get closes() {
      return closes;
    },
    resolve() {
      pending(bitmap);
    },
    fail() {
      fail = true;
    },
    values(v) {
      values = v;
    },
  };
}
test("photo quotas reject an entire selection before decoding or saving", async () => {
  const h = editorHarness();
  h.mod.edit();
  await h.mod.receivePhotos({
    files: Array.from({ length: 5 }, () => ({ type: "image/jpeg", size: 100 })),
    value: "",
  });
  assert.match(h.nodes.guidePhotoStatus.textContent, /até 4 fotos/);
  assert.equal(h.saves, 0);
  const k = editorHarness(),
    photo = "data:image/jpeg;base64,YWJj";
  k.state.db.profile.meuGuia.entries = Array.from({ length: 5 }, (_, i) => ({
    id: "old-" + i,
    date: "2026-11-0" + (i + 1),
    weight: 65,
    photos: [photo, photo, photo, photo],
  }));
  k.mod.edit();
  await k.mod.receivePhotos({
    files: [{ type: "image/jpeg", size: 100 }],
    value: "",
  });
  assert.match(k.nodes.guidePhotoStatus.textContent, /no máximo 20/);
  assert.equal(k.saves, 0);
});
test("multiple photos commit only on explicit save, preserve existing records and rollback storage failure", async () => {
  const h = editorHarness();
  h.mod.edit();
  const input = {
    files: [
      { type: "image/jpeg", size: 100 },
      { type: "image/png", size: 100 },
    ],
    value: "selected",
  };
  const promise = h.mod.receivePhotos(input);
  assert.equal(h.nodes.guideWeightSave.disabled, true);
  h.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  h.resolve();
  await promise;
  assert.equal(h.closes, 2);
  assert.equal(h.state.db.profile.meuGuia.entries.length, 0);
  assert.equal(h.nodes.guideWeightSave.disabled, false);
  h.fail();
  h.mod.saveWeight({ preventDefault() {}, target: h.nodes.guideWeightForm });
  assert.equal(h.state.db.profile.meuGuia.entries.length, 0);
  assert.match(h.nodes.guideWeightStatus.textContent, /Sem espaço/);
  const k = editorHarness();
  k.mod.edit();
  const decode = k.mod.receivePhotos({
    files: [{ type: "image/jpeg", size: 100 }],
    value: "",
  });
  k.resolve();
  await decode;
  k.mod.saveWeight({ preventDefault() {}, target: k.nodes.guideWeightForm });
  assert.equal(k.state.db.profile.meuGuia.entries.length, 1);
  assert.equal(k.state.db.profile.meuGuia.entries[0].photos.length, 1);
  assert.equal(k.state.db.profile.weight, undefined);
  assert.equal(k.saves, 1);
});
test("late photo decode cannot write into another account or replacement editor; invalid batch is atomic", async () => {
  const h = editorHarness();
  h.mod.edit();
  const input = { files: [{ type: "image/jpeg", size: 100 }], value: "" };
  const pending = h.mod.receivePhotos(input);
  h.state.db = { profile: {} };
  h.resolve();
  await pending;
  assert.equal(h.closes, 1);
  assert.equal(h.state.db.profile.meuGuia, undefined);
  assert.equal(h.saves, 0);
  const k = editorHarness();
  k.mod.edit();
  const stale = k.mod.receivePhotos(input);
  k.mod.edit();
  const grid = k.nodes.guidePhotoGrid.innerHTML;
  k.resolve();
  await stale;
  assert.equal(k.nodes.guidePhotoGrid.innerHTML, grid);
  await k.mod.receivePhotos({
    files: [
      { type: "image/jpeg", size: 100 },
      { type: "image/svg+xml", size: 100 },
    ],
    value: "",
  });
  assert.match(k.nodes.guidePhotoStatus.textContent, /Nenhuma foto/);
  assert.equal(k.nodes.guideWeightSave.disabled, undefined);
});
test("duplicate-date and future check-ins are rejected without a write", () => {
  const h = editorHarness();
  h.mod.edit();
  h.mod.saveWeight({ preventDefault() {}, target: h.nodes.guideWeightForm });
  assert.equal(h.saves, 1);
  h.mod.edit();
  h.mod.saveWeight({ preventDefault() {}, target: h.nodes.guideWeightForm });
  assert.equal(h.saves, 1);
  assert.match(h.nodes.guideWeightStatus.textContent, /Já existe/);
  h.values({ date: "2026-11-14", weight: "66" });
  h.mod.saveWeight({ preventDefault() {}, target: h.nodes.guideWeightForm });
  assert.equal(h.saves, 1);
  assert.match(h.nodes.guideWeightStatus.textContent, /Confira/);
});
