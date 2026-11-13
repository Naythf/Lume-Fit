/* Five destinations; each photograph, copy and action change together. */
const STUDIO_HERO_PHOTOS = [
  "weights-bg.webp",
  "__HERO_FOOD__",
  "__HERO_BARBELL__",
  "__HERO_RACK__",
  "__HERO_GYM__",
];
function studioHeroPages(db, active) {
  const count = db.routines.length;
  return [
    {
      key: "workouts",
      eyebrow: active ? "Em andamento" : "Seu próximo passo",
      title: active ? active.name : "Seu treino, do seu jeito.",
      description: active
        ? "Continue de onde parou. Seu rascunho está salvo."
        : count
          ? `${count} ${count === 1 ? "rotina pronta" : "rotinas prontas"} para organizar sua semana.`
          : "Escolha seus movimentos ou monte uma rotina automática.",
      action: active ? "Continuar treino" : "Organizar meu treino",
      destination: active ? "register" : "workouts",
    },
    {
      key: "nutrition",
      eyebrow: "Alimentação",
      title: "Um espaço para suas refeições.",
      description: "Registre o que fez parte do seu dia. Com foto, se quiser.",
      action: "Abrir diário",
      destination: "nutrition",
    },
    {
      key: "history",
      eyebrow: "Seu percurso",
      title: "Cada treino conta uma história.",
      description: "Reveja seus registros e acompanhe a sua constância.",
      action: "Ver histórico",
      destination: "history",
    },
    {
      key: "knowledge",
      eyebrow: "Meu guia",
      title: "Mais clareza em cada escolha.",
      description: "Consulte referências e ferramentas para o seu dia.",
      action: "Abrir meu guia",
      destination: "knowledge",
    },
    {
      key: "friends",
      eyebrow: "Amigos",
      title: "Compartilhe o seu ritmo.",
      description:
        "Encontre suas conexões e escolha o que deseja compartilhar.",
      action: "Ver amigos",
      destination: "friends",
    },
  ];
}
function studioHeroMarkup() {
  const pages = studioHeroPages(state.db, state.activeWorkout),
    p = pages[0];
  return `<section class="studio-session studio-reveal" aria-label="Destaques do Lume Fit" aria-roledescription="carrossel" data-studio-hero><div class="studio-hero-photos" aria-hidden="true">${STUDIO_HERO_PHOTOS.map((src, i) => `<img class="studio-hero-frame ${i === 0 ? "is-active" : ""}" src="${src}" alt="" width="1200" height="800" decoding="async" draggable="false">`).join("")}</div><div class="studio-session-copy"><span class="studio-session-state" data-hero-copy="eyebrow">${esc(p.eyebrow)}</span><h2 data-hero-copy="title">${esc(p.title)}</h2><p data-hero-copy="description">${esc(p.description)}</p><button type="button" class="primary-btn" data-hero-destination="${p.destination}"><span data-hero-copy="action">${esc(p.action)}</span><span aria-hidden="true">${studioChevron("right")}</span></button></div><div class="studio-carousel-controls"><div class="studio-carousel-dots" role="group" aria-label="Escolher destaque">${pages.map((page, i) => `<button type="button" data-hero-photo="${i}" aria-label="${esc(page.eyebrow)} — ${i + 1} de 5" ${i === 0 ? 'aria-current="true"' : ""}><i aria-hidden="true"></i></button>`).join("")}</div></div></section>`;
}
window.LumeHeroCarousel = (() => {
  let hero = null,
    timer = null,
    index = 0,
    drawn = -1,
    keyboardPaused = false,
    pointerHeld = false,
    pointerId = null,
    inView = false,
    touch = null,
    observer = null,
    animations = [];
  const clear = () => {
    clearTimeout(timer);
    timer = null;
  };
  const cancelMotion = () => {
    animations.forEach((a) => a.cancel());
    animations = [];
  };
  function draw() {
    if (!hero || drawn === index) return;
    const page = studioHeroPages(state.db, state.activeWorkout)[index];
    const wasDrawn = drawn !== -1;
    drawn = index;
    hero.dataset.heroIndex = String(index);
    hero
      .querySelectorAll(".studio-hero-frame")
      .forEach((img, i) => img.classList.toggle("is-active", i === index));
    hero
      .querySelectorAll("[data-hero-photo]")
      .forEach((b, i) =>
        i === index
          ? b.setAttribute("aria-current", "true")
          : b.removeAttribute("aria-current"),
      );
    hero
      .querySelectorAll("[data-hero-copy]")
      .forEach((el) => (el.textContent = page[el.dataset.heroCopy]));
    hero.querySelector("[data-hero-destination]").dataset.heroDestination =
      page.destination;
    cancelMotion();
    if (wasDrawn && !LumeMotionPreference.matches) {
      animations = [...hero.querySelectorAll(".studio-session-copy > *")]
        .filter((el) => el.animate)
        .map((el, i) =>
          el.animate(
            [
              { opacity: 0, transform: "translateY(18px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 560,
              delay: i * 55,
              easing: "cubic-bezier(.2,.7,.3,1)",
              fill: "backwards",
            },
          ),
        );
    }
  }
  function canRun() {
    return (
      !!hero?.isConnected &&
      hero.closest(".screen")?.classList.contains("active") &&
      !document.hidden &&
      inView &&
      !keyboardPaused &&
      !pointerHeld &&
      !document.querySelector(
        ".sheet.active,dialog[open],.personalize-panel:not([hidden])",
      ) &&
      !LumeMotionPreference.matches
    );
  }
  function sync() {
    if (LumeMotionPreference.matches) cancelMotion();
    draw();
    if (!canRun()) {
      clear();
      return;
    }
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      if (canRun()) move(index + 1);
    }, 8000);
  }
  function move(next) {
    index = (next + 5) % 5;
    clear();
    draw();
    sync();
  }
  function finishPointer(event, cancelled = false) {
    if (!pointerHeld || (event && pointerId !== event.pointerId)) return;
    pointerHeld = false;
    pointerId = null;
    const start = touch;
    touch = null;
    if (!cancelled && start && event) {
      const dx = event.clientX - start.x,
        dy = event.clientY - start.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        move(index + (dx < 0 ? 1 : -1));
        return;
      }
    }
    sync();
  }
  function enhance() {
    const next = document.querySelector("#screen-home [data-studio-hero]");
    if (next === hero) {
      sync();
      return;
    }
    clear();
    cancelMotion();
    observer?.disconnect();
    hero = next;
    index = 0;
    drawn = -1;
    keyboardPaused = false;
    pointerHeld = false;
    pointerId = null;
    inView = false;
    touch = null;
    if (!hero) return;
    hero.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-hero-photo]"),
        action = e.target.closest("[data-hero-destination]");
      if (dot) {
        move(Number(dot.dataset.heroPhoto));
      } else if (action) {
        clear();
        const destination = action.dataset.heroDestination;
        if (
          ![
            "workouts",
            "nutrition",
            "history",
            "knowledge",
            "friends",
            "register",
          ].includes(destination)
        )
          return;
        if (destination === "workouts") state.selectedRoutineId = null;
        switchTab(destination);
      }
    });
    hero.addEventListener("focusin", (event) => {
      keyboardPaused = event.target.matches(":focus-visible");
      sync();
    });
    hero.addEventListener("focusout", () =>
      queueMicrotask(() => {
        if (!hero?.contains(document.activeElement)) keyboardPaused = false;
        sync();
      }),
    );
    hero.addEventListener("pointerdown", (e) => {
      if (pointerHeld) return;
      pointerHeld = true;
      pointerId = e.pointerId;
      keyboardPaused = false;
      clear();
      if (e.pointerType !== "mouse" && !e.target.closest("button"))
        touch = { x: e.clientX, y: e.clientY };
    });
    hero.addEventListener("pointerup", (event) => finishPointer(event));
    hero.addEventListener("pointercancel", (event) =>
      finishPointer(event, true),
    );
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(
        (entries) => {
          inView = entries.some((e) => e.isIntersecting);
          sync();
        },
        { threshold: 0.2 },
      );
      observer.observe(hero);
    } else inView = true;
    sync();
  }
  LumeMotionPreference.addEventListener("change", sync);
  document.addEventListener("pointerup", (event) => finishPointer(event));
  document.addEventListener("pointercancel", (event) =>
    finishPointer(event, true),
  );
  window.addEventListener("blur", () => finishPointer(null, true));
  document.addEventListener("visibilitychange", sync);
  new MutationObserver(sync).observe(document.getElementById("screen-home"), {
    attributes: true,
    attributeFilter: ["class"],
  });
  for (const id of [
    "sheet",
    "dialogOverlay",
    "autoRoutineDialog",
    "legalDialog",
    "personalizePanel",
  ]) {
    const overlay = document.getElementById(id);
    if (overlay)
      new MutationObserver(sync).observe(overlay, {
        attributes: true,
        attributeFilter: ["class", "open", "hidden"],
      });
  }
  return { enhance };
})();
