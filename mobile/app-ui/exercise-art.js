// Actual exercise illustrations, explicit catalog matches and user-controlled selection.
// Exercise data by RepDB (repdb.co), Free Tier License. Assets incorporated into this app only.
const studioCatalogArt = {
  "wall-push": "wall-push-ups",
  "knee-push": "knee-push-ups",
  pushup: "push-up",
  "close-push": "close-grip-push-ups",
  "db-floor": "dumbbell-floor-press",
  "db-press": "dumbbell-shoulder-press",
  "db-raise": "lateral-raise",
  "db-triceps": "dumbbell-tricep-extension",
  "db-curl": "bicep-curl",
  "db-row": "bent-over-db-row",
  pullup: "pull-up",
  chinup: "chin-ups",
  squat: "bodyweight-squat",
  "reverse-lunge": "bodyweight-reverse-lunge",
  "db-squat": "db-goblet-squat",
  "db-rdl": "dumbbell-romanian-deadlift",
  bridge: "glute-bridge",
  calf: "bodyweight-calf-raise",
  "db-calf": "dumbbell-calf-raise",
  deadbug: "dead-bug",
  birddog: "bird-dog",
  curlup: "crunches",
  "machine-chest": "chest-press-machine",
  "machine-row": "chest-supported-machine-row",
  pulldown: "lat-pulldown",
  "cable-triceps": "tricep-pushdown",
  "cable-curl": "cable-curl",
  legpress: "leg-press",
  legcurl: "leg-curl",
  legextension: "leg-extension",
  "bar-row": "barbell-row",
  "bar-rdl": "romanian-deadlift",
};
const studioArtChoices = [
  ["bench-press", "Supino com barra"],
  ["incline-bench-press", "Supino inclinado"],
  ["db-bench-press", "Supino com halteres"],
  ["dumbbell-floor-press", "Supino no chão"],
  ["push-up", "Flexão de braços"],
  ["knee-push-ups", "Flexão com joelhos"],
  ["bodyweight-squat", "Agachamento livre"],
  ["db-goblet-squat", "Agachamento com halter"],
  ["glute-bridge", "Elevação de quadril"],
  ["leg-press", "Leg press"],
  ["leg-curl", "Flexora"],
  ["leg-extension", "Extensora"],
  ["bent-over-db-row", "Remada com halteres"],
  ["barbell-row", "Remada com barra"],
  ["lat-pulldown", "Puxada na polia"],
  ["pull-up", "Barra fixa"],
  ["bicep-curl", "Rosca com halteres"],
  ["tricep-pushdown", "Tríceps na polia"],
  ["dumbbell-shoulder-press", "Desenvolvimento"],
  ["lateral-raise", "Elevação lateral"],
  ["dumbbell-romanian-deadlift", "Romeno com halteres"],
  ["bodyweight-calf-raise", "Panturrilha"],
  ["crunches", "Abdominal"],
  ["plank", "Prancha"],
];
const studioNameKey = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const studioNameArt = new Map(
  studioArtChoices.map(([id, name]) => [studioNameKey(name), id]),
);
for (const exercise of EXERCISE_CATALOG) {
  const id = studioCatalogArt[exercise.id];
  if (id) studioNameArt.set(studioNameKey(exercise.name), id);
}
for (const [name, id] of [
  ["Supino reto", "bench-press"],
  ["Supino reto com barra", "bench-press"],
  ["Supino inclinado com barra", "incline-bench-press"],
  ["Agachamento", "bodyweight-squat"],
  ["Rosca direta com halteres", "bicep-curl"],
  ["Puxada alta", "lat-pulldown"],
])
  studioNameArt.set(studioNameKey(name), id);
function studioArtId(item) {
  const explicit = String(item?.icon || "").replace(/^repdb:/, "");
  if (
    String(item?.icon || "").startsWith("repdb:") &&
    Object.hasOwn(LUME_EXERCISE_ART, explicit)
  )
    return explicit;
  const c =
    typeof catalogExercise === "function"
      ? catalogExercise(item?.catalogId)
      : null;
  if (c && c.name === item.name) return studioCatalogArt[c.id] || "";
  return studioNameArt.get(studioNameKey(item?.name)) || "";
}
function studioArtImage(id) {
  const entry = LUME_EXERCISE_ART[id];
  return entry
    ? `<span class="exercise-art"><img src="${entry.frames[0]}" alt="" width="384" height="384" loading="lazy" decoding="async"></span>`
    : "";
}
const studioEquipmentGraphic = window.trainingGraphic;
const studioResetTrainingDraft = resetTrainingDraft;
resetTrainingDraft = function (item) {
  studioResetTrainingDraft(item);
  trainingDraft.studioName = item?.name || "";
  if (!String(trainingDraft.icon).startsWith("repdb:"))
    trainingDraft.icon = "auto";
};
window.suggestTrainingIcon = function (name) {
  const id = studioNameArt.get(studioNameKey(name));
  return id ? "repdb:" + id : "dumbbell";
};
window.trainingGraphic = function (kind) {
  if (String(kind).startsWith("repdb:"))
    return studioArtImage(String(kind).slice(6)) || dumbbellSmallIcon();
  if (kind === "dumbbell" || kind === "kettlebell")
    return studioEquipmentGraphic(kind);
  const family = {
    bench: "bench-press",
    pushup: "push-up",
    bridge: "glute-bridge",
    press: "dumbbell-shoulder-press",
    raise: "lateral-raise",
    pull: "lat-pulldown",
    row: "barbell-row",
    curl: "bicep-curl",
    triceps: "tricep-pushdown",
    squat: "bodyweight-squat",
    legpress: "leg-press",
    deadlift: "romanian-deadlift",
    legs: "leg-extension",
    calf: "bodyweight-calf-raise",
    core: "crunches",
    plank: "plank",
    run: "running",
    bike: "cycling",
  };
  return family[kind] ? studioArtImage(family[kind]) : dumbbellSmallIcon();
};
window.trainingVisual = function (item) {
  const custom = safeIconImage(item?.iconImage);
  if (custom)
    return `<img class="custom-training-icon" src="${custom}" alt="" width="128" height="128" loading="lazy" decoding="async">`;
  const id = studioArtId(item);
  return id
    ? studioArtImage(id)
    : `<span class="studio-equipment-fallback" aria-hidden="true">${studioEquipmentGraphic("dumbbell")}</span>`;
};
// Users now choose an actual movement illustration, not a generic standing pose.
TRAINING_ICONS.splice(
  0,
  TRAINING_ICONS.length,
  ...studioArtChoices
    .filter(([id]) => Object.hasOwn(LUME_EXERCISE_ART, id))
    .map(([id, name]) => ["repdb:" + id, name]),
);
const studioGuideView = openMuscleDetails;
openMuscleDetails = function (routineId, exerciseId) {
  studioGuideView(routineId, exerciseId);
  const exercise = state.db.routines
    .find((r) => r.id === routineId)
    ?.exercises.find((e) => e.id === exerciseId);
  if (!exercise) return;
  const id = studioArtId(exercise),
    entry = LUME_EXERCISE_ART[id];
  if (!entry) return;
  const title = document.querySelector("#sheetContent h3");
  title?.insertAdjacentHTML(
    "afterend",
    `<div class="exercise-positions">${entry.frames.map((src, i) => `<figure><img src="${src}" alt="${esc(exercise.name)}, ${"posição " + (i + 1)}" width="384" height="384"><figcaption>${entry.frames.length === 1 ? "Posição de referência" : "Referência " + (i + 1)}</figcaption></figure>`).join("")}</div>`,
  );
};
