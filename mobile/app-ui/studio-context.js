// Local device time; never infer the person's time zone from a server timestamp.
function studioDayContext(now = new Date()) {
  const hour = now.getHours();
  const period =
    hour >= 5 && hour < 12
      ? "Manhã"
      : hour >= 12 && hour < 18
        ? "Tarde"
        : "Noite";
  const weekday = now.toLocaleDateString("pt-BR", { weekday: "long" });
  return {
    period,
    weekday,
    shortWeekday: weekday.slice(0, 3),
    date: now
      .toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
      .replaceAll(" de ", " ")
      .replaceAll(".", ""),
    label: now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    iso: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
  };
}
function studioActionIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="m10 8 6 4-6 4V8Z" fill="currentColor"/></svg>';
}
function studioChevron(direction = "left") {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${direction === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"}"/></svg>`;
}
function studioPeriodIcon(period) {
  return period === "Noite"
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 14.3A8.5 8.5 0 0 1 9.7 4 8.5 8.5 0 1 0 20 14.3Z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
}
