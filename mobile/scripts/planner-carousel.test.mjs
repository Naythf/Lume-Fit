import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
function planner() {
  const ctx = vm.createContext({
    document: { addEventListener() {} },
    LUME_EXERCISE_ART: {},
    trainingGraphic() {
      throw Error("Artwork must not drive the planner");
    },
  });
  vm.runInContext("window=globalThis", ctx);
  for (const file of [
    "../../personalization.js",
    "../../exercise-catalog.js",
    "../app-ui/planner.js",
  ])
    vm.runInContext(read(file), ctx);
  return ctx;
}
test("expanded catalog has unique explicit movements and respects equipment prerequisites", () => {
  const ctx = planner(),
    catalog = vm.runInContext("EXERCISE_CATALOG", ctx),
    equipment = vm.runInContext("TRAINING_EQUIPMENT", ctx),
    muscles = vm.runInContext("MUSCLE_GROUPS", ctx);
  assert.ok(catalog.length >= 80);
  assert.equal(new Set(catalog.map((e) => e.id)).size, catalog.length);
  assert.equal(new Set(catalog.map((e) => e.name)).size, catalog.length);
  for (const e of catalog) {
    assert.ok(muscles[e.primary], e.id);
    assert.ok(
      e.secondary.every((k) => muscles[k] && k !== e.primary),
      e.id,
    );
    assert.ok(
      e.equipment.every((k) => equipment[k]),
      e.id,
    );
    assert.ok(e.family && e.note && e.measurement === "reps", e.id);
  }
  const pool = (keys, level = "intermediate") =>
    ctx
      .catalogEligible({ modes: ["gym"], equipment: keys }, level)
      .map((e) => e.id);
  assert.ok(pool(["dumbbells"]).includes("db-floor"));
  assert.ok(!pool(["dumbbells"]).includes("db-bench"));
  assert.ok(pool(["dumbbells", "bench"]).includes("db-bench"));
  assert.ok(!pool(["barbell", "bench"]).includes("bar-bench"));
  assert.ok(pool(["barbell", "bench", "rack"]).includes("bar-bench"));
  assert.ok(
    !pool(["barbell", "bench", "rack"], "beginner").includes("bar-bench"),
  );
  assert.ok(!pool(["bands"]).includes("band-assisted-pullup"));
  assert.ok(pool(["bands", "pullup"]).includes("band-assisted-pullup"));
  assert.ok(pool(["kettlebells"]).includes("kb-goblet"));
});
test("plans cover 1600 combinations without unavailable gear, duplicate families or exceeding time", () => {
  const ctx = planner(),
    catalog = vm.runInContext("EXERCISE_CATALOG", ctx),
    byId = new Map(catalog.map((e) => [e.id, e]));
  let checked = 0;
  const equipments = [
    [],
    ["dumbbells"],
    ["bands"],
    ["barbell"],
    ["machines"],
    ["pullup", "bands"],
    ["kettlebells"],
    ["dumbbells", "bench"],
    ["barbell", "rack", "bench"],
    [
      "dumbbells",
      "bands",
      "machines",
      "bench",
      "barbell",
      "rack",
      "pullup",
      "kettlebells",
    ],
  ];
  for (const n of [1, 2, 3, 4, 6])
    for (const goal of ["consistency", "strength", "muscle", "conditioning"])
      for (const minutes of [15, 30, 60, 90])
        for (const level of ["beginner", "intermediate"])
          for (const equipment of equipments) {
            const prefs = {
                modes: ["gym", "home", "calisthenics"],
                goal,
                minutes,
                equipment,
                days: [1, 2, 3, 4, 5, 6].slice(0, n),
                focus: ["chest", "back", "glutes"],
              },
              plan = ctx.buildAutomaticPlan(prefs, level);
            assert.ok(!plan.error, JSON.stringify(prefs));
            assert.equal(plan.routines.length, n);
            for (const [i, r] of plan.routines.entries()) {
              assert.ok(r.exercises.length > 0);
              assert.equal(
                new Set(r.exercises.map((e) => byId.get(e.catalogId).family))
                  .size,
                r.exercises.length,
              );
              assert.ok(
                ctx.plannedMinutes(r.exercises, goal) <= minutes,
                JSON.stringify({ prefs, r }),
              );
              for (const e of r.exercises) {
                const c = byId.get(e.catalogId);
                assert.ok(c.equipment.every((k) => equipment.includes(k)));
                assert.ok(c.level <= (level === "intermediate" ? 1 : 0));
                assert.equal(e.name, c.name);
                assert.ok(e.minReps <= e.maxReps);
                if (n >= 4)
                  assert.equal(
                    ["quads", "hamstrings", "glutes", "calves"].includes(
                      c.primary,
                    ),
                    i % 2 === 1,
                  );
              }
            }
            checked++;
          }
  assert.equal(checked, 1600);
});
test("focus and experience affect selection without any movement images", () => {
  const ctx = planner(),
    p = {
      modes: ["home"],
      days: [1, 3, 5],
      equipment: [],
      focus: ["chest"],
      goal: "muscle",
      minutes: 60,
    };
  const regular = ctx.buildAutomaticPlan(p, "intermediate");
  assert.ok(
    regular.routines[0].exercises.some((e) => e.catalogId === "pushup"),
  );
  assert.ok(
    !regular.routines[0].exercises.some(
      (e) => e.catalogId === "wall-push" || e.catalogId === "knee-push",
    ),
  );
  const rich = {
    ...p,
    modes: ["gym"],
    equipment: [
      "machines",
      "dumbbells",
      "barbell",
      "bench",
      "rack",
      "bands",
      "pullup",
      "kettlebells",
    ],
    focus: ["chest", "back", "glutes"],
  };
  const plan = ctx.buildAutomaticPlan(rich, "intermediate"),
    muscles = new Set(
      plan.routines.flatMap((r) =>
        r.exercises.map((e) => ctx.catalogExercise(e.catalogId).primary),
      ),
    );
  assert.ok(
    !plan.routines.some((r) =>
      r.exercises.some((e) => e.catalogId === "prone-w"),
    ),
  );
  for (const key of rich.focus) assert.ok(muscles.has(key), key);
  assert.ok(
    plan.routines.some((r) =>
      r.exercises.some((e) =>
        [
          "bar-bench",
          "db-bench",
          "db-supported-row",
          "seated-leg-curl",
          "machine-hip-abduction",
          "db-hip-thrust",
          "bar-hip-thrust",
        ].includes(e.catalogId),
      ),
    ),
  );
  assert.equal(
    JSON.stringify(ctx.buildAutomaticPlan(rich, "intermediate")),
    JSON.stringify(plan),
  );
  const missing = ctx.buildAutomaticPlan(
    { ...p, focus: ["biceps"] },
    "beginner",
  );
  assert.ok(missing.warnings.some((w) => w.includes("Bíceps")));
  assert.ok(ctx.buildAutomaticPlan({ ...p, goal: "mobility" }).error);
});
function carousel() {
  let now = 0,
    serial = 0,
    blocked = false,
    visible = true;
  const timers = new Map(),
    events = {},
    motionEvents = {},
    animations = [],
    observers = [];
  const frames = Array.from({ length: 5 }, () => ({
    active: false,
    classList: {
      toggle(name, value) {
        this.owner.active = value;
      },
    },
  }));
  for (const f of frames) f.classList.owner = f;
  const dots = Array.from({ length: 5 }, (_, i) => ({
    dataset: { heroPhoto: String(i) },
    setAttribute() {},
    removeAttribute() {},
    matches() {
      return false;
    },
  }));
  const copy = ["eyebrow", "title", "description", "action"].map((key) => ({
    dataset: { heroCopy: key },
    textContent: "",
    animate(frames, options) {
      const a = { frames, options, cancel() {} };
      animations.push(a);
      return a;
    },
  }));
  const action = { dataset: { heroDestination: "workouts" } };
  const hero = {
    dataset: {},
    isConnected: true,
    contains(el) {
      return dots.includes(el) || el === action;
    },
    closest() {
      return { classList: { contains: () => visible } };
    },
    addEventListener(name, fn) {
      events[name] = fn;
    },
    querySelector() {
      return action;
    },
    querySelectorAll(selector) {
      return selector === ".studio-hero-frame"
        ? frames
        : selector === "[data-hero-photo]"
          ? dots
          : copy;
    },
  };
  const document = {
    hidden: false,
    activeElement: {},
    querySelector: (s) =>
      s.includes("data-studio-hero") ? hero : blocked ? {} : null,
    getElementById: () => ({}),
    addEventListener() {},
  };
  const motion = {
    matches: false,
    addEventListener: (name, fn) => (motionEvents[name] = fn),
  };
  const ctx = vm.createContext({
    document,
    LumeMotionPreference: motion,
    state: { db: { routines: [] }, activeWorkout: null },
    MutationObserver: class {
      constructor(fn) {
        observers.push(fn);
      }
      observe() {}
    },
    IntersectionObserver: class {
      constructor(fn) {
        this.fn = fn;
      }
      observe() {
        this.fn([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
    setTimeout(fn, ms) {
      const id = ++serial;
      timers.set(id, { fn, due: now + ms });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    queueMicrotask: (fn) => fn(),
    switchTab() {},
  });
  vm.runInContext("window=globalThis", ctx);
  vm.runInContext(read("../app-ui/hero-carousel.js"), ctx);
  ctx.LumeHeroCarousel.enhance();
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const entry = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
      if (!entry || entry[1].due > end) break;
      now = entry[1].due;
      timers.delete(entry[0]);
      entry[1].fn();
    }
    now = end;
  }
  return {
    hero,
    document,
    events,
    motion,
    animations,
    frames,
    dots,
    copy,
    action,
    advance,
    reduce(value) {
      motion.matches = value;
      motionEvents.change();
    },
    block(value) {
      blocked = value;
      observers.forEach((fn) => fn());
    },
    visible(value) {
      visible = value;
      observers.forEach((fn) => fn());
    },
  };
}
test("hero keeps rotating after pointer selection, with photo, words and action changing together", () => {
  const c = carousel();
  c.advance(8000);
  assert.equal(c.hero.dataset.heroIndex, "1");
  assert.equal(c.action.dataset.heroDestination, "nutrition");
  assert.equal(c.frames[1].active, true);
  assert.ok(c.animations.length >= 4);
  const dot = c.dots[3],
    target = { closest: (s) => (s === "[data-hero-photo]" ? dot : null) };
  c.events.pointerdown({ pointerType: "mouse", target });
  c.document.activeElement = dot;
  c.events.focusin({ target: dot });
  c.events.pointerup({ clientX: 0, clientY: 0 });
  c.events.click({ target });
  assert.equal(c.hero.dataset.heroIndex, "3");
  c.advance(8000);
  assert.equal(c.hero.dataset.heroIndex, "4");
  assert.equal(c.action.dataset.heroDestination, "friends");
  c.advance(8000);
  assert.equal(c.hero.dataset.heroIndex, "0");
});
test("keyboard focus, held gestures, reduced motion, overlays and hidden screens pause temporarily", () => {
  const c = carousel();
  c.document.activeElement = c.action;
  c.events.focusin({ target: { matches: () => true } });
  c.advance(16000);
  assert.equal(c.hero.dataset.heroIndex, "0");
  c.document.activeElement = {};
  c.events.focusout();
  c.advance(8000);
  assert.equal(c.hero.dataset.heroIndex, "1");
  c.events.pointerdown({
    pointerType: "mouse",
    target: { closest: () => null },
  });
  c.advance(16000);
  assert.equal(c.hero.dataset.heroIndex, "1");
  c.events.pointercancel();
  c.advance(8000);
  assert.equal(c.hero.dataset.heroIndex, "2");
  c.reduce(true);
  c.advance(16000);
  assert.equal(c.hero.dataset.heroIndex, "2");
  c.reduce(false);
  c.block(true);
  c.advance(16000);
  assert.equal(c.hero.dataset.heroIndex, "2");
  c.block(false);
  c.advance(8000);
  assert.equal(c.hero.dataset.heroIndex, "3");
  c.visible(false);
  c.advance(16000);
  assert.equal(c.hero.dataset.heroIndex, "3");
  c.visible(true);
  c.advance(8000);
  assert.equal(c.hero.dataset.heroIndex, "4");
});
