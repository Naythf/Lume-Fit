/* Curved anatomical regions embedded locally. HichamELBSI, MIT. */
const ANATOMY_GROUPS = {
  front: {
    chest: "chest",
    deltoids: "shoulders",
    biceps: "biceps",
    abs: "core",
    obliques: "core",
    quadriceps: "quads",
  },
  back: {
    trapezius: "back",
    "upper-back": "back",
    "lower-back": "back",
    deltoids: "shoulders",
    triceps: "triceps",
    gluteal: "glutes",
    hamstring: "hamstrings",
    calves: "calves",
  },
};
let anatomySerial = 0;
function anatomyKeys(value) {
  return [
    ...new Set(
      (Array.isArray(value) ? value : [value]).filter(
        (k) => typeof k === "string" && Object.hasOwn(MUSCLE_GROUPS, k),
      ),
    ),
  ];
}
function anatomyRegionState(view, muscle, primary, secondary) {
  const group = ANATOMY_GROUPS[view]?.[muscle];
  return group && primary.includes(group)
    ? "primary"
    : group && secondary.includes(group)
      ? "secondary"
      : "neutral";
}
window.muscleFigure = function (primary = [], secondary = []) {
  primary = anatomyKeys(primary);
  secondary = anatomyKeys(secondary).filter((k) => !primary.includes(k));
  const id = "anatomy-" + ++anatomySerial,
    labels = (keys) => keys.map((k) => MUSCLE_GROUPS[k]).join(", ");
  const views = ["front", "back"]
    .map((view) => {
      const title = view === "front" ? "Vista frontal" : "Vista posterior";
      return `<figure><svg viewBox="${view === "front" ? "0 0 724 1448" : "724 0 724 1448"}" role="img" aria-labelledby="${id}-${view}-title" preserveAspectRatio="xMidYMid meet"><title id="${id}-${view}-title">${title}. ${primary.length ? "Em foco: " + labels(primary) + "." : "Sem foco selecionado."}${secondary.length ? " Auxiliares: " + labels(secondary) + "." : ""}</title><defs><pattern id="${id}-${view}-stripe" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="16" height="16" fill="#834d4d"/><rect width="6" height="16" fill="#f0b1aa"/></pattern></defs>${LUME_ANATOMY_DATA[
        view
      ]
        .map((region) => {
          const status = anatomyRegionState(
              view,
              region.muscle,
              primary,
              secondary,
            ),
            fill =
              status === "primary"
                ? "#ed5c60"
                : status === "secondary"
                  ? `url(#${id}-${view}-stripe)`
                  : "#a4a4a4";
          return `<g data-anatomy-region="${region.muscle}" data-anatomy-state="${status}" fill="${fill}">${region.paths.map((d) => `<path d="${d}"/>`).join("")}</g>`;
        })
        .join("")}</svg><figcaption>${title}</figcaption></figure>`;
    })
    .join("");
  return `<div class="muscle-figure anatomy-map"><div class="anatomy-views">${views}</div><div class="anatomy-key"><p><i class="anatomy-primary" aria-hidden="true"></i><span><strong>Em foco</strong>${primary.length ? esc(labels(primary)) : "Sem grupo selecionado"}</span></p>${secondary.length ? `<p><i class="anatomy-secondary" aria-hidden="true"></i><span><strong>Auxiliares</strong>${esc(labels(secondary))}</span></p>` : ""}</div><small>Mapa de regiões musculares. Não mede ativação.</small></div>`;
};
function anatomyEnhanceEditor() {
  const editor = document.querySelector("#sheet .muscle-editor");
  if (!editor) return;
  const form = editor.closest("form"),
    control = form?.elements.primaryMuscle;
  if (!control) return;
  const manual = control.value,
    suggested = exerciseMuscles({ name: form.elements.name?.value || "" });
  const primary =
    manual === "none"
      ? []
      : manual
        ? anatomyKeys(manual)
        : anatomyKeys(suggested.primary);
  const secondary =
    manual === "none"
      ? []
      : manual
        ? [
            ...editor.querySelectorAll(
              'input[name="secondaryMuscle"]:checked:not(:disabled)',
            ),
          ].map((i) => i.value)
        : anatomyKeys(suggested.secondary);
  const fingerprint = JSON.stringify([primary, secondary]);
  let preview = editor.querySelector(".anatomy-editor-preview");
  if (!preview) {
    preview = document.createElement("div");
    preview.className = "anatomy-editor-preview";
    preview.setAttribute("aria-label", "Prévia do foco muscular");
    editor.append(preview);
  }
  if (preview.dataset.focus === fingerprint) return;
  preview.dataset.focus = fingerprint;
  preview.innerHTML = muscleFigure(primary, secondary);
}
const anatomyPreviousUpdate = window.updateMuscleEditor;
window.updateMuscleEditor = function (...args) {
  const result = anatomyPreviousUpdate.apply(this, args);
  anatomyEnhanceEditor();
  return result;
};
document.addEventListener("change", (event) => {
  if (event.target.closest("#sheet .muscle-editor")) anatomyEnhanceEditor();
});
document.addEventListener("input", (event) => {
  if (event.target.matches('#sheet input[name="name"]')) anatomyEnhanceEditor();
});
let anatomyPending = false;
new MutationObserver(() => {
  if (anatomyPending) return;
  anatomyPending = true;
  queueMicrotask(() => {
    anatomyPending = false;
    anatomyEnhanceEditor();
  });
}).observe(document.getElementById("sheetContent"), {
  childList: true,
  subtree: true,
});
