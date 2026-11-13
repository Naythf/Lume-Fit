/* Meu guia: progressive education, optional estimates and private check-ins. */
window.LumeGuide = (() => {
  const C = LumeGuideCore;
  let owner = null,
    draft = null,
    step = 0,
    tab = "summary",
    explore = false,
    shown = 12;
  let editor = null,
    photoToken = 0,
    photoBusy = false;
  const root = () => document.getElementById("screen-knowledge");
  const guide = () => C.normalize(state.db.profile.meuGuia);
  const n = (v, digits = 1) =>
    v === null || v === undefined
      ? "—"
      : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: digits });
  const day = (value) =>
    new Date(value + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const arrow = () => studioChevron("right");
  const button = (label, action, primary = false) =>
    `<button type="button" class="${primary ? "primary-btn" : "guide-button"}" onclick="${action}">${label}${arrow()}</button>`;
  const fold = (title, body) => LumeGuideVisual.fold(title, body);
  let mealKind = "Almoço",
    selectedRecipe = "",
    portion = 1,
    quickOwner = null;
  function syncOwner() {
    if (owner === state.db) return;
    owner = state.db;
    draft = null;
    step = 0;
    tab = "summary";
    explore = false;
    shown = 12;
    editor = null;
    photoToken++;
    photoBusy = false;
    mealKind = "Almoço";
    selectedRecipe = "";
    portion = 1;
    quickOwner = null;
  }
  function render(options = {}) {
    syncOwner();
    if (!root()) return;
    if (draft && root().querySelector("#guideSetup")) return;
    const data = guide();
    root().classList.add("guide-screen");
    root().classList.toggle("nv-quiet", options.quiet === true);
    root().classList.toggle(
      "nv-water-updating",
      Number.isFinite(options.waterFrom),
    );
    root().style.setProperty(
      "--water-from",
      String(Number.isFinite(options.waterFrom) ? options.waterFrom : 0),
    );
    root().innerHTML = `<header class="guide-page-head"><div><h1>Alimentação</h1></div><span class="guide-private">Privado</span></header>${draft ? wizard() : !data.setup.complete && !explore ? welcome() : dashboard(data)}`;
  }
  function welcome() {
    return `<section class="guide-welcome"><div class="guide-welcome-visual" aria-hidden="true">${metricIllustration("body")}</div><h2>Um ponto de partida<br>para cuidar de você.</h2><p>Primeiro, seu contexto. Depois, referências que fazem sentido para o seu dia.</p>${button("Montar meu guia", "LumeGuide.start()", true)}${button("Explorar primeiro", "LumeGuide.explore()")}<ol class="guide-welcome-list"><li><strong>Responda no seu ritmo</strong><span>Intenção, rotina e preferências. Medidas são opcionais.</span></li><li><strong>Entenda antes de mudar</strong><span>Alimentação explicada, com ideias para suas refeições.</span></li><li><strong>Acompanhe sua história</strong><span>Peso, observações e fotos que só você escolhe registrar.</span></li></ol><p class="guide-small">Conteúdo educativo. As estimativas não definem uma dieta e não substituem acompanhamento profissional.</p></section>`;
  }
  function start() {
    syncOwner();
    const saved = guide().setup,
      p = state.db.profile;
    draft = saved.complete
      ? { ...saved, avoids: [...saved.avoids] }
      : C.setup({
          ...saved,
          age: p.age,
          weight: p.weight,
          height: parseHeight(p.height),
        });
    step = 0;
    paintWizard();
  }
  const field = (label, name, type = "number", attrs = "") =>
    `<div class="field"><label for="guide-${name}">${label}</label><input id="guide-${name}" name="${name}" type="${type}" value="${esc(draft[name] ?? "")}" ${attrs}></div>`;
  const select = (label, name, values) =>
    `<div class="field"><label for="guide-${name}">${label}</label><select id="guide-${name}" name="${name}" ${name === "allergy" ? 'aria-controls="guideAvoids" onchange="LumeGuide.restrictions(this.value)"' : ""}>${Object.entries(
      values,
    )
      .map(
        ([value, title]) =>
          `<option value="${value}" ${draft[name] === value ? "selected" : ""}>${title}</option>`,
      )
      .join("")}</select></div>`;
  function wizard() {
    const pages = [
      `<h2 id="guideStepTitle" tabindex="-1">O que você busca agora?</h2><p>Isso organiza seu guia. Nenhuma opção cria uma dieta ou altera seus treinos.</p><div class="guide-goals">${Object.entries(
        C.choices.goal,
      )
        .map(
          ([value, label]) =>
            `<label><input type="radio" name="goal" value="${value}" ${draft.goal === value ? "checked" : ""}><span>${label}</span>${arrow()}</label>`,
        )
        .join("")}</div>`,
      `<h2 id="guideStepTitle" tabindex="-1">Seu contexto vem primeiro.</h2><p>Algumas fases da vida e condições de saúde precisam de orientação individual. Você pode continuar sem informar.</p>${field("Idade · opcional", "age", "number", 'min="1" max="110" step="1" inputmode="numeric" placeholder="Em anos"')}${select("Alguma situação se aplica a você?", "context", C.choices.context)}<p class="guide-note">Gestação, amamentação, condições clínicas e desconforto com peso ou calorias deixam as estimativas desativadas. O conteúdo educativo e seus registros continuam disponíveis.</p>`,
      `<h2 id="guideStepTitle" tabindex="-1">Medidas são uma escolha.</h2><p>Preencha apenas o que quiser. Usados só nas referências do guia.</p><div class="guide-form-grid">${field("Peso atual (kg) · opcional", "weight", "number", 'min="20" max="400" step="0.1" inputmode="decimal" placeholder="Ex.: 65"')}${field("Altura (cm) · opcional", "height", "number", 'min="100" max="250" step="0.1" inputmode="decimal" placeholder="Ex.: 170"')}</div>${select("Referência para a equação · opcional", "sex", C.choices.sex)}<p class="guide-small">A equação publicada usa duas referências fisiológicas. A escolha não define sua identidade. Sem escolher, mostramos uma faixa pelas duas referências.</p>${select("Como é sua atividade diária?", "activity", C.choices.activity)}${select("Proteína para sua rotina", "proteinMode", C.choices.proteinMode)}${select("Cenário de energia", "energyMode", C.choices.energyMode)}${["gain", "lose"].includes(draft.goal) ? field("Peso desejado (kg) · opcional", "target", "number", 'min="20" max="400" step="0.1" inputmode="decimal" placeholder="Sem prazo automático"') : ""}`,
      `<h2 id="guideStepTitle" tabindex="-1">Comida que cabe na sua rotina.</h2><p>Usamos estas respostas para filtrar ideias de refeições. As quantidades dependem da sua fome, do seu contexto e de orientação individual.</p>${select("Preferência alimentar", "pattern", C.choices.pattern)}${select("Tempo para preparar", "time", C.choices.time)}${select("Restrições alimentares", "allergy", C.choices.allergy)}<fieldset id="guideAvoids" class="guide-avoids" ${draft.allergy === "selected" ? "" : "hidden"}><legend>Alimentos a evitar · se você indicou restrições</legend>${Object.entries(
        C.choices.allergens,
      )
        .map(
          ([value, label]) =>
            `<label><input type="checkbox" name="avoids" value="${value}" ${draft.avoids.includes(value) ? "checked" : ""}><span>${label}</span></label>`,
        )
        .join(
          "",
        )}</fieldset>${LumeFoodRestrictions.field(draft)}<div class="field"><label for="guide-notes">Preferências e lembretes · opcional</label><textarea id="guide-notes" name="notes" rows="2" maxlength="300" placeholder="Algo que você quer lembrar ao escolher suas refeições">${esc(draft.notes)}</textarea></div><p class="guide-small">Escreva os alimentos no campo de exclusões. Mostraremos o que foi reconhecido antes de salvar. Lembretes continuam sendo anotações.</p>`,
    ];
    return `<section class="guide-setup"><div class="guide-step-meta"><span>Etapa ${step + 1} de 4</span><button type="button" class="guide-button" onclick="LumeGuide.cancel()">${guide().setup.complete ? "Cancelar edição" : "Sair sem salvar"}</button></div><div class="guide-progress" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= step ? "done" : ""}"></i>`).join("")}</div><form id="guideSetup" onsubmit="LumeGuide.next(event)">${pages[step]}<p id="guideSetupStatus" role="status"></p><footer class="guide-form-actions">${step ? '<button type="button" class="guide-button" onclick="LumeGuide.back()">Voltar</button>' : "<span></span>"}<button type="submit" class="primary-btn">${step === 3 ? "Concluir meu guia" : "Continuar"}${arrow()}</button></footer><p class="guide-small">Salvo ao concluir. Suas respostas ficam privadas e entram no backup.</p></form></section>`;
  }
  function capture() {
    const form = document.getElementById("guideSetup");
    if (!form || owner !== state.db) return false;
    const values = Object.fromEntries(new FormData(form));
    if (step === 3) values.avoids = new FormData(form).getAll("avoids");
    Object.assign(draft, values);
    return true;
  }
  function paintWizard() {
    root().querySelector("#guideSetup")?.remove();
    render();
    focusHeading();
  }
  function focusHeading() {
    root()
      .querySelector("#guideStepTitle, .guide-content h2")
      ?.focus({ preventScroll: true });
    root().scrollIntoView({ block: "start", behavior: "instant" });
  }
  async function next(event) {
    event.preventDefault();
    if (!capture()) return;
    if (step < 3) {
      step++;
      paintWizard();
      return;
    }
    if (draft.allergy === "selected" && !draft.avoids.length) {
      document.getElementById("guideSetupStatus").textContent =
        "Marque pelo menos uma restrição ou escolha outra opção.";
      return;
    }
    if (!(await LumeFoodRestrictions.review(draft))) return;
    if (owner !== state.db) return;
    const previous = state.db.profile.meuGuia;
    state.db.profile.meuGuia = {
      ...guide(),
      setup: C.setup({ ...draft, complete: true }),
    };
    if (saveDB() === false) {
      state.db.profile.meuGuia = previous;
      document.getElementById("guideSetupStatus").textContent =
        "Não foi possível guardar. Exporte um backup e libere espaço antes de tentar novamente.";
      return;
    }
    draft = null;
    tab = "summary";
    render();
    focusHeading();
    toast("Seu guia está pronto.");
  }
  function dashboard(data) {
    return `<nav class="guide-tabs" aria-label="Seções do meu guia">${[
      ["diary", "Diário"],
      ["food", "Rotinas"],
      ["summary", "Guia"],
      ["weight", "Evolução"],
    ]
      .map(
        ([id, label]) =>
          `<button type="button" aria-current="${tab === id ? "page" : "false"}" onclick="LumeGuide.go('${id}')">${label}</button>`,
      )
      .join(
        "",
      )}</nav><div class="guide-content">${tab === "food" ? food(data) : tab === "weight" ? weight(data) : summary(data)}</div>`;
  }
  function summary(data) {
    return LumeGuideVisual.summary(data);
  }
  function food(data) {
    return LumeGuideVisual.food(data, {
      kind: mealKind,
      recipe: selectedRecipe,
      scale: portion,
    });
  }
  function weight(data) {
    const entries = data.entries.slice().reverse(),
      t = C.trend(data.entries);
    return `<section class="guide-summary-intro"><h2 tabindex="-1">Seu peso ao longo do tempo.</h2><p>Registre peso, observações e fotos no seu ritmo.</p>${button("Registrar peso", "LumeGuide.edit()", true)}</section>${
      entries.length
        ? `<section class="guide-section"><h3>Ao longo do tempo</h3><dl class="guide-weight-stats"><div><dt>Último peso</dt><dd>${n(t.last.weight)} <small>kg</small></dd><span>${day(t.last.date)}</span></div><div><dt>Variação registrada</dt><dd>${t.delta === null ? "—" : (t.delta > 0 ? "+" : "") + n(t.delta)} <small>${t.delta === null ? "" : "kg"}</small></dd><span>${t.delta === null ? "Adicione outro registro para comparar" : `Desde ${day(t.first.date)}`}</span></div></dl>${chart(data.entries)}<p class="guide-small">Variação entre o primeiro e o último registro; não é uma previsão nem uma medida de gordura ou músculo. Água, horário e outras condições afetam o peso.</p>${data.entries.filter((e) => e.photos.length).length > 1 ? button("Comparar fotos", "LumeGuide.compare()") : ""}</section><section class="guide-section"><h3>Seus registros</h3><p>Toque em Editar para corrigir peso, data, observações ou fotos.</p><div class="guide-weight-list">${entries
            .slice(0, shown)
            .map(
              (e) =>
                `<article><div><h4>${n(e.weight)} <small>kg</small></h4><time datetime="${e.date}">${day(e.date)}</time>${e.notes ? `<p>${esc(e.notes)}</p>` : ""}<div class="guide-record-actions">${e.photos.length ? button(`${e.photos.length} ${e.photos.length === 1 ? "foto" : "fotos"}`, `LumeGuide.gallery('${e.id}')`) : ""}${button("Editar", `LumeGuide.edit('${e.id}')`)}</div></div><button type="button" class="guide-delete" aria-label="Excluir registro de ${day(e.date)}" onclick="LumeGuide.remove('${e.id}')">Excluir</button></article>`,
            )
            .join(
              "",
            )}</div>${entries.length > shown ? button("Ver mais registros", "LumeGuide.more()") : ""}</section>`
        : `<section class="nv-weight-empty"><div class="nv-empty-point"></div><div><h3>Seu primeiro registro começa aqui.</h3><p>Peso obrigatório. Observações e até quatro fotos são opcionais.</p></div></section>`
    }${fold("Como fazer registros comparáveis", `<p>Use a mesma balança em piso firme e, quando possível, condições parecidas de horário e roupa. Uma frequência semanal ou mensal pode ser suficiente; não é preciso se pesar todo dia.</p><p>Se registrar o peso ou ver fotos trouxer sofrimento, você pode pausar e buscar apoio. Seu guia continua útil sem isso.</p>`)}<p class="nv-footnote nv-privacy">Privado · incluído no backup · até 20 fotos no histórico.</p>`;
  }
  function chart(entries) {
    const list = entries.slice(-40);
    if (list.length < 2)
      return '<p class="guide-small">O gráfico aparece a partir de dois registros.</p>';
    const times = list.map((e) => +new Date(e.date + "T12:00:00Z")),
      values = list.map((e) => e.weight),
      min = Math.min(...values),
      max = Math.max(...values),
      span = Math.max(1, max - min),
      dt = Math.max(86400000, times.at(-1) - times[0]);
    const points = list.map((e, i) => [
      12 + ((times[i] - times[0]) / dt) * 576,
      140 - ((e.weight - min) / span) * 112,
    ]);
    return `<figure class="guide-chart"><svg viewBox="0 0 600 168" role="img" aria-label="Peso por data, ${n(min)} a ${n(max)} quilos. Os valores completos estão nos registros abaixo."><path class="guide-chart-grid" d="M12 28h576M12 84h576M12 140h576"/><polyline points="${points.map((p) => p.join(",")).join(" ")}"/>${points.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4"><title>${day(list[i].date)}: ${n(list[i].weight)} kg</title></circle>`).join("")}</svg><figcaption><span>${day(list[0].date)}</span><span>${day(list.at(-1).date)}</span></figcaption>${entries.length > 40 ? '<p class="guide-small">Gráfico dos últimos 40 registros. O histórico completo continua abaixo.</p>' : ""}</figure>`;
  }
  function edit(id) {
    syncOwner();
    const data = guide(),
      entry = id ? data.entries.find((e) => e.id === id) : null;
    if (id && !entry) return;
    if (!entry && data.entries.length >= C.limits.entries) {
      toast(
        "Limite de 1.000 registros. Exporte um backup antes de organizar seu histórico.",
      );
      return;
    }
    editor = {
      owner: state.db,
      id: id || uid(),
      photos: [...(entry?.photos || [])],
    };
    photoToken++;
    photoBusy = false;
    openSheet(
      `<div class="guide-editor"><h3>${entry ? "Editar registro" : "Registrar peso"}</h3><p>Guarde um momento, sem transformar o número em julgamento.</p><form id="guideWeightForm" onsubmit="LumeGuide.saveWeight(event)"><div class="guide-form-grid"><div class="field"><label for="guideWeightDate">Data</label><input id="guideWeightDate" name="date" type="date" max="${activityKey(new Date())}" value="${entry?.date || activityKey(new Date())}" required></div><div class="field"><label for="guideWeightValue">Peso (kg)</label><input id="guideWeightValue" name="weight" type="number" min="20" max="400" step="0.1" inputmode="decimal" value="${entry?.weight || ""}" placeholder="Ex.: 65,4" required></div></div><div class="field"><label for="guideWeightNotes">Como você está? · opcional</label><textarea id="guideWeightNotes" name="notes" rows="3" maxlength="500" placeholder="Uma observação sobre este momento">${esc(entry?.notes || "")}</textarea></div><section class="guide-photo-section"><h4>Fotos · opcionais</h4><p>Até 4 por registro. O enquadramento original é preservado, sem análise do corpo.</p><div id="guidePhotoGrid" class="guide-photo-grid"></div><label class="guide-button" for="guidePhotos">Adicionar fotos</label><input id="guidePhotos" class="guide-file-input" type="file" multiple accept="image/jpeg,image/png,image/webp" onchange="LumeGuide.receivePhotos(this)"><p class="guide-small">JPG, PNG ou WebP · até 8 MB por arquivo. Fotos são reduzidas para poupar espaço; os originais no celular não são alterados.</p><p id="guidePhotoStatus" role="status"></p></section><p id="guideWeightStatus" role="status"></p><footer class="guide-form-actions"><button type="button" class="guide-button" onclick="closeSheet()">Cancelar</button><button id="guideWeightSave" type="submit" class="primary-btn">Salvar registro</button></footer><p class="guide-small">Este registro permanece privado e não altera o peso do perfil. O último registro pode atualizar as estimativas do Meu guia.</p></form></div>`,
    );
    refreshPhotos();
  }
  function currentPhoto(token, form) {
    return (
      editor?.owner === state.db &&
      token === photoToken &&
      form === document.getElementById("guideWeightForm") &&
      document.getElementById("sheet")?.classList.contains("active")
    );
  }
  function refreshPhotos() {
    const node = document.getElementById("guidePhotoGrid");
    if (!node || !editor) return;
    node.innerHTML = editor.photos
      .map(
        (src, i) =>
          `<div><img src="${esc(src)}" alt="Foto ${i + 1} escolhida para este registro"><button type="button" class="guide-button" onclick="LumeGuide.removePhoto(${i})" aria-label="Remover foto ${i + 1}" ${photoBusy ? "disabled" : ""}>Remover</button></div>`,
      )
      .join("");
    document.getElementById("guidePhotos").disabled =
      photoBusy || editor.photos.length >= C.limits.photosPerEntry;
  }
  async function receivePhotos(input) {
    if (photoBusy) return;
    const files = [...(input.files || [])],
      token = ++photoToken,
      form = document.getElementById("guideWeightForm");
    if (!files.length || !currentPhoto(token, form)) return;
    const status = document.getElementById("guidePhotoStatus"),
      save = document.getElementById("guideWeightSave");
    const others = guide()
      .entries.filter((e) => e.id !== editor.id)
      .reduce((sum, e) => sum + e.photos.length, 0);
    if (
      files.length + editor.photos.length > C.limits.photosPerEntry ||
      others + editor.photos.length + files.length > C.limits.photosTotal
    ) {
      status.textContent =
        "Escolha até 4 fotos neste registro e no máximo 20 no histórico. Remova uma foto para liberar espaço.";
      input.value = "";
      return;
    }
    if (
      files.some(
        (f) =>
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 8 * 1024 * 1024,
      )
    ) {
      status.textContent =
        "Use JPG, PNG ou WebP, com até 8 MB por arquivo. Nenhuma foto foi adicionada.";
      input.value = "";
      return;
    }
    photoBusy = true;
    save.disabled = true;
    refreshPhotos();
    status.textContent = "Preparando fotos…";
    const ready = [];
    try {
      for (const file of files) {
        let bitmap;
        try {
          bitmap = await createImageBitmap(file);
          if (!currentPhoto(token, form)) return;
          if (
            !bitmap.width ||
            !bitmap.height ||
            bitmap.width * bitmap.height > 40000000
          )
            throw Error("size");
          const scale = Math.min(
              1,
              640 / Math.max(bitmap.width, bitmap.height),
            ),
            canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) throw Error("canvas");
          ctx.fillStyle = "#171717";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          let encoded = "";
          for (const quality of [0.8, 0.65, 0.5, 0.35, 0.2]) {
            encoded = canvas.toDataURL("image/jpeg", quality);
            if (C.photo(encoded)) break;
          }
          if (!C.photo(encoded)) throw Error("size");
          ready.push(encoded);
        } finally {
          bitmap?.close();
        }
      }
      if (!currentPhoto(token, form)) return;
      editor.photos.push(...ready);
      status.textContent = "Fotos prontas. Salve o registro para guardá-las.";
    } catch {
      if (currentPhoto(token, form))
        status.textContent =
          "Não foi possível preparar as fotos. Tente arquivos menores. Nenhuma foto desta seleção foi adicionada.";
    } finally {
      if (currentPhoto(token, form)) {
        photoBusy = false;
        save.disabled = false;
        input.value = "";
        refreshPhotos();
      }
    }
  }
  function saveWeight(event) {
    event.preventDefault();
    if (!editor || editor.owner !== state.db || photoBusy) return;
    const values = Object.fromEntries(new FormData(event.target)),
      data = guide(),
      error = document.getElementById("guideWeightStatus");
    const entry = C.normalize({
      entries: [{ ...values, id: editor.id, photos: editor.photos }],
    }).entries[0];
    if (!entry || entry.date > activityKey(new Date())) {
      error.textContent = "Confira a data e um peso entre 20 e 400 kg.";
      return;
    }
    if (data.entries.some((e) => e.date === entry.date && e.id !== entry.id)) {
      error.textContent =
        "Já existe um registro nesta data. Edite o registro existente ou escolha outro dia.";
      return;
    }
    const previous = state.db.profile.meuGuia;
    state.db.profile.meuGuia = C.normalize({
      ...data,
      entries: [...data.entries.filter((e) => e.id !== entry.id), entry],
    });
    if (saveDB() === false) {
      state.db.profile.meuGuia = previous;
      error.textContent =
        "Sem espaço para salvar. Exporte um backup e tente reduzir a quantidade de fotos.";
      return;
    }
    editor = null;
    photoToken++;
    closeSheet();
    tab = "weight";
    render();
    toast("Registro guardado.");
  }
  async function remove(id) {
    const db = state.db;
    if (!guide().entries.some((e) => e.id === id)) return;
    if (
      !(await lumeConfirm(
        "Excluir este registro?",
        "Peso, observações e fotos deste registro serão removidos. Não é possível desfazer.",
      ))
    )
      return;
    if (db !== state.db) return;
    const previous = db.profile.meuGuia;
    db.profile.meuGuia = {
      ...guide(),
      entries: guide().entries.filter((e) => e.id !== id),
    };
    if (saveDB() === false) {
      db.profile.meuGuia = previous;
      return;
    }
    render();
    toast("Registro excluído.");
  }
  function gallery(id) {
    const e = guide().entries.find((e) => e.id === id);
    if (!e) return;
    openSheet(
      `<div class="guide-gallery"><h3>${day(e.date)} · ${n(e.weight)} kg</h3><p>Seu registro visual privado. Fotos não medem composição corporal.</p>${e.photos.map((src, i) => `<img src="${esc(src)}" alt="Foto ${i + 1} do registro de ${day(e.date)}" loading="lazy">`).join("")}${e.notes ? `<p>${esc(e.notes)}</p>` : ""}<button class="guide-button" onclick="closeSheet()">Fechar fotos</button></div>`,
    );
  }
  function compare() {
    const entries = guide().entries.filter((e) => e.photos.length);
    if (entries.length < 2) return;
    openSheet(
      `<div class="guide-compare"><h3>Dois momentos da sua história.</h3><p>Escolha dois registros. Luz, roupa e postura mudam a aparência; fotos não identificam ganho de músculo ou perda de gordura.</p><div class="guide-form-grid">${["a", "b"].map((side, i) => `<div class="field"><label for="guideCompare-${side}">${i ? "Segundo momento" : "Primeiro momento"}</label><select id="guideCompare-${side}" onchange="LumeGuide.paintComparison()">${entries.map((e, j) => `<option value="${e.id}" ${j === (i ? entries.length - 1 : 0) ? "selected" : ""}>${day(e.date)} · ${n(e.weight)} kg</option>`).join("")}</select></div>`).join("")}</div><div id="guideComparePhotos"></div><button class="guide-button" onclick="closeSheet()">Fechar comparação</button></div>`,
    );
    paintComparison();
  }
  function paintComparison() {
    const node = document.getElementById("guideComparePhotos");
    if (!node) return;
    node.innerHTML = ["a", "b"]
      .map((side) => {
        const id = document.getElementById("guideCompare-" + side).value,
          e = guide().entries.find((e) => e.id === id);
        return e
          ? `<section><h4>${day(e.date)}</h4>${e.photos.map((src, i) => `<img src="${esc(src)}" alt="Foto ${i + 1} de ${day(e.date)}" loading="lazy">`).join("")}</section>`
          : "";
      })
      .join("");
  }
  function mutateGuide(change, renderOptions = { quiet: true }) {
    if (owner !== state.db) return false;
    const previous = state.db.profile.meuGuia,
      data = guide();
    change(data);
    state.db.profile.meuGuia = C.normalize(data);
    if (saveDB() === false) {
      state.db.profile.meuGuia = previous;
      toast("Não foi possível guardar. Exporte um backup e libere espaço.");
      return false;
    }
    render(renderOptions);
    return true;
  }
  function quickConfig() {
    syncOwner();
    quickOwner = state.db;
    const s = guide().setup;
    const input = (label, key, min, max, step = "1") =>
      `<div class="field"><label for="gq-${key}">${label}</label><input id="gq-${key}" name="${key}" type="number" min="${min}" max="${max}" step="${step}" inputmode="decimal" value="${esc(s[key] ?? "")}"></div>`;
    const selectQuick = (label, key) =>
      `<div class="field"><label for="gq-${key}">${label}</label><select id="gq-${key}" name="${key}" ${key === "allergy" ? 'onchange="LumeGuide.restrictions(this.value)"' : ""}>${Object.entries(
        C.choices[key],
      )
        .map(
          ([v, label]) =>
            `<option value="${v}" ${s[key] === v ? "selected" : ""}>${label}</option>`,
        )
        .join("")}</select></div>`;
    openSheet(
      `<div class="guide-editor nv-quick"><h3>Suas referências</h3><p class="nv-footnote">Revise o contexto e os dados usados. Nada é alterado no perfil ou no diário.</p><form id="guideQuickForm" onsubmit="LumeGuide.saveQuick(event)">${selectQuick("Seu contexto", "context")}<div class="guide-form-grid">${input("Idade (anos)", "age", 1, 110)}${input("Peso atual (kg)", "weight", 20, 400, ".1")}${input("Altura (cm)", "height", 100, 250, ".1")}</div>${selectQuick("Referência da equação", "sex")}${selectQuick("Atividade diária", "activity")}${selectQuick("Proteína para sua rotina", "proteinMode")}${selectQuick("Cenário de energia", "energyMode")}<p class="nv-footnote">Ganho e redução usam cenários leves de ±10%. A redução é desativada quando ultrapassa os limites deste recurso.</p>${fold(
        "Alimentação e restrições",
        `${selectQuick("Preferência alimentar", "pattern")}${selectQuick("Tempo de preparo", "time")}${selectQuick("Restrições alimentares", "allergy")}<fieldset id="guideAvoids" class="guide-avoids" ${s.allergy === "selected" ? "" : "hidden"}><legend>Alimentos a evitar</legend>${Object.entries(
          C.choices.allergens,
        )
          .map(
            ([v, label]) =>
              `<label><input type="checkbox" name="avoids" value="${v}" ${s.avoids.includes(v) ? "checked" : ""}><span>${label}</span></label>`,
          )
          .join("")}</fieldset>${LumeFoodRestrictions.field(s)}`,
      )}<p id="guideQuickStatus" role="status"></p><footer class="guide-form-actions"><button type="button" class="guide-button" onclick="closeSheet()">Cancelar</button><button type="submit" class="primary-btn">Atualizar referências</button></footer></form></div>`,
    );
  }
  async function saveQuick(event) {
    event.preventDefault();
    if (quickOwner !== state.db) return;
    const values = new FormData(event.target),
      s = C.setup({
        ...guide().setup,
        ...Object.fromEntries(values),
        avoids: values.getAll("avoids"),
        complete: true,
      });
    if (s.allergy === "selected" && !s.avoids.length) {
      document.getElementById("guideQuickStatus").textContent =
        "Marque os alimentos a evitar ou escolha outra opção.";
      return;
    }
    if (!(await LumeFoodRestrictions.review(s))) return;
    if (quickOwner !== state.db) return;
    if (mutateGuide((data) => (data.setup = s))) {
      closeSheet();
      toast("Referências atualizadas.");
    }
  }
  return {
    energyMode(value) {
      if (!["maintain", "gain", "lose"].includes(value)) return;
      mutateGuide((data) => {
        data.setup.energyMode = value;
      });
      document
        .querySelector(".nv-energy-modes [aria-pressed=true]")
        ?.focus({ preventScroll: true });
    },
    proteinMode(value) {
      if (!["daily", "training"].includes(value)) return;
      const saved = mutateGuide((data) => {
        data.setup.proteinMode = value;
      });
      document
        .querySelector(".nv-protein-mode [aria-pressed=true]")
        ?.focus({ preventScroll: true });
    },
    quickConfig,
    saveQuick,
    explain(key) {
      openSheet(LumeGuideVisual.explanation(key, guide()));
    },
    kind(value) {
      if (!["Café da manhã", "Almoço", "Lanche", "Jantar"].includes(value))
        return;
      mealKind = value;
      selectedRecipe = "";
      portion = 1;
      render({ quiet: true });
      document
        .querySelector(".nv-meal-tabs [aria-pressed=true]")
        ?.focus({ preventScroll: true });
    },
    recipe(id) {
      const recipe = LumeNutrition.library(guide().setup).find(
        (r) => r.id === id,
      );
      if (!recipe) return;
      selectedRecipe = id;
      mealKind = recipe.kind;
      portion = 1;
      render({ quiet: true });
      document
        .querySelector(".nv-recipe-options [aria-pressed=true]")
        ?.focus({ preventScroll: true });
    },
    portion(value) {
      const number = C.number(value, 0.5, 2);
      if (number === null) return;
      portion = number;
      render({ quiet: true });
      document
        .querySelector(".nv-portions [aria-pressed=true]")
        ?.focus({ preventScroll: true });
    },
    addMenu(id, scale) {
      const recipe = LumeNutrition.options(guide().setup).find(
        (r) => r.id === id,
      );
      if (!recipe || C.number(scale, 0.5, 2) === null) return;
      const saved = mutateGuide((data) => {
        data.menu = data.menu.filter(
          (x) =>
            LumeNutrition.recipes.find((r) => r.id === x.id)?.kind !==
            recipe.kind,
        );
        data.menu.push({ id, scale });
      });
      if (saved) {
        document
          .querySelector(".nv-recipe>.primary-btn")
          ?.focus({ preventScroll: true });
        toast(recipe.kind + " no seu rascunho.");
      }
    },
    removeMenu(id) {
      mutateGuide((data) => (data.menu = data.menu.filter((x) => x.id !== id)));
    },
    clearIncompatibleMenu() {
      const valid = new Set(
        LumeNutrition.options(guide().setup).map((r) => r.id),
      );
      mutateGuide(
        (data) => (data.menu = data.menu.filter((x) => valid.has(x.id))),
      );
    },
    water(amount) {
      if (![250, -250].includes(amount)) return;
      const today = activityKey(new Date());
      const before = guide(),
        ref = LumeNutrition.references(before.setup, before.entries).drinks;
      const target = ref ? (ref[0] + ref[1]) / 2 : 0;
      const from = target
        ? Math.min(
            1,
            (before.water.find((x) => x.date === today)?.ml || 0) / target,
          )
        : 0;
      const saved = mutateGuide(
        (data) => {
          const previous = data.water.find((x) => x.date === today)?.ml || 0;
          data.water = data.water.filter((x) => x.date !== today);
          data.water.push({
            date: today,
            ml: Math.max(0, Math.min(10000, previous + amount)),
          });
        },
        { quiet: true, waterFrom: from },
      );
      if (saved) {
        document
          .querySelector(
            amount > 0
              ? ".nv-water-actions button:last-child"
              : ".nv-water-actions button:first-child",
          )
          ?.focus({ preventScroll: true });
        toast(
          (guide().water.find((x) => x.date === today)?.ml || 0).toLocaleString(
            "pt-BR",
          ) + " mL registrados hoje.",
        );
      }
    },
    render,
    start,
    next,
    edit,
    receivePhotos,
    saveWeight,
    remove,
    gallery,
    compare,
    paintComparison,
    restrictions(value) {
      const field = document.getElementById("guideAvoids");
      if (field) field.hidden = value !== "selected";
    },
    back() {
      if (capture()) {
        step = Math.max(0, step - 1);
        paintWizard();
      }
    },
    cancel() {
      draft = null;
      render();
    },
    explore() {
      explore = true;
      tab = "food";
      render();
    },
    go(value) {
      if (value === "diary") {
        switchTab("nutrition");
        return;
      }
      if (!["summary", "food", "weight"].includes(value)) return;
      syncOwner();
      tab = value;
      render();
      focusHeading();
    },
    more() {
      shown += 12;
      render();
    },
    removePhoto(i) {
      if (!editor || editor.owner !== state.db || photoBusy) return;
      editor.photos.splice(i, 1);
      refreshPhotos();
    },
    density(event) {
      event.preventDefault();
      const v = Object.fromEntries(new FormData(event.target)),
        d = C.density(v.energy, v.grams);
      document.getElementById("guideDensityResult").textContent =
        d === null
          ? "Confira os valores da mesma porção."
          : `${n(d, 2)} kcal/g · cálculo dos valores informados.`;
    },
  };
})();
renderKnowledge = () => LumeGuide.render();
renderKnowledge();
