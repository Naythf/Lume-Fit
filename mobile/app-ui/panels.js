/* App-only sheets: accessible tap targets, drag dismissal and interruptible exits. */
window.LumePanels = (() => {
  const records = new Map();
  const busy = () => window.AccountDeletion?.busy === true;
  const originalOpen = openSheet,
    originalClose = closeSheet,
    originalAnswer = answerDialog,
    originalConfirm = lumeConfirm;
  function recordFor(overlay) {
    if (records.has(overlay)) return records.get(overlay);
    const record = {
      overlay,
      panel: overlay.querySelector(".sheet-panel"),
      animation: null,
      finish: null,
      drag: null,
      suppress: false,
    };
    records.set(overlay, record);
    return record;
  }
  function reset(record, flush = false) {
    const finish = record.finish;
    record.finish = null;
    record.animation?.cancel();
    record.animation = null;
    record.drag = null;
    record.panel.style.removeProperty("transform");
    record.panel.style.removeProperty("opacity");
    record.panel.inert = false;
    if (flush && finish) finish();
  }
  function exit(record, finish) {
    if (record.finish) return;
    if (
      !record.overlay.classList.contains("active") ||
      LumeMotionPreference.matches ||
      !record.panel.animate
    ) {
      reset(record);
      finish();
      return;
    }
    record.finish = finish;
    record.panel.inert = true;
    const from = record.panel.style.transform || "translateY(0)";
    const animation = record.panel.animate(
      [
        { transform: from, opacity: 1 },
        { transform: "translateY(105%)", opacity: 0 },
      ],
      { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    );
    record.animation = animation;
    animation.onfinish = () => {
      if (record.animation !== animation) return;
      reset(record, true);
    };
  }
  function enter(record) {
    if (LumeMotionPreference.matches || !record.panel.animate) return;
    record.animation = record.panel.animate(
      [
        { opacity: 0, transform: "translateY(32px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 300, easing: "cubic-bezier(.2,.7,.3,1)" },
    );
  }
  openSheet = function (...args) {
    const record = recordFor(document.getElementById("sheet"));
    reset(record);
    const result = originalOpen.apply(this, args);
    enter(record);
    return result;
  };
  closeSheet = function () {
    if (busy()) return originalClose();
    const overlay = document.getElementById("sheet");
    if (document.getElementById("dialogOverlay").classList.contains("active"))
      return;
    window.LumeControls?.close(false);
    exit(recordFor(overlay), () => originalClose());
  };
  // Capture the resolver before animation: an older exit must never resolve a newer dialog.
  answerDialog = function (value) {
    const overlay = document.getElementById("dialogOverlay"),
      record = recordFor(overlay);
    if (record.finish) return;
    window.LumeControls?.close(false);
    const callback = dialogResolver;
    dialogResolver = null;
    exit(record, () => {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
      callback?.(value);
    });
  };
  lumeConfirm = function (...args) {
    const record = recordFor(document.getElementById("dialogOverlay"));
    reset(record, true);
    if (dialogResolver) originalAnswer(false);
    const result = originalConfirm.apply(this, args);
    enter(record);
    return result;
  };
  function dismiss(record) {
    if (record.overlay.id === "dialogOverlay") answerDialog(false);
    else closeSheet();
  }
  function enhance() {
    document.querySelectorAll(".sheet-handle:not(button)").forEach((old) => {
      const overlay = old.closest(".sheet"),
        record = recordFor(overlay),
        handle = document.createElement("button");
      handle.className = "sheet-handle";
      handle.type = "button";
      handle.setAttribute(
        "aria-label",
        overlay.id === "dialogOverlay"
          ? "Cancelar e fechar confirmação"
          : "Fechar janela",
      );
      handle.title = "Toque ou arraste para baixo para fechar";
      old.replaceWith(handle);
      const allowed = () =>
        overlay.classList.contains("active") &&
        !record.panel.inert &&
        !overlay.inert &&
        !busy() &&
        (overlay.id === "dialogOverlay" ||
          !document
            .getElementById("dialogOverlay")
            .classList.contains("active"));
      handle.addEventListener("click", () => {
        if (record.suppress) {
          record.suppress = false;
          return;
        }
        if (allowed()) dismiss(record);
      });
      handle.addEventListener("pointerdown", (e) => {
        if (!allowed() || e.button !== 0) return;
        record.animation?.cancel();
        record.animation = null;
        record.suppress = false;
        record.drag = {
          id: e.pointerId,
          y: e.clientY,
          start: performance.now(),
          dy: 0,
        };
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener("pointermove", (e) => {
        const drag = record.drag;
        if (!drag || drag.id !== e.pointerId) return;
        drag.dy = Math.max(0, e.clientY - drag.y);
        record.panel.style.transform = `translateY(${drag.dy}px)`;
      });
      const release = (e, cancelled = false) => {
        const drag = record.drag;
        if (!drag || drag.id !== e.pointerId) return;
        record.drag = null;
        const dy = drag.dy,
          velocity = dy / Math.max(1, performance.now() - drag.start);
        record.suppress = cancelled || dy > 8;
        if (
          !cancelled &&
          allowed() &&
          (dy > 90 || (dy > 35 && velocity > 0.5))
        ) {
          dismiss(record);
          return;
        }
        record.panel.style.removeProperty("transform");
        if (dy && !LumeMotionPreference.matches && record.panel.animate)
          record.animation = record.panel.animate(
            [
              { transform: `translateY(${dy}px)` },
              { transform: "translateY(0)" },
            ],
            { duration: 180, easing: "ease-out" },
          );
      };
      handle.addEventListener("pointerup", release);
      handle.addEventListener("pointercancel", (e) => release(e, true));
    });
  }
  LumeMotionPreference.addEventListener("change", () => {
    if (LumeMotionPreference.matches)
      for (const record of records.values()) reset(record, true);
  });
  enhance();
  return { enhance };
})();
