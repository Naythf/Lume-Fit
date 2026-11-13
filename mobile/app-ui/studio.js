/* Lume Studio: app-specific information architecture, never applied to the published site. */
function studioHome() {
  const now = new Date();
  const recent = activitySessions(state.db.sessions)
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 2);
  const month = getMonthSessions(now).length,
    goal = frequencyPct(),
    exercises = allExercises().length;
  const meals = (state.db.nutrition?.meals || []).filter(
    (m) => m.date === activityKey(now),
  ).length;
  const name = String(state.db.profile.name || "").trim() || "Atleta";
  document.getElementById("screen-home").innerHTML =
    `<div class="studio-title"><h1>Olá, ${esc(name)}.</h1></div>
 ${studioHeroMarkup()}
 <section class="studio-week studio-reveal" aria-label="Sua semana">${weeklyActivityCard()}</section>
 <section class="studio-overview studio-reveal"><header><h2>Visão geral</h2><span>Seus registros</span></header><dl><div><dt>Treinos no mês</dt><dd>${month}</dd></div><div><dt>Meta da semana</dt><dd>${goal === null ? "—" : goal + "%"}</dd></div><div><dt>Exercícios no plano</dt><dd>${exercises}</dd></div></dl></section>
 <section class="studio-journal studio-reveal"><img class="studio-journal-photo" src="__HERO_FOOD__" alt="" width="240" height="240"><div class="studio-journal-copy"><div><h2>Diário alimentar</h2><p>${meals} ${meals === 1 ? "refeição registrada" : "refeições registradas"} hoje</p></div></div><button class="studio-route-button" onclick="switchTab('nutrition')">Abrir diário ${studioChevron("right")}</button></section>
 <section class="studio-history studio-reveal"><header><h2>Últimos treinos</h2><button class="studio-route-button" onclick="switchTab('history')">Histórico ${studioChevron("right")}</button></header>${recent.length ? recent.map((s) => `<article class="studio-history-row"><div class="studio-history-art" aria-hidden="true">${recentWorkoutVisual(s)}</div><div><h3>${esc(s.name)}</h3><p>${shortDate(s.date)} · ${(s.entries || []).length} ${(s.entries || []).length === 1 ? "exercício" : "exercícios"}</p></div></article>`).join("") : '<p class="studio-empty">Seus treinos concluídos aparecem aqui. Comece pelo seu primeiro registro.</p>'}</section>`;
}
renderHome = studioHome;
window.LumeStudio = {
  routines() {
    openSheet(
      `<button class="icon-btn studio-close" aria-label="Fechar rotinas" onclick="closeSheet()">×</button><h3>Escolha seu treino</h3><div class="studio-routine-options">${state.db.routines.map((r) => `<button data-studio-action="choose" data-id="${esc(r.id)}"><strong>${esc(r.name)}</strong><span>${dayLabel(r)} · ${r.exercises.length} exercícios</span></button>`).join("")}</div><button class="ghost-btn" onclick="closeSheet();state.selectedRoutineId=null;switchTab('workouts')">Gerenciar rotinas</button>`,
    );
  },
  credits() {
    openSheet(
      '<button class="icon-btn studio-close" aria-label="Fechar créditos" onclick="closeSheet()">×</button><h3>Sobre e créditos</h3><p><a href="https://repdb.co" target="_blank" rel="noopener noreferrer nofollow">Exercise data by RepDB (repdb.co)</a></p><p>Ilustrações com fundo processado sem IA generativa. Mapa anatômico: <a href="https://github.com/HichamELBSI/react-native-body-highlighter" target="_blank" rel="noopener noreferrer">react-native-body-highlighter</a>, ELABBASSI Hicham, MIT. Tipografia: Manrope, SIL Open Font License.</p><h4>Fotografia</h4><p>Fotos de equipamentos por Tima Miroshnichenko, Victor Freitas, furkanfdemir e hi room, via <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">Pexels</a>.</p>',
    );
  },
};
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-studio-action]");
  if (!button) return;
  const action = button.dataset.studioAction,
    id = button.dataset.id;
  const routine = state.db.routines.find((r) => r.id === id);
  if (action === "resume") switchTab("register");
  else if (action === "start" && routine) startWorkout(id);
  else if (action === "choose" && routine) {
    closeSheet();
    if (routine.exercises.length) startWorkout(id);
    else openRoutine(id);
  } else if (action === "create") {
    state.selectedRoutineId = null;
    switchTab("workouts");
  }
});
const studioSeen = new WeakSet();
const studioObserver =
  typeof IntersectionObserver === "function"
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries)
            if (e.isIntersecting) {
              e.target.classList.remove("studio-await");
              e.target.classList.add("studio-visible");
              studioObserver.unobserve(e.target);
            }
        },
        { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
      )
    : null;
function studioEnhance() {
  studioUpdateHeader();
  window.LumeHeroCarousel?.enhance();
  document
    .querySelectorAll('.routine-toolbar button[onclick="closeRoutine()"]')
    .forEach((button) => {
      if (button.classList.contains("studio-back")) return;
      button.classList.add("studio-back");
      button.innerHTML = studioChevron() + "<span>Minhas rotinas</span>";
      button.setAttribute("aria-label", "Voltar para minhas rotinas");
    });
  document
    .querySelectorAll(
      ".screen.active > section,.screen.active .routine-plan,.screen.active .food-meal,.screen.active .studio-reveal",
    )
    .forEach((el) => {
      if (studioSeen.has(el)) return;
      studioSeen.add(el);
      if (studioObserver && !LumeMotionPreference.matches) {
        if (el.getBoundingClientRect().top > innerHeight - 40)
          el.classList.add("studio-await");
        studioObserver.observe(el);
      }
    });
  const foodDate = document.querySelector('label[for="foodDate"]');
  if (foodDate && foodDate.textContent !== "Diário")
    foodDate.textContent = "Diário";
  document
    .querySelectorAll("input[type=date],input[type=time]")
    .forEach(studioDateControl);
  const settings = document.getElementById("screen-settings");
  if (
    settings?.classList.contains("active") &&
    !settings.querySelector(".studio-credits")
  ) {
    const credit = document.createElement("button");
    credit.className = "studio-text-button studio-credits";
    credit.textContent = "Sobre e créditos";
    credit.onclick = LumeStudio.credits;
    settings.append(credit);
  }
}
let studioScheduled = false;
new MutationObserver(() => {
  if (studioScheduled) return;
  studioScheduled = true;
  requestAnimationFrame(() => {
    studioScheduled = false;
    studioEnhance();
  });
}).observe(document.body, { childList: true, subtree: true });
document.querySelector(".header .eyebrow")?.remove();
document.querySelector(".brandname")?.setAttribute("aria-label", "Lume Fit");
// A shared, purpose-built date/time surface; original form controls remain the source of truth.
let studioCalendar = null,
  studioDateOwner = null,
  studioMonth = null;
function studioDateControl(input) {
  if (input.dataset.studioDate) return;
  input.dataset.studioDate = "true";
  input.classList.add("studio-original-date");
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "studio-date-trigger";
  button.setAttribute("aria-haspopup", "dialog");
  const update = () => {
    const isTime = input.type === "time";
    button.innerHTML = `<span>${input.value ? (isTime ? input.value : studioFormatDay(input.value, true)) : isTime ? "Definir horário" : "Escolher data"}</span>${calendarIcon()}`;
    button.setAttribute(
      "aria-label",
      (isTime ? "Alterar horário" : "Alterar data") +
        (input.value ? ": " + input.value : ""),
    );
  };
  button.onclick = () => studioOpenCalendar(input, button);
  input.addEventListener("change", update);
  input.after(button);
  update();
}
function studioFormatDay(value, compact = false) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: compact ? "short" : "long",
    year: "numeric",
  });
}
function studioOpenCalendar(input, trigger) {
  studioCalendar?.close();
  studioDateOwner = { input, trigger };
  const overlay = document.createElement("div");
  overlay.className = "studio-calendar-overlay";
  studioCalendar = document.createElement("div");
  studioCalendar.className = "studio-calendar";
  studioCalendar.setAttribute("role", "dialog");
  studioCalendar.setAttribute("aria-modal", "true");
  studioCalendar.setAttribute(
    "aria-label",
    input.type === "time" ? "Escolher horário" : "Escolher data",
  );
  overlay.append(studioCalendar);
  const prior = [...document.body.children].map((el) => [el, el.inert]);
  document.body.append(overlay);
  prior.forEach(([el]) => (el.inert = true));
  studioCalendar.close = () => {
    overlay.remove();
    prior.forEach(([el, inert]) => (el.inert = inert));
    if (trigger.isConnected) trigger.focus({ preventScroll: true });
  };
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) studioCalendar.close();
  });
  studioCalendar.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      studioCalendar.close();
    }
    if (e.key === "Tab") {
      e.stopPropagation();
      const nodes = [...studioCalendar.querySelectorAll("button,input")].filter(
        (el) => !el.disabled,
      );
      if (e.shiftKey && document.activeElement === nodes[0]) {
        e.preventDefault();
        nodes.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
        e.preventDefault();
        nodes[0].focus();
      }
    }
  });
  if (input.type === "time") {
    const [hour = "00", minute = "00"] = (input.value || "00:00").split(":");
    studioCalendar.innerHTML = `<header><h3>Horário</h3><button class="icon-btn" onclick="studioCalendar.close()" aria-label="Fechar horário">×</button></header><div class="studio-time-fields">${[
      ["studioHour", "Hora", hour, 23],
      ["studioMinute", "Minuto", minute, 59],
    ]
      .map(
        ([id, label, value, max]) =>
          `<div><label for="${id}">${label}</label><button class="ghost-btn" aria-label="Aumentar ${label.toLowerCase()}" onclick="studioAdjustTime('${id}',1,${max})">＋</button><input id="${id}" type="number" inputmode="numeric" min="0" max="${max}" value="${value}"><button class="ghost-btn" aria-label="Diminuir ${label.toLowerCase()}" onclick="studioAdjustTime('${id}',-1,${max})">−</button></div>`,
      )
      .join(
        "",
      )}</div><button class="primary-btn" onclick="studioApplyTime()">Aplicar horário</button>`;
  } else {
    const value = input.value || activityKey(new Date()),
      [y, m] = value.split("-").map(Number);
    studioMonth = new Date(y, m - 1, 1);
    studioDrawCalendar();
  }
  studioCalendar.querySelector("button")?.focus();
}
function studioAdjustTime(id, delta, max) {
  const input = document.getElementById(id);
  input.value = String(
    (Number(input.value) + delta + max + 1) % (max + 1),
  ).padStart(2, "0");
}
function studioApplyTime() {
  const hour = document.getElementById("studioHour"),
    minute = document.getElementById("studioMinute");
  if (!hour.checkValidity()) {
    hour.reportValidity();
    return;
  }
  if (!minute.checkValidity()) {
    minute.reportValidity();
    return;
  }
  studioSetDay(
    String(Number(hour.value)).padStart(2, "0") +
      ":" +
      String(Number(minute.value)).padStart(2, "0"),
  );
}
function studioDrawCalendar() {
  const input = studioDateOwner.input,
    y = studioMonth.getFullYear(),
    m = studioMonth.getMonth(),
    offset = (new Date(y, m, 1).getDay() + 6) % 7,
    days = new Date(y, m + 1, 0).getDate();
  studioCalendar.innerHTML = `<header><button class="icon-btn" onclick="studioMoveMonth(-1)" aria-label="Mês anterior">‹</button><h3>${studioMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3><button class="icon-btn" onclick="studioMoveMonth(1)" aria-label="Próximo mês">›</button></header><div class="studio-calendar-grid">${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => `<span>${d}</span>`).join("")}${Array.from({ length: offset }, () => "<i></i>").join("")}${Array.from(
    { length: days },
    (_, i) => {
      const v = `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      return `<button type="button" data-studio-day="${i + 1}" tabindex="${input.value === v || (!input.value.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`) && i === 0) ? 0 : -1}" onkeydown="studioCalendarDayKey(event,this)" aria-label="${studioFormatDay(v)}" aria-pressed="${input.value === v}" ${(input.min && v < input.min) || (input.max && v > input.max) ? "disabled" : ""} onclick="studioSetDay('${v}')">${i + 1}</button>`;
    },
  ).join(
    "",
  )}</div><footer><button class="studio-text-button" onclick="studioSetDay(activityKey(new Date()))">Hoje</button><button class="ghost-btn" onclick="studioCalendar.close()">Cancelar</button></footer>`;
}
function studioMoveMonth(delta) {
  studioMonth.setMonth(studioMonth.getMonth() + delta);
  studioDrawCalendar();
  studioCalendar
    .querySelector(
      delta < 0 ? '[aria-label="Mês anterior"]' : '[aria-label="Próximo mês"]',
    )
    ?.focus();
}
function studioSetDay(value) {
  const input = studioDateOwner?.input;
  if (!input?.isConnected) {
    studioCalendar?.close();
    return;
  }
  if ((input.min && value < input.min) || (input.max && value > input.max))
    return;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  studioCalendar?.close();
}
studioEnhance();

// Four destinations, one calm sheet; secondary tools stay within their own screens.
lumeMore = function () {
  const items = [
    ["frequency", "Frequência", "Calendário e histórico", calendarIcon()],
    ["friends", "Amigos", "Conexões e perfil", friendsIcon()],
    ["knowledge", "Guias", "Referências e ferramentas", boltIcon()],
    ["settings", "Ajustes", "Dados e preferências", preferencesIcon()],
  ];
  openSheet(
    `<div class="studio-hub-head"><h3>Lume Hub</h3><button class="icon-btn" aria-label="Fechar Lume Hub" onclick="closeSheet()">×</button></div><div class="studio-hub-links">${items.map(([id, title, description, icon]) => `<button onclick="closeSheet();switchTab('${id}')"><span class="studio-hub-icon" aria-hidden="true">${icon}</span><span><strong>${title}</strong><small>${description}</small></span><span aria-hidden="true">›</span></button>`).join("")}</div>`,
  );
};

function studioCalendarDayKey(event, button) {
  const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[
    event.key
  ];
  if (!delta) return;
  event.preventDefault();
  const next = studioCalendar.querySelector(
    '[data-studio-day="' + (Number(button.dataset.studioDay) + delta) + '"]',
  );
  if (next && !next.disabled) {
    button.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  }
}

function studioUpdateHeader() {
  const account = document.querySelector(".header-account");
  const badge = account?.querySelector(".offline-pill");
  if (!account || !badge) return;
  let context = account.querySelector(".studio-context");
  if (!context) {
    context = document.createElement("div");
    context.className = "studio-context";
    const time = document.createElement("time");
    time.className = "studio-context-date";
    const period = document.createElement("span");
    period.className = "studio-context-period";
    account.insertBefore(context, account.firstChild);
    context.append(badge, time, period);
  }
  const day = studioDayContext();
  const key = day.iso + day.period;
  if (context.dataset.context === key) return;
  context.dataset.context = key;
  const time = context.querySelector("time");
  time.dateTime = day.iso;
  time.setAttribute("aria-label", day.label);
  time.innerHTML = `<span class="studio-weekday-full">${esc(day.weekday)}</span><span class="studio-weekday-short" aria-hidden="true">${esc(day.shortWeekday)}</span><strong>${esc(day.date)}</strong>`;
  const period = context.querySelector(".studio-context-period");
  period.innerHTML =
    studioPeriodIcon(day.period) + `<span>${day.period}</span>`;
}
setInterval(studioUpdateHeader, 60000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) studioUpdateHeader();
});
// Render once after all app scripts: a fast cached login must also receive the new home.
if (document.getElementById("screen-home")?.classList.contains("active"))
  studioHome();
studioEnhance();

// App-only entry: full anatomy and options belong inside the composer.
automaticRoutineEntry = function () {
  return `<section class="auto-entry"><div><small>Rotina automática</small><h3>Um plano para sua semana.</h3><p>Foco, dias e equipamentos.<br>Um plano que você pode ajustar.</p><button class="primary-btn" onclick="AutoRoutine.open()">Montar minha rotina ${studioChevron("right")}</button></div></section>`;
};
