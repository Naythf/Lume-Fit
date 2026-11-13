import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { muscleZone } from "../app-ui/muscle-zones.js";
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const art = JSON.parse(read("../assets/exercise-art/manifest.json"));
const context = vm.createContext({ LUME_EXERCISE_ART: art });
vm.runInContext(read("../../exercise-catalog.js"), context);
const media = read("../app-ui/exercise-art.js");
vm.runInContext(
  media.slice(0, media.indexOf("const studioEquipmentGraphic")),
  context,
);
const lookup = (item) =>
  vm.runInContext(`studioArtId(${JSON.stringify(item)})`, context);
test("movement artwork matches exact catalog variants and does not guess incompatible equipment", () => {
  assert.equal(
    lookup({ name: "Flexão com joelhos apoiados", catalogId: "knee-push" }),
    "knee-push-ups",
  );
  assert.equal(
    lookup({ name: "Supino no chão com halteres", catalogId: "db-floor" }),
    "dumbbell-floor-press",
  );
  assert.equal(
    lookup({ name: "Rosca com halteres", catalogId: "db-curl" }),
    "bicep-curl",
  );
  for (const name of [
    "Rosca direta com barra",
    "Remada com elástico",
    "Elevação de braços em W deitado",
    "Movimento personalizado",
    "Rosca com elástico",
  ])
    assert.equal(lookup({ name }), "");
  assert.equal(
    lookup({ name: "Remada com elástico", catalogId: "db-row" }),
    "",
  );
  assert.equal(
    lookup({ name: "Variação própria", icon: "repdb:incline-bench-press" }),
    "incline-bench-press",
  );
  assert.equal(
    lookup({ name: "Desconhecido", icon: 'repdb:\" onerror=alert(1)' }),
    "",
  );
});
test("all mapped illustrations are local licensed files with a visible in-app credit", () => {
  assert.equal(art["incline-bench-press"].frames.length, 1);
  assert.equal(art["banded-standing-curl"], undefined);
  const mapped = vm.runInContext("Object.values(studioCatalogArt)", context);
  for (const id of mapped) assert.ok(art[id], id);
  for (const entry of Object.values(art))
    for (const file of entry.frames) {
      assert.match(file, /^[a-z0-9-]+\.webp$/);
      assert.ok(
        fs.statSync(new URL("../assets/exercise-art/" + file, import.meta.url))
          .size > 100,
      );
    }
  const { html } = JSON.parse(read("../src/generated/packaged-web.json"));
  assert.ok(html.includes("Exercise data by RepDB (repdb.co)"));
  assert.ok(html.includes("data:font/ttf;base64,"));
  assert.ok(!html.includes("QA offline isolado"));
});
test("body surface separates anterior and posterior muscle regions", () => {
  assert.equal(muscleZone(0.02, 0.72, 0.07), "chest");
  assert.equal(muscleZone(0.02, 0.72, -0.07), "back");
  assert.equal(muscleZone(0.27, 0.73, 0.04), "biceps");
  assert.equal(muscleZone(0.27, 0.73, -0.04), "triceps");
  assert.equal(muscleZone(0.05, 0.3, 0.02), "quads");
  assert.equal(muscleZone(0.05, 0.3, -0.02), "hamstrings");
  assert.equal(muscleZone(0, 0.95, 0), "");
});

test("custom dates commit through existing callbacks and respect min/max constraints", () => {
  const events = [];
  let closed = 0;
  const input = {
    isConnected: true,
    min: "2026-11-01",
    max: "2026-11-30",
    value: "2026-11-12",
    dispatchEvent: (e) => events.push(e.type),
  };
  const ctx = vm.createContext({
    studioDateOwner: { input },
    studioCalendar: { close: () => closed++ },
    Event: class {
      constructor(type) {
        this.type = type;
      }
    },
  });
  const code = read("../app-ui/studio.js"),
    start = code.indexOf("function studioSetDay(");
  vm.runInContext(
    code.slice(start, code.indexOf("\nstudioEnhance();", start)),
    ctx,
  );
  vm.runInContext("studioSetDay('2026-10-31')", ctx);
  assert.equal(input.value, "2026-11-12");
  assert.equal(closed, 0);
  vm.runInContext("studioSetDay('2026-11-20')", ctx);
  assert.equal(input.value, "2026-11-20");
  assert.deepEqual(events, ["input", "change"]);
  assert.equal(closed, 1);
  input.isConnected = false;
  vm.runInContext("studioSetDay('2026-11-21')", ctx);
  assert.equal(input.value, "2026-11-20");
});

test("header periods and dates follow local device time at their boundaries", () => {
  const ctx = vm.createContext({ Date });
  vm.runInContext(read("../app-ui/studio-context.js"), ctx);
  for (const [hour, period] of [
    [0, "Noite"],
    [4, "Noite"],
    [5, "Manhã"],
    [11, "Manhã"],
    [12, "Tarde"],
    [17, "Tarde"],
    [18, "Noite"],
    [23, "Noite"],
  ]) {
    const result = vm.runInContext(
      `studioDayContext(new Date(2026,10,12,${hour},0))`,
      ctx,
    );
    assert.equal(result.period, period);
    assert.equal(result.iso, "2026-11-12");
    assert.equal(result.weekday, "quinta-feira");
  }
});
test("hero photography is embedded offline and credit remains accessible from settings", () => {
  const { html } = JSON.parse(read("../src/generated/packaged-web.json"));
  assert.ok(html.includes("data-studio-hero"));
  assert.ok(
    !html.includes("__HERO_RACK__") && !html.includes("__HERO_BARBELL__"),
  );
  const app = read("../app-ui/studio.js");
  assert.ok(app.includes("Sobre e créditos"));
  assert.ok(!app.includes("studioFooter.append"));
  assert.match(html, /Pausar troca automática de fotos/);
});

test("home greeting uses the saved profile name as escaped text", () => {
  const target = { innerHTML: "" };
  const ctx = vm.createContext({
    Date,
    state: {
      db: {
        profile: { name: "Ana <b>Maria</b>" },
        routines: [],
        sessions: [],
        nutrition: { meals: [] },
      },
      activeWorkout: null,
    },
    document: { getElementById: () => target },
    activitySessions: () => [],
    getMonthSessions: () => [],
    frequencyPct: () => null,
    allExercises: () => [],
    studioHeroFrames: () => "",
    studioHeroControls: () => "",
    studioActionIcon: () => "",
    weeklyActivityCard: () => "",
    foodDiaryIcon: () => "",
    activityKey: () => "",
    esc: (s) =>
      String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;"),
  });
  const source = read("../app-ui/studio.js");
  vm.runInContext(
    source.slice(0, source.indexOf("renderHome = studioHome;")),
    ctx,
  );
  vm.runInContext("studioHome()", ctx);
  assert.ok(target.innerHTML.includes("Olá, Ana &lt;b&gt;Maria&lt;/b&gt;."));
  assert.ok(!target.innerHTML.includes("<b>Maria</b>"));
});
