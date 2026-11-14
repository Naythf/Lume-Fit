/* Private reusable food routines; planned food is never marked as consumed. */
window.LumeFoodPlan = (() => {
  const C = LumeGuideCore,
    N = LumeNutrition;
  const data = () => C.normalize(state.db.profile.meuGuia);
  const nav = () =>
    `<nav class="guide-tabs food-unified" aria-label="Alimentação integrada"><button aria-current="page" onclick="switchTab('nutrition')">Diário</button><button onclick="LumeFoodPlan.open()">Rotinas</button><button onclick="switchTab('knowledge');LumeGuide.go('summary')">Guia</button><button onclick="switchTab('knowledge');LumeGuide.go('weight')">Evolução</button></nav>`;
  function commit(change) {
    const db = state.db,
      previous = db.profile.meuGuia,
      d = data();
    change(d);
    db.profile.meuGuia = C.normalize(d);
    if (saveDB() === false) {
      db.profile.meuGuia = previous;
      return false;
    }
    LumeGuide.render();
    return true;
  }
  const compatible = (r) =>
    r.menu.length > 0 &&
    N.menuTotals(r.menu, data().setup).count === r.menu.length;
  const list = () =>
    `<section class="food-plan"><header><h2>Suas rotinas alimentares</h2><button class="primary-btn" onclick="LumeFoodPlan.edit()">Nova rotina alimentar</button></header><p class="nv-footnote">Monte as refeições abaixo e salve uma combinação para repetir nos dias que escolher. Planejar não registra consumo.</p>${
      data()
        .routines.map(
          (r) =>
            `<article class="food-plan-card"><h3>${esc(r.name)}</h3><p>${r.days.map((d) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d]).join(" · ") || "Sem dia fixo"} · ${r.meals?.length || r.menu.length} refeições</p><p>${window.FoodComposer ? FoodComposer.describe(r) : "Revisar rotina"}</p><div class="row-actions"><button class="guide-button" onclick="LumeFoodPlan.load('${r.id}')">Abrir rotina</button><button class="guide-button" onclick="LumeFoodPlan.edit('${r.id}')">Editar</button><button class="guide-button" onclick="LumeFoodPlan.remove('${r.id}')">Excluir</button></div></article>`,
        )
        .join("") ||
      "<p>Nenhuma rotina salva. Escolha suas refeições e salve a primeira combinação.</p>"
    }</section>`;
  const food = LumeGuideVisual.food;
  LumeGuideVisual.food = (...args) => list() + food(...args);
  function open() {
    switchTab("knowledge");
    LumeGuide.go("food");
  }
  function edit(id) {
    const db = state.db,
      r = data().routines.find((x) => x.id === id),
      menu = r ? r.menu : data().menu;
    if (!menu.length) {
      toast("Adicione refeições ao rascunho primeiro.");
      return;
    }
    openSheet(
      `<h3>${r ? "Editar" : "Nova"} rotina alimentar</h3><form id="foodRoutineForm"><div class="field"><label for="foodRoutineName">Nome da rotina</label><input id="foodRoutineName" name="name" maxlength="80" required value="${esc(r?.name || "Minha rotina")}"></div><fieldset class="guide-avoids"><legend>Dias da semana · opcionais</legend>${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => `<label><input type="checkbox" name="days" value="${i}" ${r?.days.includes(i) ? "checked" : ""}>${day}</label>`).join("")}</fieldset><label><input name="useDraft" type="checkbox" checked> Usar as refeições do rascunho atual</label><p>Confira nome, dias, refeições, porções e restrições antes de salvar.</p><label><input name="reviewed" type="checkbox" required> Revisei as informações desta rotina.</label><div class="row-actions"><button class="guide-button" type="button" onclick="closeSheet()">Cancelar</button><button class="primary-btn">Salvar rotina</button></div><p role="status" id="foodRoutineStatus"></p></form>`,
    );
    document.getElementById("foodRoutineForm").onsubmit = (e) => {
      e.preventDefault();
      if (db !== state.db) return;
      const v = new FormData(e.target);
      if (!v.get("reviewed")) return;
      const chosenMenu = v.get("useDraft") ? data().menu : menu;
      if (!compatible({ menu: chosenMenu })) {
        document.getElementById("foodRoutineStatus").textContent =
          "Revise as refeições: há escolhas incompatíveis com suas restrições atuais.";
        return;
      }
      if (
        commit((d) => {
          const x = {
            id: r?.id || uid(),
            name: String(v.get("name")).trim(),
            days: v.getAll("days").map(Number),
            menu: chosenMenu.map((x) => ({ ...x })),
          };
          d.routines = d.routines.filter((y) => y.id !== x.id);
          d.routines.push(x);
        })
      ) {
        closeSheet();
        toast("Rotina alimentar salva.");
      }
    };
  }
  async function load(id) {
    const db = state.db,
      r = data().routines.find((x) => x.id === id);
    if (!r) return;
    if (r.meals?.length) {
      window.FoodComposer.edit(id);
      return;
    }
    if (!compatible(r)) {
      toast("Atualize esta rotina conforme suas restrições antes de usar.");
      return;
    }
    if (
      !(await lumeConfirm(
        "Abrir rotina?",
        "O rascunho atual será substituído pelas refeições desta rotina. Nada será registrado como consumido.",
      ))
    )
      return;
    if (db !== state.db) return;
    commit((d) => (d.menu = r.menu.map((x) => ({ ...x }))));
  }
  async function remove(id) {
    const db = state.db;
    if (
      !(await lumeConfirm(
        "Excluir rotina alimentar?",
        "Os registros do diário permanecem. Esta rotina será removida.",
      ))
    )
      return;
    if (db === state.db)
      commit((d) => (d.routines = d.routines.filter((r) => r.id !== id)));
  }
  const root = document.getElementById("screen-nutrition");
  function mount() {
    if (root && !root.querySelector(".food-unified"))
      root.querySelector(".page-head")?.insertAdjacentHTML("afterend", nav());
  }
  if (root) new MutationObserver(mount).observe(root, { childList: true });
  mount();
  const guideRoot = document.getElementById("screen-knowledge");
  if (guideRoot)
    new MutationObserver(() => {
      if (guideRoot.classList.contains("active"))
        document
          .querySelectorAll("#bottomNav button")
          .forEach((b) =>
            b.classList.toggle("active", b.dataset.tab === "nutrition"),
          );
    }).observe(guideRoot, { attributes: true, attributeFilter: ["class"] });
  return { open, edit, load, remove };
})();
