/* Presentation enhancements only; original field values and callbacks stay in charge. */
const studioPlusIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const studioAutoIcon =
  '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M25 12a10 10 0 0 0-17-3L5 12m0-6v6h6M7 20a10 10 0 0 0 17 3l3-3m0 6v-6h-6"/><path d="m12 14 6 6m-8-5 3-3m4 8 3-3"/></svg>';
function studioResponsiveEnhance() {
  document
    .querySelectorAll(
      ".auto-exercise-actions button[aria-label]:not([data-studio-arrow])",
    )
    .forEach((button) => {
      const label = button.getAttribute("aria-label");
      if (!label.startsWith("Subir ") && !label.startsWith("Descer ")) return;
      button.dataset.studioArrow = "true";
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${label.startsWith("Subir ") ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"}"/></svg>`;
    });
  document
    .querySelectorAll(
      '#screen-workouts .page-head button[onclick="openRoutineSheet()"]:not(.studio-create-routine)',
    )
    .forEach((button) => {
      button.classList.add("studio-create-routine");
      button.innerHTML = studioPlusIcon + "<span>Nova rotina</span>";
    });
  document
    .querySelectorAll(
      '.icon-choices [data-icon="auto"]:not([data-studio-auto])',
    )
    .forEach((button) => {
      button.dataset.studioAuto = "true";
      button.setAttribute("aria-label", "Usar ícone automático pelo nome");
      button.innerHTML =
        studioAutoIcon + "<span>Automático<small>Pelo nome</small></span>";
    });
}
let studioResponsiveFrame = false;
new MutationObserver(() => {
  if (studioResponsiveFrame) return;
  studioResponsiveFrame = true;
  requestAnimationFrame(() => {
    studioResponsiveFrame = false;
    studioResponsiveEnhance();
  });
}).observe(document.body, { childList: true, subtree: true });
studioResponsiveEnhance();
