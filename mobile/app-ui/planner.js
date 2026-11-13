/* App-only catalog and deterministic selection. Artwork never enters eligibility or ranking. */
Object.assign(TRAINING_EQUIPMENT, {
  bench: "Banco de treino",
  rack: "Suporte de segurança para barra",
  kettlebells: "Kettlebells",
});
const LUME_CATALOG_ADDITIONS = (() => {
  const all = ["gym", "home", "calisthenics"],
    gym = ["gym"],
    weighted = ["gym", "home"];
  const make = (
    id,
    name,
    primary,
    secondary,
    pattern,
    equipment,
    level,
    note,
    family,
    plane = "",
    compound = false,
  ) => ({
    id,
    name,
    primary,
    secondary,
    pattern,
    equipment,
    level,
    note,
    modes: equipment.includes("machines")
      ? gym
      : equipment.some((k) =>
            ["barbell", "dumbbells", "kettlebells"].includes(k),
          )
        ? weighted
        : all,
    measurement: "reps",
    family,
    plane,
    compound,
  });
  return [
    make(
      "bench-pushup",
      "Flexão com mãos no banco",
      "chest",
      ["triceps", "shoulders"],
      "push",
      ["bench"],
      0,
      "Use um banco firme e sem rodas. Mantenha o corpo alinhado ao aproximar o peito do apoio.",
      "chest-press",
      "horizontal",
      true,
    ),
    make(
      "decline-pushup",
      "Flexão com pés no banco",
      "chest",
      ["triceps", "shoulders"],
      "push",
      ["bench"],
      1,
      "Apoie os pés em um banco estável e controle a descida sem perder o alinhamento do tronco.",
      "chest-press",
      "horizontal",
      true,
    ),
    make(
      "pike-pushup",
      "Flexão pike",
      "shoulders",
      ["triceps"],
      "push",
      [],
      1,
      "Eleve o quadril e flexione os cotovelos com controle, sem apoiar a cabeça no chão.",
      "shoulder-press",
      "vertical",
      true,
    ),
    make(
      "split-squat",
      "Agachamento em base dividida",
      "quads",
      ["glutes"],
      "knee",
      [],
      0,
      "Mantenha um pé à frente do outro. Flexione as pernas sem deslocar os pés; conte por lado.",
      "split-squat",
      "",
      true,
    ),
    make(
      "lateral-lunge",
      "Afundo lateral",
      "quads",
      ["glutes"],
      "knee",
      [],
      1,
      "Dê um passo para o lado, leve o quadril para trás e retorne com controle. Conte por lado.",
      "lunge",
      "",
      true,
    ),
    make(
      "single-bridge",
      "Elevação de quadril unilateral no chão",
      "glutes",
      ["hamstrings"],
      "hinge",
      [],
      1,
      "Mantenha uma perna elevada e suba o quadril sem girar a pelve. Conte por lado.",
      "hip-extension",
      "",
      true,
    ),
    make(
      "reverse-crunch",
      "Abdominal reverso",
      "core",
      [],
      "core",
      [],
      0,
      "Deitado, aproxime os joelhos do tronco elevando levemente a pelve, sem usar impulso.",
      "trunk-flexion",
    ),
    make(
      "heel-taps",
      "Toque alternado dos calcanhares",
      "core",
      [],
      "core",
      [],
      0,
      "Deitado com joelhos flexionados, aproxime uma mão do calcanhar do mesmo lado. Alterne com controle.",
      "lateral-core",
    ),
    make(
      "db-bench",
      "Supino reto com halteres",
      "chest",
      ["triceps", "shoulders"],
      "push",
      ["dumbbells", "bench"],
      0,
      "Use banco estável. Mantenha os pés apoiados e mova os halteres em amplitude confortável.",
      "chest-press",
      "horizontal",
      true,
    ),
    make(
      "db-bench-fly",
      "Crucifixo reto com halteres",
      "chest",
      ["shoulders"],
      "accessory",
      ["dumbbells", "bench"],
      1,
      "Com cotovelos levemente flexionados, abra os braços com controle e retorne sem forçar os ombros.",
      "chest-fly",
      "horizontal",
    ),
    make(
      "db-supported-row",
      "Remada unilateral com apoio no banco",
      "back",
      ["biceps", "shoulders"],
      "pull",
      ["dumbbells", "bench"],
      0,
      "Apoie uma mão no banco, estabilize o tronco e aproxime o halter da lateral do corpo. Conte por lado.",
      "row",
      "horizontal",
      true,
    ),
    make(
      "db-reverse-fly",
      "Crucifixo inverso com halteres",
      "shoulders",
      ["back"],
      "accessory",
      ["dumbbells"],
      1,
      "Incline pelo quadril e abra os braços sem balançar o tronco. Use carga que permita controle.",
      "rear-deltoid",
      "horizontal",
    ),
    make(
      "db-hammer-curl",
      "Rosca martelo com halteres",
      "biceps",
      [],
      "accessory",
      ["dumbbells"],
      0,
      "Mantenha as palmas voltadas uma para a outra e flexione os cotovelos sem balançar o tronco.",
      "elbow-flexion",
    ),
    make(
      "db-concentration-curl",
      "Rosca concentrada com halter",
      "biceps",
      [],
      "accessory",
      ["dumbbells", "bench"],
      0,
      "Sentado, apoie o braço na parte interna da coxa e flexione o cotovelo com controle. Conte por lado.",
      "elbow-flexion",
    ),
    make(
      "db-lying-triceps",
      "Extensão de tríceps deitado no chão",
      "triceps",
      [],
      "accessory",
      ["dumbbells"],
      0,
      "Deitado, mantenha os braços estáveis e flexione os cotovelos sem aproximar os pesos do rosto.",
      "elbow-extension",
    ),
    make(
      "db-split-squat",
      "Agachamento em base dividida com halteres",
      "quads",
      ["glutes"],
      "knee",
      ["dumbbells"],
      1,
      "Segure os halteres ao lado do corpo e mantenha os pés em base dividida. Conte por lado.",
      "split-squat",
      "",
      true,
    ),
    make(
      "db-reverse-lunge",
      "Afundo reverso com halteres",
      "quads",
      ["glutes"],
      "knee",
      ["dumbbells"],
      1,
      "Dê um passo para trás mantendo o tronco estável e retorne com controle. Conte por lado.",
      "lunge",
      "",
      true,
    ),
    make(
      "db-single-rdl",
      "Romeno unilateral com halteres",
      "hamstrings",
      ["glutes"],
      "hinge",
      ["dumbbells"],
      1,
      "Leve o quadril para trás enquanto uma perna recua, mantendo a pelve estável. Conte por lado.",
      "hip-hinge",
      "",
      true,
    ),
    make(
      "db-hip-thrust",
      "Elevação de quadril com halter e banco",
      "glutes",
      ["hamstrings"],
      "hinge",
      ["dumbbells", "bench"],
      1,
      "Apoie a parte superior das costas em banco firme e estabilize o peso sobre o quadril, com proteção.",
      "hip-extension",
      "",
      true,
    ),
    make(
      "db-seated-calf",
      "Panturrilha sentado com halteres",
      "calves",
      [],
      "accessory",
      ["dumbbells", "bench"],
      0,
      "Sentado com pés apoiados, estabilize os pesos sobre as coxas e eleve os calcanhares sem impulso.",
      "calf-raise",
    ),
    make(
      "bar-bench",
      "Supino reto com barra",
      "chest",
      ["triceps", "shoulders"],
      "push",
      ["barbell", "bench", "rack"],
      1,
      "Ajuste os suportes e travas de segurança antes de deitar no banco. Controle a barra sem rebater no peito.",
      "chest-press",
      "horizontal",
      true,
    ),
    make(
      "bar-squat",
      "Agachamento com barra e suporte",
      "quads",
      ["glutes"],
      "knee",
      ["barbell", "rack"],
      1,
      "Ajuste as barras de segurança à sua amplitude e retire a barra do suporte com controle.",
      "squat",
      "",
      true,
    ),
    make(
      "bar-overhead",
      "Desenvolvimento em pé com barra",
      "shoulders",
      ["triceps"],
      "push",
      ["barbell", "rack"],
      1,
      "Retire a barra de um suporte adequado e eleve sem compensar com a lombar.",
      "shoulder-press",
      "vertical",
      true,
    ),
    make(
      "bar-curl",
      "Rosca direta com barra",
      "biceps",
      [],
      "accessory",
      ["barbell"],
      0,
      "Mantenha os cotovelos estáveis e evite usar o tronco para mover a barra.",
      "elbow-flexion",
    ),
    make(
      "bar-floor-bridge",
      "Elevação de quadril com barra no chão",
      "glutes",
      ["hamstrings"],
      "hinge",
      ["barbell"],
      1,
      "Deitado no chão, estabilize a barra protegida sobre o quadril e eleve sem arquear a lombar.",
      "hip-extension",
      "",
      true,
    ),
    make(
      "bar-hip-thrust",
      "Elevação de quadril com barra e banco",
      "glutes",
      ["hamstrings"],
      "hinge",
      ["barbell", "bench"],
      1,
      "Use banco firme e proteção entre barra e quadril. Finalize a subida sem hiperestender a lombar.",
      "hip-extension",
      "",
      true,
    ),
    make(
      "machine-shoulder",
      "Desenvolvimento na máquina",
      "shoulders",
      ["triceps"],
      "push",
      ["machines"],
      0,
      "Ajuste o banco para começar em posição confortável e mantenha as costas apoiadas.",
      "shoulder-press",
      "vertical",
      true,
    ),
    make(
      "cable-fly",
      "Crucifixo na polia",
      "chest",
      ["shoulders"],
      "accessory",
      ["machines"],
      0,
      "Ajuste as polias e aproxime as mãos à frente do tronco, com cotovelos levemente flexionados.",
      "chest-fly",
      "horizontal",
    ),
    make(
      "cable-face-pull",
      "Face pull na polia",
      "shoulders",
      ["back"],
      "accessory",
      ["machines"],
      0,
      "Com corda e ajuste adequado, aproxime as mãos da altura do rosto sem projetar o pescoço.",
      "rear-deltoid",
      "horizontal",
    ),
    make(
      "cable-lateral-raise",
      "Elevação lateral na polia",
      "shoulders",
      [],
      "accessory",
      ["machines"],
      0,
      "Mantenha o tronco estável e eleve o braço lateralmente em amplitude confortável. Conte por lado.",
      "lateral-raise",
    ),
    make(
      "cable-overhead-triceps",
      "Extensão de tríceps acima da cabeça na polia",
      "triceps",
      [],
      "accessory",
      ["machines"],
      1,
      "Estabilize o tronco e estenda os cotovelos mantendo os braços em posição confortável.",
      "elbow-extension",
    ),
    make(
      "cable-hammer-curl",
      "Rosca martelo com corda na polia",
      "biceps",
      [],
      "accessory",
      ["machines"],
      0,
      "Use pegada neutra na corda e flexione os cotovelos sem inclinar o tronco.",
      "elbow-flexion",
    ),
    make(
      "seated-leg-curl",
      "Flexora sentada",
      "hamstrings",
      [],
      "accessory",
      ["machines"],
      0,
      "Ajuste o eixo e os apoios da máquina aos joelhos e controle a volta.",
      "knee-flexion",
    ),
    make(
      "machine-hip-abduction",
      "Abdução de quadril na máquina",
      "glutes",
      [],
      "accessory",
      ["machines"],
      0,
      "Ajuste os apoios e afaste as pernas com controle, sem usar impulsos.",
      "hip-abduction",
    ),
    make(
      "machine-hip-extension",
      "Extensão de quadril na máquina",
      "glutes",
      ["hamstrings"],
      "accessory",
      ["machines"],
      0,
      "Ajuste os apoios e leve a perna para trás sem arquear a lombar. Conte por lado.",
      "hip-extension",
    ),
    make(
      "machine-calf",
      "Panturrilha na máquina",
      "calves",
      [],
      "accessory",
      ["machines"],
      0,
      "Ajuste os apoios à sua altura e eleve os calcanhares de forma controlada.",
      "calf-raise",
    ),
    make(
      "legpress-calf",
      "Panturrilha no leg press",
      "calves",
      [],
      "accessory",
      ["machines"],
      1,
      "Use apenas máquina que permita esta variação com segurança. Mantenha os joelhos estáveis e controle os calcanhares.",
      "calf-raise",
    ),
    make(
      "band-chest-press",
      "Pressão de peito com elástico",
      "chest",
      ["triceps", "shoulders"],
      "push",
      ["bands"],
      0,
      "Passe o elástico atrás das costas, abaixo dos ombros, e empurre as mãos à frente sem soltar a tensão.",
      "chest-press",
      "horizontal",
      true,
    ),
    make(
      "band-reverse-fly",
      "Abertura de elástico à frente do peito",
      "shoulders",
      ["back"],
      "accessory",
      ["bands"],
      0,
      "Segure uma faixa íntegra à frente do peito e afaste as mãos sem elevar os ombros.",
      "rear-deltoid",
      "horizontal",
    ),
    make(
      "band-rdl",
      "Romeno com elástico",
      "hamstrings",
      ["glutes"],
      "hinge",
      ["bands"],
      1,
      "Prenda a faixa sob os pés de modo estável e leve o quadril para trás, mantendo a coluna alinhada.",
      "hip-hinge",
      "",
      true,
    ),
    make(
      "band-squat",
      "Agachamento com elástico",
      "quads",
      ["glutes"],
      "knee",
      ["bands"],
      0,
      "Use faixa apropriada sob os pés e mantenha a tensão controlada durante o agachamento.",
      "squat",
      "",
      true,
    ),
    make(
      "band-assisted-pullup",
      "Barra fixa assistida por elástico",
      "back",
      ["biceps"],
      "pull",
      ["bands", "pullup"],
      1,
      "Use barra e elástico compatíveis e bem instalados. Entre e saia do apoio com controle, sem impulso.",
      "vertical-pull",
      "vertical",
      true,
    ),
    make(
      "band-pulldown",
      "Puxada com elástico em barra fixa",
      "back",
      ["biceps"],
      "pull",
      ["bands", "pullup"],
      0,
      "Fixe a faixa em uma barra segura e puxe os cotovelos para baixo sem inclinar excessivamente o tronco.",
      "vertical-pull",
      "vertical",
      true,
    ),
    make(
      "kb-deadlift",
      "Levantamento terra com kettlebell",
      "glutes",
      ["hamstrings", "quads"],
      "hinge",
      ["kettlebells"],
      0,
      "Posicione o peso entre os pés e eleve estendendo quadril e joelhos, sem curvar a coluna.",
      "hip-hinge",
      "",
      true,
    ),
    make(
      "kb-goblet",
      "Agachamento goblet com kettlebell",
      "quads",
      ["glutes"],
      "knee",
      ["kettlebells"],
      0,
      "Segure o peso próximo ao peito e mantenha os pés apoiados durante o agachamento.",
      "squat",
      "",
      true,
    ),
    make(
      "kb-row",
      "Remada com kettlebell",
      "back",
      ["biceps"],
      "pull",
      ["kettlebells"],
      1,
      "Incline pelo quadril e aproxime o peso da lateral do tronco, sem girar o corpo. Conte por lado.",
      "row",
      "horizontal",
      true,
    ),
    make(
      "kb-floor-press",
      "Supino no chão com kettlebell",
      "chest",
      ["triceps", "shoulders"],
      "push",
      ["kettlebells"],
      1,
      "Deitado, estabilize o punho e controle o peso. Conte por lado e mantenha o tronco estável.",
      "chest-press",
      "horizontal",
      true,
    ),
  ];
})();
EXERCISE_CATALOG.push(...LUME_CATALOG_ADDITIONS);
const LUME_BASE_FAMILIES = {
  "wall-push": "chest-press",
  "knee-push": "chest-press",
  pushup: "chest-press",
  "close-push": "close-press",
  "db-floor": "chest-press",
  "db-press": "shoulder-press",
  "db-raise": "lateral-raise",
  "db-triceps": "elbow-extension",
  "db-curl": "elbow-flexion",
  "db-row": "row",
  "band-row": "row",
  "band-curl": "elbow-flexion",
  "band-raise": "lateral-raise",
  "band-triceps": "elbow-extension",
  pullup: "vertical-pull",
  chinup: "vertical-pull",
  squat: "squat",
  "reverse-lunge": "lunge",
  "db-squat": "squat",
  "db-rdl": "hip-hinge",
  bridge: "hip-extension",
  "heel-bridge": "hip-extension",
  calf: "calf-raise",
  "db-calf": "calf-raise",
  deadbug: "anti-extension",
  birddog: "anti-rotation",
  curlup: "trunk-flexion",
  "prone-w": "scapular-control",
  "machine-chest": "chest-press",
  "machine-row": "row",
  pulldown: "vertical-pull",
  "cable-triceps": "elbow-extension",
  "cable-curl": "elbow-flexion",
  legpress: "squat",
  legcurl: "knee-flexion",
  legextension: "knee-extension",
  "bar-row": "row",
  "bar-rdl": "hip-hinge",
};
for (const e of EXERCISE_CATALOG) {
  e.family ||= LUME_BASE_FAMILIES[e.id];
  e.plane ||= ["chest-press", "close-press", "row"].includes(e.family)
    ? "horizontal"
    : ["shoulder-press", "vertical-pull"].includes(e.family)
      ? "vertical"
      : "";
  if (e.id === "legcurl") e.pattern = "accessory";
  if (e.compound === undefined)
    e.compound =
      ["push", "pull", "knee", "hinge"].includes(e.pattern) &&
      e.id !== "prone-w";
}
window.LumePlanner = {
  restSeconds: (goal) =>
    goal === "strength" ? 120 : goal === "muscle" ? 90 : 60,
};
window.plannedMinutes = function (exercises, goal) {
  const rest = LumePlanner.restSeconds(goal);
  return Math.ceil(
    5 +
      exercises.reduce(
        (n, e) => n + (Number(e.sets) || 0) * (40 + rest) + 45,
        0,
      ) /
        60,
  );
};
window.buildAutomaticPlan = function (preferences, level = "beginner") {
  const p = normalizeTrainingPreferences(preferences),
    eligible = catalogEligible(p, level),
    pool = eligible.filter(
      (e) =>
        e.id !== "prone-w" ||
        !eligible.some(
          (other) =>
            other.primary === "back" &&
            other.pattern === "pull" &&
            other.equipment.length > 0,
        ),
    ),
    days = p.days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (!p.modes.length) return { error: "Escolha onde você quer treinar." };
  if (!days.length || days.length > 6)
    return {
      error:
        "Escolha de 1 a 6 dias para organizar a semana e reservar descanso.",
    };
  if (p.goal === "mobility")
    return {
      error:
        "Esta versão monta rotinas de fortalecimento. Para continuar, escolha outro objetivo; uma rotina de mobilidade precisa de exercícios e registros próprios.",
    };
  if (!pool.length)
    return {
      error:
        "Não encontramos exercícios com essa combinação. Revise a modalidade e os equipamentos.",
    };
  const sets = level === "intermediate" ? 3 : 2,
    rest = LumePlanner.restSeconds(p.goal),
    slots = Math.max(
      1,
      Math.min(
        p.minutes >= 90 ? 8 : 6,
        Math.floor(((p.minutes - 5) * 60) / (sets * (40 + rest) + 45)),
      ),
    );
  const lower = ["quads", "hamstrings", "glutes", "calves"],
    uses = new Map(),
    groups = new Map(),
    patterns = new Map();
  const routines = days.map((weekday, session) => {
    const split = days.length >= 4 ? (session % 2 ? "lower" : "upper") : "full";
    const candidates = pool.filter(
      (e) =>
        split === "full" || (split === "lower") === lower.includes(e.primary),
    );
    const chosen = [];
    const count = (map, key) => map.get(key) || 0;
    function choose(list, reason) {
      const available = list.filter(
        (e) =>
          !chosen.some(
            (c) => catalogExercise(c.catalogId).family === e.family,
          ) &&
          chosen.filter(
            (c) => catalogExercise(c.catalogId).primary === e.primary,
          ).length < 2,
      );
      const foundations = new Set([
        "pushup",
        "knee-push",
        "db-floor",
        "db-bench",
        "db-press",
        "db-row",
        "db-supported-row",
        "machine-chest",
        "machine-row",
        "pulldown",
        "squat",
        "db-squat",
        "db-rdl",
        "bar-rdl",
        "bridge",
        "db-hip-thrust",
        "bar-hip-thrust",
        "legcurl",
        "db-curl",
        "db-raise",
        "cable-triceps",
        "deadbug",
        "calf",
        "kb-goblet",
        "kb-deadlift",
      ]);
      function score(e) {
        return (
          (count(groups, e.primary) === 0
            ? 30
            : 12 / (1 + count(groups, e.primary))) +
          (p.focus.includes(e.primary) ? 12 : 0) +
          (e.compound ? 8 : 0) +
          (foundations.has(e.id) ? 6 : 0) +
          (level === "beginner" && e.level === 0 ? 5 : 0) +
          (level === "beginner" && e.equipment.includes("bench") ? 3 : 0) +
          (level === "intermediate" && ["wall-push", "knee-push"].includes(e.id)
            ? -12
            : 0) +
          (p.goal === "strength" && e.compound ? 6 : 0) +
          (e.equipment.some((k) => p.equipment.includes(k)) ? 2 : 0) -
          count(uses, e.id) * 2
        );
      }
      available.sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
      const c = available[0];
      if (!c) return false;
      chosen.push({
        catalogId: c.id,
        name: c.name,
        sets,
        minReps: p.goal === "strength" ? 6 : p.goal === "conditioning" ? 10 : 8,
        maxReps:
          p.goal === "strength" ? 10 : p.goal === "conditioning" ? 15 : 12,
        reason,
      });
      uses.set(c.id, count(uses, c.id) + 1);
      groups.set(c.primary, count(groups, c.primary) + 1);
      patterns.set(c.pattern, count(patterns, c.pattern) + 1);
      return true;
    }
    const focus = p.focus
      .filter((k) => candidates.some((e) => e.primary === k))
      .sort(
        (a, b) =>
          count(groups, a) - count(groups, b) ||
          p.focus.indexOf(a) - p.focus.indexOf(b),
      );
    if (focus.length)
      choose(
        candidates.filter((e) => e.primary === focus[0]),
        "Prioriza um dos grupos que você escolheu.",
      );
    const target =
      split === "full"
        ? ["push", "knee", "pull", "hinge", "core"]
        : split === "upper"
          ? ["push", "pull", "accessory", "core"]
          : ["knee", "hinge", "accessory", "core"];
    const order = target
      .slice()
      .sort(
        (a, b) =>
          count(patterns, a) - count(patterns, b) ||
          target.indexOf(a) - target.indexOf(b),
      );
    for (const pattern of order) {
      if (chosen.length >= slots) break;
      if (chosen.some((e) => catalogExercise(e.catalogId).pattern === pattern))
        continue;
      choose(
        candidates.filter((e) => e.pattern === pattern),
        "Acrescenta um padrão de movimento ao plano.",
      );
    }
    while (chosen.length < slots) {
      if (
        !choose(
          candidates,
          "Complementa o plano respeitando foco, nível e equipamentos.",
        )
      )
        break;
    }
    chosen.sort(
      (a, b) =>
        Number(catalogExercise(b.catalogId).compound) -
        Number(catalogExercise(a.catalogId).compound),
    );
    return {
      name:
        split === "full"
          ? "Corpo inteiro " + (session + 1)
          : split === "upper"
            ? "Superiores " + (Math.floor(session / 2) + 1)
            : "Inferiores " + (Math.floor(session / 2) + 1),
      weekday,
      exercises: chosen,
    };
  });
  const warnings = automaticPlanWarnings(p, routines);
  if (routines.some((r) => r.exercises.length < slots))
    warnings.push(
      "A sessão ficou menor para evitar variações redundantes. Você pode revisar as opções e os equipamentos.",
    );
  return { preferences: p, level, routines, warnings };
};
