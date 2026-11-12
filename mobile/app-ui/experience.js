/* App-only presentation; private exercise guides live in the existing profile document. */
function lumeVideo(value) {
  if (!value) return "";
  try {
    const u = new URL(String(value).trim());
    if (u.protocol !== "https:" || u.username || u.password) return "";
    const h = u.hostname.toLowerCase();
    if (
      ![
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "tiktok.com",
        "www.tiktok.com",
        "vm.tiktok.com",
        "vt.tiktok.com",
        "instagram.com",
        "www.instagram.com",
      ].includes(h)
    )
      return "";
    if (
      h.includes("youtube") &&
      !(
        (u.pathname === "/watch" &&
          /^[\w-]{11}$/.test(u.searchParams.get("v") || "")) ||
        /^\/(shorts|embed)\/[\w-]{11}/.test(u.pathname)
      )
    )
      return "";
    if (h === "youtu.be" && !/^\/[\w-]{11}$/.test(u.pathname)) return "";
    if (
      h.includes("instagram") &&
      !/^\/(reel|reels|p)\/[\w-]+\/?$/.test(u.pathname)
    )
      return "";
    if (
      h.includes("tiktok") &&
      !(
        /\/@[^/]+\/video\/\d+/.test(u.pathname) ||
        (["vm.tiktok.com", "vt.tiktok.com"].includes(h) &&
          u.pathname.length > 2)
      )
    )
      return "";
    u.hash = "";
    return u.href.slice(0, 1200);
  } catch {
    return "";
  }
}
function lumeGuide(exercise) {
  const saved = state.db.profile.exerciseGuides?.[exercise.id];
  const c =
    typeof catalogExercise === "function"
      ? catalogExercise(exercise.catalogId)
      : null;
  return {
    description: String(saved?.description || "").slice(0, 2000),
    video: lumeVideo(saved?.video),
    suggestion: c && c.name === exercise.name ? c.note : "",
  };
}
function lumeGuideFields(item) {
  const g = lumeGuide(item || {});
  return `<details class="lume-guide-fields" open><summary>Como executar · opcional</summary><div class="field"><label for="lumeDescription">Descrição da execução</label><textarea id="lumeDescription" name="lumeDescription" maxlength="2000" rows="4" placeholder="Posição inicial, movimento e o que você quer lembrar…">${esc(g.description)}</textarea></div><div class="field"><label for="lumeVideo">Vídeo de referência</label><input id="lumeVideo" name="lumeVideo" type="url" maxlength="1200" placeholder="Link do YouTube, TikTok ou Instagram" value="${esc(g.video)}"><p class="hint">Opcional. O vídeo abre na plataforma original e precisa de internet.</p></div>${g.suggestion ? `<p class="hint">Referência do catálogo: ${esc(g.suggestion)}</p>` : ""}</details>`;
}
const lumeOriginalExerciseSheet = openExerciseSheet;
openExerciseSheet = function (
  routineId = state.selectedRoutineId,
  exerciseId = null,
) {
  lumeOriginalExerciseSheet(routineId, exerciseId);
  const form = document.querySelector(
    'form.training-form[onsubmit="saveExercise(event)"]',
  );
  if (!form) return;
  const item = state.db.routines
    .find((r) => r.id === form.elements.routineId.value)
    ?.exercises.find((e) => e.id === exerciseId);
  const advanced = document.createElement("details");
  advanced.className = "lume-advanced";
  advanced.innerHTML = "<summary>Foco muscular e aparência</summary>";
  const muscle = form.querySelector(".muscle-editor");
  if (muscle) {
    muscle.before(advanced);
    advanced.append(muscle);
    const picker = form.querySelector("fieldset:not(.muscle-editor)");
    if (picker) advanced.append(picker);
    advanced.insertAdjacentHTML("beforebegin", lumeGuideFields(item));
  } else
    form
      .querySelector(".editor-actions")
      .insertAdjacentHTML("beforebegin", lumeGuideFields(item));
};
const lumeOriginalSave = saveExercise;
saveExercise = function (event) {
  const f = event.target;
  const raw = f.elements.lumeVideo?.value.trim() || "";
  if (raw && !lumeVideo(raw)) {
    toast("Use um link HTTPS de vídeo do YouTube, TikTok ou Instagram.");
    f.elements.lumeVideo.focus();
    return event.preventDefault();
  }
  const routine = state.db.routines.find(
      (r) => r.id === f.elements.routineId.value,
    ),
    before = new Set(routine?.exercises.map((e) => e.id));
  const previousSave = saveDB;
  saveDB = function () {
    const id =
      f.elements.exerciseId.value ||
      routine?.exercises.find((e) => !before.has(e.id))?.id;
    if (id) {
      state.db.profile.exerciseGuides ??= {};
      const description = String(f.elements.lumeDescription?.value || "")
        .trim()
        .slice(0, 2000);
      if (description || raw)
        state.db.profile.exerciseGuides[id] = {
          description,
          video: lumeVideo(raw),
        };
      else delete state.db.profile.exerciseGuides[id];
    }
    return previousSave();
  };
  try {
    return lumeOriginalSave(event);
  } finally {
    saveDB = previousSave;
  }
};
const lumeOriginalMuscle = openMuscleDetails;
function lumeEmbed(value) {
  const safe = lumeVideo(value);
  if (!safe) return "";
  const u = new URL(safe);
  if (u.hostname.includes("youtu")) {
    const id =
      u.hostname === "youtu.be"
        ? u.pathname.slice(1)
        : u.searchParams.get("v") || u.pathname.split("/")[2];
    return "https://www.youtube-nocookie.com/embed/" + id;
  }
  if (u.hostname.includes("tiktok")) {
    const id = u.pathname.match(/\/video\/(\d+)/)?.[1];
    return id ? "https://www.tiktok.com/player/v1/" + id : "";
  }
  return "";
}
function lumeActivateVideo(button) {
  const src = lumeEmbed(button.dataset.video);
  if (!src) return;
  const frame = document.createElement("iframe");
  frame.src = src;
  frame.className = "lume-video-frame";
  frame.title = "Vídeo de referência do exercício";
  frame.allow = "fullscreen; encrypted-media; picture-in-picture";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.setAttribute("allowfullscreen", "");
  button.replaceWith(frame);
}
function lumeAddPlayer() {
  const link = document.querySelector(".lume-guide a");
  if (!link || !lumeEmbed(link.href)) return;
  const button = document.createElement("button");
  button.className = "ghost-btn lume-video-activate";
  button.type = "button";
  button.textContent = "Carregar vídeo aqui";
  button.dataset.video = link.href;
  button.onclick = () => lumeActivateVideo(button);
  const note = document.createElement("p");
  note.className = "hint";
  note.textContent =
    "Ao carregar, você se conecta à plataforma do vídeo. Precisa de internet. Se não reproduzir, abra o link original.";
  link.before(button, note);
}
openMuscleDetails = function (routineId, exerciseId) {
  lumeOriginalMuscle(routineId, exerciseId);
  const e = state.db.routines
    .find((r) => r.id === routineId)
    ?.exercises.find((e) => e.id === exerciseId);
  if (!e) return;
  const g = lumeGuide(e);
  document
    .querySelector("#sheetContent h3")
    ?.insertAdjacentHTML(
      "afterend",
      `<section class="lume-guide"><h4>Como executar</h4><p>${esc(g.description || g.suggestion || "Adicione sua descrição e um vídeo nas opções deste exercício.")}</p>${g.suggestion && !g.description ? '<p class="hint">Orientação do catálogo. Confira a variação e ajuste à sua execução.</p>' : ""}${g.video ? `<a href="${esc(g.video)}" target="_blank" rel="noopener noreferrer">Assistir ao vídeo de referência</a>` : ""}</section>`,
    );
};
function lumeMore() {
  openSheet(
    `<button class="icon-btn" style="float:right" aria-label="Fechar Lume Hub" onclick="closeSheet()">×</button><h3>Seu Lume Hub</h3><p class="editor-intro">Tudo continua aqui. Escolha o que quer acompanhar.</p><div class="more-list">${[
      [
        "frequency",
        "Frequência e histórico",
        "Seu calendário, metas e sessões",
      ],
      ["friends", "Amigos", "Conexões e perfil social"],
      ["knowledge", "Saber", "Referências e ferramentas"],
      ["settings", "Ajustes", "Perfil, dados e preferências"],
    ]
      .map(
        ([id, title, desc]) =>
          `<button onclick="closeSheet();switchTab('${id}')"><strong>${title}</strong><span>${desc}</span></button>`,
      )
      .join("")}</div>`,
  );
}
const lumeOriginalClose = closeSheet;
closeSheet = function () {
  lumeOriginalClose();
  if (document.getElementById("sheet").getAttribute("aria-hidden") === "true")
    document
      .querySelectorAll("#sheet iframe")
      .forEach((frame) => frame.remove());
};
function lumeActiveGuide() {
  const a = state.activeWorkout,
    e = a?.entries[a.index];
  if (!e) return;
  const routine = state.db.routines.find((r) =>
    r.exercises.some((x) => x.id === e.exerciseId),
  );
  if (routine) openMuscleDetails(routine.id, e.exerciseId);
  else {
    const g = lumeGuide({ id: e.exerciseId });
    openSheet(
      `<h3>${esc(e.name)}</h3><section class="lume-guide"><h4>Como executar</h4><p>${esc(g.description || "A referência deste exercício não está disponível nesta rotina.")}</p>${g.video ? `<a href="${esc(g.video)}" target="_blank" rel="noopener noreferrer">Abrir vídeo original</a>` : ""}</section>`,
    );
  }
}
const lumeOriginalHome = renderHome;
renderHome = function () {
  lumeOriginalHome();
  const root = document.getElementById("screen-home"),
    stats = root.querySelector(".stats");
  if (stats) {
    const fold = document.createElement("details");
    fold.className = "lume-fold";
    fold.innerHTML = "<summary>Seu progresso em números</summary>";
    stats.before(fold);
    fold.append(stats);
  }
};
function lumeSetup() {
  const nav = document.getElementById("bottomNav");
  if (!nav) return;
  const oldMore = nav.querySelector("[data-tab=settings]");
  const more = oldMore.cloneNode(true);
  oldMore.replaceWith(more);
  for (const b of [...nav.querySelectorAll("button")])
    if (!["home", "workouts", "nutrition", "settings"].includes(b.dataset.tab))
      b.remove();
  more.removeAttribute("data-tab");
  more.setAttribute("onclick", "lumeMore()");
  more.querySelector("span").textContent = "Mais";
  more.setAttribute("aria-label", "Mais opções do Lume Hub");
}
lumeSetup();
// Reveal only when a section enters view. Nothing starts hidden if JS fails.
const lumeSeen = new WeakSet();
const lumeObserver = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries)
      if (isIntersecting) {
        if (document.documentElement.dataset.motion === "full")
          target.classList.add("lume-reveal");
        lumeObserver.unobserve(target);
      }
  },
  { threshold: 0.08 },
);
function lumeEnhance() {
  document
    .querySelectorAll(
      ".screen.active > .routine-list > article,.screen.active > .card,.screen.active > .hero-card,.screen.active > .lume-fold,.screen.active > .food-home-link,.screen.active > .mini-list",
    )
    .forEach((el) => {
      if (!lumeSeen.has(el)) {
        lumeSeen.add(el);
        lumeObserver.observe(el);
      }
    });
  const hero = document.querySelector(".gw-hero");
  if (hero && !hero.querySelector("[data-lume-guide]")) {
    const button = document.createElement("button");
    button.className = "ghost-btn";
    button.dataset.lumeGuide = "true";
    button.textContent = "Execução e vídeo";
    button.onclick = lumeActiveGuide;
    hero.append(button);
  }
  window.LumeModels?.enhance();
}
let lumeFrame = false;
new MutationObserver(() => {
  if (lumeFrame) return;
  lumeFrame = true;
  requestAnimationFrame(() => {
    lumeFrame = false;
    lumeEnhance();
  });
}).observe(document.getElementById("mainContent"), {
  childList: true,
  subtree: true,
});
new MutationObserver(() => {
  window.LumeModels?.enhance();
  const guide = document.querySelector(".lume-guide");
  if (guide && !guide.dataset.playerReady) {
    guide.dataset.playerReady = "true";
    lumeAddPlayer();
  }
}).observe(document.getElementById("sheetContent"), {
  childList: true,
  subtree: true,
});
const lumeOriginalSwitch = switchTab;
switchTab = function (tab) {
  lumeOriginalSwitch(tab);
  window.scrollTo({ top: 0, behavior: "auto" });
  if (!["home", "workouts", "nutrition"].includes(tab))
    document
      .querySelector("#bottomNav button:last-child")
      ?.classList.add("active");
  document.querySelectorAll('#bottomNav button').forEach(button=>{
    if(button.classList.contains('active'))button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
};
