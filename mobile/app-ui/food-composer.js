/* Independent routine editor. All changes remain in memory until reviewed and saved. */
window.FoodComposer = (() => {
  const C = LumeGuideCore,
    N = LumeNutrition,
    R = LumeFoodRestrictions;
  let draft = null,
    owner = null,
    token = 0;
  const data = () => C.normalize(state.db.profile.meuGuia);
  const kinds = ["Café da manhã", "Almoço", "Lanche", "Jantar", "Ceia"];
  function permitted(key) {
    const s = data().setup;
    if (
      (s.pattern === "vegan" && ["chicken", "egg", "yogurt"].includes(key)) ||
      (s.pattern === "vegetarian" && key === "chicken")
    )
      return false;
    return (
      !!N.foods[key] &&
      R.compatible(
        {
          tags:
            key === "egg"
              ? ["eggs"]
              : key === "tofu"
                ? ["soy"]
                : key === "peanut"
                  ? ["peanut"]
                  : [],
          parts: [[key, 100]],
        },
        data().setup,
      )
    );
  }
  function total(meals) {
    const t = { energy: 0, protein: 0, carbs: 0, fat: 0 };
    for (const m of meals)
      for (const [k, g] of m.parts) {
        if (!N.foods[k]) continue;
        ["energy", "protein", "carbs", "fat"].forEach(
          (n, i) => (t[n] += (N.foods[k][i + 1] * g) / 100),
        );
      }
    return t;
  }
  function valid(r) {
    return (
      !(
        data().setup.allergy === "selected" &&
        data().setup.avoids.includes("other")
      ) &&
      r.meals?.length > 0 &&
      !R.analyze(data().setup.avoidText).unknown.length &&
      r.meals.every(
        (m) =>
          m.parts.length &&
          m.parts.every(
            ([k, g]) => permitted(k) && C.number(g, 1, 2000) !== null,
          ),
      )
    );
  }
  function describe(r) {
    return r.meals?.length
      ? valid(r)
        ? Math.round(total(r.meals).energy) + " kcal planejadas"
        : "Revisar alimentos e restrições"
      : Math.round(N.menuTotals(r.menu, data().setup).energy) +
          " kcal do catálogo";
  }
  function edit(id) {
    owner = state.db;
    token++;
    const r = data().routines.find((r) => r.id === id);
    draft = r
      ? JSON.parse(JSON.stringify(r))
      : { id: uid(), name: "", days: [], menu: [], meals: [] };
    if (!draft.meals.length && r)
      draft.meals = r.menu
        .map((x) => {
          const recipe = N.recipes.find((r) => r.id === x.id);
          return recipe
            ? {
                kind: recipe.kind,
                time: "",
                parts: recipe.parts.map(([k, g]) => [k, g * x.scale]),
              }
            : null;
        })
        .filter(Boolean);
    if (!draft.meals.length)
      draft.meals = [{ kind: "Café da manhã", time: "", parts: [] }];
    paint();
  }
  function capture() {
    const f = document.getElementById("foodComposerForm");
    if (!f || owner !== state.db) return false;
    const v = new FormData(f);
    draft.name = String(v.get("name") || "").trim();
    draft.days = v.getAll("days").map(Number);
    draft.meals.forEach((m, i) => {
      m.kind = v.get("kind" + i);
      m.time = v.get("time" + i) || "";
      m.parts = m.parts.map((p, j) => [
        String(v.get("food" + i + "-" + j) || p[0]),
        Number(String(v.get("grams" + i + "-" + j) || "").replace(",", ".")),
      ]);
    });
    return true;
  }
  function paint() {
    const t = total(draft.meals);
    openSheet(
      `<div class="food-composer"><h2>${data().routines.some((r) => r.id === draft.id) ? "Editar rotina" : "Nova rotina alimentar"}</h2><p class="nv-footnote">Organize o que pretende comer. Registre no diário somente depois de consumir.</p><form id="foodComposerForm"><div class="field"><label for="fc-name">Nome da rotina</label><input id="fc-name" name="name" value="${esc(draft.name)}" maxlength="80" required placeholder="Ex.: Minha semana"></div><fieldset class="guide-avoids"><legend>Dias da semana</legend>${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => `<label><input type="checkbox" name="days" value="${i}" ${draft.days.includes(i) ? "checked" : ""}>${d}</label>`).join("")}</fieldset>${draft.meals
        .map(
          (m, i) =>
            `<section class="fc-meal"><header><h3>Refeição ${i + 1}</h3><button type="button" class="guide-button" onclick="FoodComposer.change('removeMeal',${i})">Remover</button></header><div class="guide-form-grid"><div class="field"><label for="fc-kind${i}">Refeição</label><select id="fc-kind${i}" name="kind${i}">${kinds.map((k) => `<option ${m.kind === k ? "selected" : ""}>${k}</option>`).join("")}</select></div><div class="field"><label for="fc-time${i}">Horário opcional</label><input id="fc-time${i}" type="time" name="time${i}" value="${esc(m.time)}"></div></div>${m.parts
              .map(
                ([k, g], j) =>
                  `<div class="fc-ingredient"><div class="field"><label for="fc-food${i}-${j}">Alimento</label><select id="fc-food${i}-${j}" name="food${i}-${j}">${Object.entries(
                    N.foods,
                  )
                    .filter(([id]) => permitted(id) || id === k)
                    .map(
                      ([id, f]) =>
                        `<option value="${id}" ${id === k ? "selected" : ""}>${esc(f[0])}${permitted(id) ? "" : " · revisar restrição"}</option>`,
                    )
                    .join(
                      "",
                    )}</select></div><div class="field"><label for="fc-g${i}-${j}">${k === "water" ? "mL" : "Gramas"}</label><input id="fc-g${i}-${j}" name="grams${i}-${j}" type="number" min="1" max="2000" step="0.1" required value="${g}"></div><button type="button" class="guide-button" aria-label="Remover alimento ${j + 1} da refeição ${i + 1}" onclick="FoodComposer.change('removeFood',${i},${j})">×</button></div>`,
              )
              .join(
                "",
              )}<button class="guide-button" type="button" onclick="FoodComposer.change('addFood',${i})">Adicionar alimento</button><p class="nv-footnote" data-meal-total="${i}">${Math.round(total([m]).energy)} kcal · ${total([m]).protein.toFixed(1)} g de proteína</p></section>`,
        )
        .join(
          "",
        )}<button class="guide-button" type="button" onclick="FoodComposer.change('addMeal')">Adicionar refeição</button><p id="fc-total" class="fc-total">${Math.round(t.energy)} kcal planejadas · ${t.protein.toFixed(1)} g proteínas · ${t.carbs.toFixed(1)} g carboidratos · ${t.fat.toFixed(1)} g gorduras</p><p id="fc-status" role="status"></p><div class="row-actions"><button type="button" class="guide-button" onclick="closeSheet()">Cancelar</button><button class="primary-btn" type="submit">Revisar e salvar</button></div></form></div>`,
    );
    document.getElementById("foodComposerForm").onsubmit = save;
    document.getElementById("foodComposerForm").onchange =
      document.getElementById("foodComposerForm").oninput = () => {
        if (capture()) {
          const x = total(draft.meals);
          draft.meals.forEach((m, i) => {
            const q = document.querySelector('[data-meal-total="' + i + '"]');
            if (q)
              q.textContent =
                Math.round(total([m]).energy) +
                " kcal · " +
                total([m]).protein.toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                }) +
                " g de proteína";
            m.parts.forEach(([k], j) => {
              const l = document.querySelector(
                'label[for="fc-g' + i + "-" + j + '"]',
              );
              if (l) l.textContent = k === "water" ? "mL" : "Gramas";
            });
          });
          document.getElementById("fc-total").textContent =
            Math.round(x.energy) +
            " kcal · " +
            x.protein.toFixed(1) +
            " g proteínas · " +
            x.carbs.toFixed(1) +
            " g carboidratos · " +
            x.fat.toFixed(1) +
            " g gorduras";
        }
      };
  }
  function change(action, i, j) {
    if (!capture()) return;
    if (action === "addMeal" && draft.meals.length < 8)
      draft.meals.push({ kind: "Lanche", time: "", parts: [] });
    if (action === "removeMeal") draft.meals.splice(i, 1);
    if (action === "addFood") {
      const k = Object.keys(N.foods).find(permitted);
      if (k && draft.meals[i].parts.length < 20)
        draft.meals[i].parts.push([k, 100]);
    }
    if (action === "removeFood") draft.meals[i].parts.splice(j, 1);
    paint();
  }
  async function save(e) {
    e.preventDefault();
    if (!capture()) return;
    const stamp = token,
      db = owner,
      snapshot = JSON.parse(JSON.stringify(draft));
    if (!snapshot.name || !valid(snapshot)) {
      document.getElementById("fc-status").textContent =
        "Confira nome, refeições, quantidades e alimentos incompatíveis. Nenhuma refeição pode ficar vazia.";
      return;
    }
    const summary = snapshot.meals
      .map(
        (m) =>
          m.kind +
          (m.time ? " · " + m.time : "") +
          ": " +
          m.parts
            .map(
              ([k, g]) =>
                N.foods[k][0] + " " + g + (k === "water" ? " mL" : " g"),
            )
            .join(", "),
      )
      .join(" / ");
    if (
      !(await lumeConfirm(
        "Revisar rotina alimentar",
        snapshot.name +
          " · " +
          (snapshot.days
            .map((d) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d])
            .join(", ") || "Sem dia fixo") +
          ". " +
          summary +
          ". Confirme se alimentos, porções, horários e restrições estão corretos.",
      ))
    )
      return;
    if (owner !== db || state.db !== db || stamp !== token) return;
    const previous = db.profile.meuGuia,
      d = data();
    snapshot.menu = [];
    d.routines = d.routines.filter((r) => r.id !== snapshot.id);
    d.routines.push(snapshot);
    db.profile.meuGuia = C.normalize(d);
    if (saveDB() === false) {
      db.profile.meuGuia = previous;
      return;
    }
    closeSheet();
    LumeGuide.render();
    toast("Rotina alimentar salva.");
  }
  LumeFoodPlan.edit = edit;
  return { edit, change, total, valid, describe };
})();
