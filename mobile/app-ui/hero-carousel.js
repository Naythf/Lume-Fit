// Decorative photos change independently of the workout and its primary action.
const STUDIO_HERO_PHOTOS = [
  "weights-bg.webp",
  "__HERO_RACK__",
  "__HERO_BARBELL__",
];
function studioHeroFrames() {
  return `<div class="studio-hero-photos" aria-hidden="true">${STUDIO_HERO_PHOTOS.map((src, i) => `<img class="studio-hero-frame ${i === 0 ? "is-active" : ""}" src="${src}" alt="" width="1200" height="800" decoding="async" draggable="false">`).join("")}</div>`;
}
function studioHeroControls() {
  return `<div class="studio-carousel-controls" aria-label="Fotos do destaque"><div class="studio-carousel-dots">${STUDIO_HERO_PHOTOS.map((_, i) => `<button type="button" data-hero-photo="${i}" aria-label="Ver foto ${i + 1} de ${STUDIO_HERO_PHOTOS.length}" ${i === 0 ? 'aria-current="true"' : ""}><i aria-hidden="true"></i></button>`).join("")}</div><div class="studio-carousel-actions"><button type="button" data-hero-command="previous" aria-label="Foto anterior">${studioChevron()}</button><button type="button" data-hero-command="pause" aria-label="Pausar troca automática de fotos" aria-pressed="false"></button><button type="button" data-hero-command="next" aria-label="Próxima foto">${studioChevron("right")}</button></div></div>`;
}
window.LumeHeroCarousel = (() => {
  let hero = null,
    timer = null,
    index = 0,
    paused = false,
    hovered = false,
    focusPaused = false,
    inView = false,
    touch = null,
    viewObserver = null;
  const clear = () => {
    clearTimeout(timer);
    timer = null;
  };
  function draw() {
    if (!hero) return;
    hero.dataset.heroIndex = String(index);
    hero
      .querySelectorAll(".studio-hero-frame")
      .forEach((img, i) => img.classList.toggle("is-active", i === index));
    hero.querySelectorAll("[data-hero-photo]").forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    const button = hero.querySelector('[data-hero-command="pause"]'),
      reduced = LumeMotionPreference.matches;
    if (button) {
      const key = String(paused || reduced);
      if (button.dataset.paused !== key) {
        button.dataset.paused = key;
        button.setAttribute("aria-pressed", key);
        button.innerHTML =
          key === "true"
            ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg>';
      }
      button.disabled = reduced;
      button.setAttribute(
        "aria-label",
        reduced
          ? "Troca automática desativada: movimento reduzido"
          : paused
            ? "Retomar troca automática de fotos"
            : "Pausar troca automática de fotos",
      );
    }
  }
  function canRun() {
    return (
      !!hero?.isConnected &&
      hero.closest(".screen")?.classList.contains("active") &&
      !document.hidden &&
      inView &&
      !paused &&
      !hovered &&
      !focusPaused &&
      !LumeMotionPreference.matches
    );
  }
  function sync() {
    draw();
    if (!canRun()) {
      clear();
      return;
    }
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      if (canRun()) move(index + 1);
    }, 6500);
  }
  function move(next) {
    if (!hero) return;
    index = (next + STUDIO_HERO_PHOTOS.length) % STUDIO_HERO_PHOTOS.length;
    clear();
    draw();
    sync();
  }
  function enhance() {
    const next = document.querySelector("#screen-home [data-studio-hero]");
    if (next === hero) {
      sync();
      return;
    }
    clear();
    viewObserver?.disconnect();
    hero = next;
    hovered = false;
    focusPaused = false;
    inView = false;
    if (!hero) return;
    hero.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-hero-photo]"),
        button = e.target.closest("[data-hero-command]");
      if (dot) move(Number(dot.dataset.heroPhoto));
      else if (button) {
        const command = button.dataset.heroCommand;
        if (command === "pause") {
          paused = !paused;
          if (!paused) {
            hovered = false;
            focusPaused = false;
          }
          sync();
        } else move(index + (command === "next" ? 1 : -1));
      }
    });
    hero.addEventListener("mouseenter", () => {
      hovered = true;
      sync();
    });
    hero.addEventListener("mouseleave", () => {
      hovered = false;
      sync();
    });
    hero.addEventListener("focusin", () => {
      focusPaused = true;
      sync();
    });
    hero.addEventListener("focusout", () =>
      queueMicrotask(() => {
        focusPaused = !!hero?.contains(document.activeElement);
        sync();
      }),
    );
    hero.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" || e.target.closest("button")) return;
      touch = { x: e.clientX, y: e.clientY };
    });
    hero.addEventListener("pointercancel", () => (touch = null));
    hero.addEventListener("pointerup", (e) => {
      if (!touch) return;
      const dx = e.clientX - touch.x,
        dy = e.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2)
        move(index + (dx < 0 ? 1 : -1));
    });
    if (typeof IntersectionObserver === "function") {
      viewObserver = new IntersectionObserver(
        (entries) => {
          inView = entries.some((e) => e.isIntersecting);
          sync();
        },
        { threshold: 0.2 },
      );
      viewObserver.observe(hero);
    } else inView = true;
    sync();
  }
  LumeMotionPreference.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  new MutationObserver(sync).observe(document.getElementById("screen-home"), {
    attributes: true,
    attributeFilter: ["class"],
  });
  return { enhance };
})();
