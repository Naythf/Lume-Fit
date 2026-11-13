import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const data = JSON.parse(read("../assets/anatomy/body-map.json"));
function mapContext() {
  const ctx = vm.createContext({
    window: {},
    LUME_ANATOMY_DATA: data,
    esc: (s) => String(s),
  });
  const personalization = read("../../personalization.js");
  vm.runInContext(
    personalization.slice(
      personalization.indexOf("const MUSCLE_GROUPS"),
      personalization.indexOf(
        ";",
        personalization.indexOf("const MUSCLE_GROUPS"),
      ) + 1,
    ),
    ctx,
  );
  vm.runInContext(
    read("../app-ui/anatomy-map.js").split("function anatomyEnhanceEditor")[0],
    ctx,
  );
  return ctx;
}
test("anatomy highlights named superficial groups and excludes head, joints and extremities", () => {
  const ctx = mapContext();
  for (const [view, region, group] of [
    ["front", "chest", "chest"],
    ["front", "biceps", "biceps"],
    ["front", "deltoids", "shoulders"],
    ["front", "quadriceps", "quads"],
    ["back", "hamstring", "hamstrings"],
    ["back", "calves", "calves"],
    ["back", "gluteal", "glutes"],
    ["back", "upper-back", "back"],
  ]) {
    assert.equal(
      vm.runInContext(
        `anatomyRegionState('${view}','${region}',['${group}'],[])`,
        ctx,
      ),
      "primary",
    );
    assert.equal(
      vm.runInContext(
        `anatomyRegionState('${view}','${region}',[],['${group}'])`,
        ctx,
      ),
      "secondary",
    );
  }
  const all = vm.runInContext("Object.keys(MUSCLE_GROUPS)", ctx);
  for (const view of ["front", "back"])
    for (const region of [
      "head",
      "hair",
      "hands",
      "feet",
      "neck",
      "ankles",
      "knees",
    ])
      assert.equal(
        vm.runInContext(
          `anatomyRegionState('${view}','${region}',${JSON.stringify(all)},[])`,
          ctx,
        ),
        "neutral",
      );
  assert.equal(
    vm.runInContext("anatomyRegionState('front','calves',['calves'],[])", ctx),
    "neutral",
  );
});
test("muscle selection returns a replaceable figure, stable views, unique definitions and safe imported keys", () => {
  const ctx = mapContext(),
    render = (primary, secondary) =>
      ctx.window.muscleFigure(primary, secondary);
  const chest = render(["chest"], ["chest", "triceps"]),
    legs = render(["quads"]);
  assert.match(chest, /class="muscle-figure anatomy-map"/); // AutoRoutine replaces this whole node.
  assert.match(
    chest,
    /data-anatomy-region="chest" data-anatomy-state="primary"/,
  );
  assert.match(
    chest,
    /data-anatomy-region="triceps" data-anatomy-state="secondary"/,
  );
  assert.match(
    legs,
    /data-anatomy-region="chest" data-anatomy-state="neutral"/,
  );
  assert.match(chest, /viewBox="0 0 724 1448"/);
  assert.match(chest, /viewBox="724 0 724 1448"/);
  assert.notEqual(
    chest.match(/id="(anatomy-\d+)-front-stripe/)[1],
    legs.match(/id="(anatomy-\d+)-front-stripe/)[1],
  );
  const unsafe = render(['\" onload=alert(1)', "__proto__", null], []);
  assert.ok(!unsafe.includes("onload"));
  for (const view of ["front", "back"])
    for (const region of data[view])
      for (const d of region.paths)
        assert.match(d, /^M[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]+$/);
});
test("hero pages retain five distinct destinations and resume a real active session", () => {
  const ctx = vm.createContext({ window: {} }),
    code = read("../app-ui/hero-carousel.js");
  vm.runInContext(
    code.slice(0, code.indexOf("function studioHeroMarkup")),
    ctx,
  );
  const pages = vm.runInContext("studioHeroPages({routines:[]},null)", ctx);
  assert.deepEqual(
    Array.from(pages, (p) => p.destination),
    ["workouts", "nutrition", "history", "knowledge", "friends"],
  );
  assert.equal(new Set(pages.map((p) => p.title)).size, 5);
  const active = vm.runInContext(
    "studioHeroPages({routines:[]},{name:'Meu treino'})[0]",
    ctx,
  );
  assert.equal(active.destination, "register");
  assert.equal(active.title, "Meu treino");
});
test("sheet exits preserve confirmation identity, cancel handles and do not close a replacement editor", async () => {
  const overlays = new Map(),
    animations = [];
  let resolver = null;
  for (const id of ["sheet", "dialogOverlay"]) {
    const panel = {
      style: { removeProperty() {} },
      inert: false,
      animate() {
        const a = {
          cancel() {
            this.cancelled = true;
          },
        };
        animations.push(a);
        return a;
      },
    };
    const classes = new Set();
    overlays.set(id, {
      id,
      inert: false,
      querySelector: () => panel,
      classList: {
        contains: (k) => classes.has(k),
        add: (k) => classes.add(k),
        remove: (k) => classes.delete(k),
      },
      setAttribute() {},
    });
  }
  const ctx = vm.createContext({
    window: { AccountDeletion: { busy: false } },
    document: {
      getElementById: (id) => overlays.get(id),
      querySelectorAll: () => [],
    },
    LumeMotionPreference: { matches: false, addEventListener() {} },
    openSheet() {
      overlays.get("sheet").classList.add("active");
    },
    closeSheet() {
      if (ctx.window.AccountDeletion.busy) return;
      overlays.get("sheet").classList.remove("active");
    },
    answerDialog(v) {
      const cb = resolver;
      resolver = null;
      overlays.get("dialogOverlay").classList.remove("active");
      cb?.(v);
    },
    lumeConfirm() {
      overlays.get("dialogOverlay").classList.add("active");
      return new Promise((resolve) => (resolver = resolve));
    },
  });
  Object.defineProperty(ctx, "dialogResolver", {
    get: () => resolver,
    set: (v) => (resolver = v),
  });
  vm.runInContext(read("../app-ui/panels.js"), ctx);
  vm.runInContext('openSheet("A");closeSheet()', ctx);
  const old = animations.at(-1);
  vm.runInContext('openSheet("B")', ctx);
  old.onfinish();
  assert.ok(overlays.get("sheet").classList.contains("active"));
  assert.ok(old.cancelled);
  const first = vm.runInContext('lumeConfirm("A","")', ctx);
  vm.runInContext("answerDialog(false)", ctx);
  const oldExit = animations.at(-1);
  const second = vm.runInContext('lumeConfirm("B","")', ctx);
  assert.equal(await first, false);
  oldExit.onfinish();
  assert.ok(overlays.get("dialogOverlay").classList.contains("active"));
  vm.runInContext("answerDialog(false)", ctx);
  animations.at(-1).onfinish();
  assert.equal(await second, false);
  ctx.window.AccountDeletion.busy = true;
  vm.runInContext('openSheet("busy");closeSheet()', ctx);
  assert.ok(overlays.get("sheet").classList.contains("active"));
});
