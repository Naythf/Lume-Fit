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
  const source = (label, url) =>
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
  const sources = {
    brazil: source(
      "Guia Alimentar · Ministério da Saúde, 2014",
      "https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf",
    ),
    who: source(
      "Alimentação saudável · OMS, 2026",
      "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    ),
    water: source(
      "Água total · EFSA, 2010",
      "https://www.efsa.europa.eu/sites/default/files/2017_09_DRVs_summary_report.pdf",
    ),
    energy: source(
      "Mifflin-St Jeor · estudo original, 1990",
      "https://pubmed.ncbi.nlm.nih.gov/2305711/",
    ),
    weight: source(
      "Como registrar o peso · NHS England, 2023",
      "https://www.england.nhs.uk/long-read/how-to-record-your-weight/",
    ),
    bmi: source(
      "IMC em adultos · NHS",
      "https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults",
    ),
    density: source(
      "Frutas, vegetais e energia · CDC, 2026",
      "https://www.cdc.gov/healthy-weight-growth/healthy-eating/fruits-vegetables.html",
    ),
  };
  const fold = (title, body) =>
    `<details class="guide-fold"><summary>${title}</summary><div>${body}</div></details>`;
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
  }
  function render() {
    syncOwner();
    if (!root()) return;
    if (draft && root().querySelector("#guideSetup")) return;
    const data = guide();
    root().classList.add("guide-screen");
    root().innerHTML = `<header class="guide-page-head"><div><h1>Meu guia</h1><p>Entender. Escolher. Acompanhar.</p></div><span class="guide-private">Privado</span></header>${draft ? wizard() : !data.setup.complete && !explore ? welcome() : dashboard(data)}`;
  }
  function welcome() {
    return `<section class="guide-welcome"><div class="guide-welcome-visual" aria-hidden="true">${metricIllustration("body")}</div><h2>Um ponto de partida<br>para cuidar de você.</h2><p>Primeiro, seu contexto. Depois, referências que fazem sentido para o seu dia.</p><ol class="guide-welcome-list"><li><strong>Responda no seu ritmo</strong><span>Intenção, rotina e preferências. Medidas são opcionais.</span></li><li><strong>Entenda antes de mudar</strong><span>Alimentação explicada, com ideias para suas refeições.</span></li><li><strong>Acompanhe sua história</strong><span>Peso, observações e fotos que só você escolhe registrar.</span></li></ol>${button("Montar meu guia", "LumeGuide.start()", true)}${button("Explorar primeiro", "LumeGuide.explore()")}<p class="guide-small">Conteúdo educativo. As estimativas não definem uma dieta e não substituem acompanhamento profissional.</p></section>`;
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
      `<h2 id="guideStepTitle" tabindex="-1">Medidas são uma escolha.</h2><p>Preencha apenas o que quiser. Estes dados ficam no guia e não criam um registro de peso nem alteram seu perfil.</p><div class="guide-form-grid">${field("Peso atual (kg) · opcional", "weight", "number", 'min="20" max="400" step="0.1" inputmode="decimal" placeholder="Ex.: 65"')}${field("Altura (cm) · opcional", "height", "number", 'min="100" max="250" step="0.1" inputmode="decimal" placeholder="Ex.: 170"')}</div>${select("Referência para a equação · opcional", "sex", C.choices.sex)}<p class="guide-small">A equação publicada usa duas referências fisiológicas. A escolha não define sua identidade. Se não for adequada ao seu contexto, deixe sem usar.</p>${select("Como é sua atividade diária?", "activity", C.choices.activity)}${["gain", "lose"].includes(draft.goal) ? field("Peso desejado (kg) · opcional", "target", "number", 'min="20" max="400" step="0.1" inputmode="decimal" placeholder="Sem prazo automático"') : ""}`,
      `<h2 id="guideStepTitle" tabindex="-1">Comida que cabe na sua rotina.</h2><p>Usamos estas respostas para filtrar ideias de refeições. As quantidades dependem da sua fome, do seu contexto e de orientação individual.</p>${select("Preferência alimentar", "pattern", C.choices.pattern)}${select("Tempo para preparar", "time", C.choices.time)}${select("Restrições alimentares", "allergy", C.choices.allergy)}<fieldset id="guideAvoids" class="guide-avoids" ${draft.allergy === "selected" ? "" : "hidden"}><legend>Alimentos a evitar · se você indicou restrições</legend>${Object.entries(
        C.choices.allergens,
      )
        .map(
          ([value, label]) =>
            `<label><input type="checkbox" name="avoids" value="${value}" ${draft.avoids.includes(value) ? "checked" : ""}><span>${label}</span></label>`,
        )
        .join(
          "",
        )}</fieldset><div class="field"><label for="guide-notes">Preferências e lembretes · opcional</label><textarea id="guide-notes" name="notes" rows="2" maxlength="300" placeholder="Algo que você quer lembrar ao escolher suas refeições">${esc(draft.notes)}</textarea></div><p class="guide-small">Lembretes são anotações, não filtros automáticos. Para outra alergia ou restrição não listada, marque “Outra restrição”: as sugestões ficam pausadas.</p>`,
    ];
    return `<section class="guide-setup"><div class="guide-step-meta"><span>Etapa ${step + 1} de 4</span><button type="button" class="guide-button" onclick="LumeGuide.cancel()">${guide().setup.complete ? "Cancelar edição" : "Sair sem salvar"}</button></div><div class="guide-progress" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i <= step ? "done" : ""}"></i>`).join("")}</div><form id="guideSetup" onsubmit="LumeGuide.next(event)">${pages[step]}<p id="guideSetupStatus" role="status"></p><footer class="guide-form-actions">${step ? '<button type="button" class="guide-button" onclick="LumeGuide.back()">Voltar</button>' : "<span></span>"}<button type="submit" class="primary-btn">${step === 3 ? "Concluir meu guia" : "Continuar"}${arrow()}</button></footer><p class="guide-small">Suas respostas só são guardadas ao concluir. No modo local, ficam neste aparelho; em uma conta, seguem sua sincronização privada. Entram no backup e não aparecem para amigos.</p></form></section>`;
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
  function next(event) {
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
      ["summary", "Resumo"],
      ["food", "Alimentação"],
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
    const s = data.setup,
      m = C.metrics(s, data.entries),
      t = C.trend(data.entries);
    return `<section class="guide-summary-intro"><h2 tabindex="-1">Seu contexto, com clareza.</h2><p>${s.complete ? esc(C.choices.goal[s.goal]) + ". Você escolhe o que acompanhar." : "Explore o conteúdo e configure quando quiser."}</p>${button(s.complete ? "Revisar minhas respostas" : "Montar meu guia", "LumeGuide.start()")}</section><section class="guide-section"><h3>Antes dos números</h3><p>Uma estimativa ajuda a fazer perguntas. Ela não mede sua composição corporal e não diz, sozinha, quanto você precisa comer.</p>${!m.eligible ? '<p class="guide-note">As estimativas estão desativadas. Para usá-las, informe idade adulta e um contexto sem as situações que pedem acompanhamento individual.</p>' : '<p class="guide-small">Referências educativas para adultos. A atividade diária e as diferenças individuais podem mudar bastante o resultado.</p>'}<dl class="guide-readings"><div><dt>Energia de manutenção <span>Estimativa de gasto diário, não meta de consumo.</span></dt><dd>${m.energy ? `≈ ${n(m.energy, 0)} <small>kcal/dia</small>` : "Não estimada"}</dd></div><div><dt>Índice de massa corporal <span>Relação entre peso e altura; não distingue músculo de gordura.</span></dt><dd>${m.bmi ? `${n(m.bmi)} <small>kg/m²</small>` : "Não calculado"}</dd></div>${s.target && ["gain", "lose"].includes(s.goal) ? `<div><dt>Diferença até o peso informado <span>Comparação numérica, sem prazo nem avaliação do objetivo.</span></dt><dd>${m.eligible && m.delta !== null ? `${m.delta > 0 ? "+" : ""}${n(m.delta)} <small>kg</small>` : "Não calculada"}</dd></div>` : ""}</dl>${m.weightDate ? `<p class="guide-small">Peso usado: ${n(m.weight)} kg, registro de ${day(m.weightDate)}. Seu perfil não foi alterado.</p>` : '<p class="guide-small">Quando houver um registro em Evolução, o peso mais recente será usado nas referências.</p>'}${fold("Como estas estimativas funcionam", `<p>Manutenção: equação de Mifflin-St Jeor para gasto em repouso, multiplicada por atividade (${n(m.factor, 3)}). O resultado é arredondado a 50 kcal para evitar falsa precisão. Não adicionamos déficit ou superávit.</p><p>Aqui a estimativa exige idade de 19 a 78 anos, medidas completas e IMC entre 18,5 e 40. São limites conservadores do recurso, não uma classificação de saúde. Fora deles, procure avaliação individual. O IMC descritivo aparece de 18 a 100 anos no contexto geral.</p><p>Referências fisiológicas ou situações não representadas na equação precisam de avaliação própria. Nenhum resultado gera prescrição ou previsão de peso.</p><p>${sources.energy}<br>${sources.bmi}</p>`)}</section><section class="guide-water guide-section"><div>${metricIllustration("water")}</div><div><h3>Hidratação é contexto.</h3><p>Água dos alimentos e das bebidas também conta. Deixe água potável acessível e observe sua sede, o calor e o esforço do dia.</p>${fold("Entender a referência de líquidos", `<p>A EFSA apresenta 2,0 L/dia na referência feminina e 2,5 L/dia na masculina de <strong>água total</strong>, incluindo alimentos e bebidas, em condições moderadas. Não são litros extras de água para beber, nem uma meta individual.</p><p>Treino, clima e saúde mudam a necessidade. Se você recebeu restrição de líquidos, siga sua orientação profissional.</p><p>${sources.water}</p>`)}</div></section><section class="guide-next"><div><h3>Do conceito para o prato.</h3><p>Entenda proteínas, carboidratos e como combinar alimentos.</p></div>${button("Explorar alimentação", "LumeGuide.go('food')")}</section><section class="guide-next"><div><h3>Sua evolução, sem pressa.</h3><p>${t.last ? `Último registro: ${n(t.last.weight)} kg · ${day(t.last.date)}.` : "Um registro pode ter só peso. Fotos e observações são opcionais."}</p></div>${button("Acompanhar evolução", "LumeGuide.go('weight')")}</section><p class="guide-small">Você pode apagar seus registros e exportar um backup em Ajustes → Armazenamento. Fotos não são analisadas por IA.</p>`;
  }
  function food(data) {
    const s = data.setup,
      options = C.mealOptions(s);
    return `<section class="guide-food-intro"><img src="__HERO_FOOD__" alt="" width="240" height="240"><div><h2 tabindex="-1">Comer bem pode ser simples.</h2><p>Comece pela variedade e por alimentos que façam parte da sua vida. Não é preciso contar cada grama para observar seus hábitos.</p></div></section><section class="guide-section"><h3>Entenda o que está no prato</h3><p>Os alimentos combinam nutrientes. Feijão, por exemplo, oferece carboidratos, proteínas e fibras.</p>${fold("Proteínas · construção e reparação", `<p>Participam da manutenção dos tecidos, inclusive dos músculos. Ovos, leite, carnes, peixes, feijões, lentilhas e soja são fontes. Varie as fontes ao longo do dia; uma quantidade maior não é automaticamente melhor.</p><p>Treino, idade e saúde mudam a necessidade. Uma meta em gramas deve considerar o conjunto da alimentação, especialmente em condições clínicas.</p><p>${sources.who}</p>`)}${fold("Carboidratos · energia para o dia", `<p>Ajudam a fornecer energia para o corpo e os treinos. Arroz, milho, aveia, mandioca, frutas e feijões são exemplos. Prefira variedade, incluindo alimentos com fibras; não é necessário excluir todo carboidrato.</p><p>${sources.who}</p>`)}${fold("Gorduras · também têm função", `<p>Fazem parte das células e ajudam na absorção de algumas vitaminas. Azeite, sementes e castanhas podem compor as refeições. Concentram energia, por isso a quantidade e a preparação também importam.</p><p>${sources.who}</p>`)}${fold("Fibras e micronutrientes · variedade conta", `<p>Frutas, verduras, legumes, feijões e cereais integrais ampliam a variedade de fibras, vitaminas e minerais. Alterne cores e preparações. Aumente fibras gradualmente, respeitando sua tolerância.</p><p>Suplementos não substituem uma alimentação variada e não são necessários só porque você treina. Necessidades específicas pedem avaliação.</p><p>${sources.brazil}</p>`)}</section><section class="guide-section"><h3>Monte uma combinação, não uma regra.</h3><p>Use esta estrutura como uma ideia flexível para almoço e jantar. Não representa proporções ou porções prescritas.</p><div class="guide-plate-layout"><svg class="guide-plate" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="90"/><circle cx="100" cy="100" r="71"/><path d="M100 29v142M100 100h71"/><path d="m53 73 12-14 13 14-13 16zM47 116q22-25 35 0q-13 26-35 0M123 55h22v22h-22zM120 133q15-20 30 0q-15 20-30 0"/></svg><ul><li><strong>Uma base</strong><span>Cereal, raiz ou tubérculo.</span></li><li><strong>Uma leguminosa ou outra proteína</strong><span>Escolha fontes que combinem com você.</span></li><li><strong>Vegetais e variedade</strong><span>Mude as opções conforme acesso, gosto e estação.</span></li></ul></div><p class="guide-small">A alimentação não cabe inteira em um desenho. Cultura, fome, saciedade, tempo e acesso fazem parte dela.</p>${fold("Organizar sem complicar", `<p>Reserve um momento para decidir o que preparar. Aproveite ingredientes em mais de uma refeição e congele porções quando possível. Priorize alimentos in natura e minimamente processados, usando óleos, sal e açúcar com moderação nas preparações.</p><p>Faça as refeições com atenção, em horários que funcionem para você. O orçamento e a disponibilidade também orientam boas escolhas.</p><p>${sources.brazil}</p>`)}</section><section class="guide-section"><h3>Densidade energética</h3><p>É a energia por grama de alimento. Ajuda a entender por que porções de mesmo peso podem fornecer energias diferentes; não classifica um alimento como bom ou ruim.</p><div class="guide-density-example"><div><strong>100 kcal ÷ 200 g</strong><span>Exemplo ilustrativo de uma preparação</span></div><b>0,5 <small>kcal/g</small></b></div><p>Água e fibras costumam aumentar o volume sem tanta energia. Óleos e oleaginosas concentram mais energia e também podem ter lugar no prato. Densidade energética e qualidade nutricional são coisas diferentes.</p>${fold("Calcular a partir de um rótulo", `<p>Use energia e peso da <strong>mesma porção</strong>. Não misture kcal por 100 g com o peso de outra porção.</p><form id="guideDensity" onsubmit="LumeGuide.density(event)"><div class="guide-form-grid"><div class="field"><label for="densityEnergy">Energia da porção (kcal)</label><input id="densityEnergy" name="energy" type="number" min="0" max="100000" step="any" inputmode="decimal" required></div><div class="field"><label for="densityGrams">Peso da porção (g)</label><input id="densityGrams" name="grams" type="number" min="0.1" max="100000" step="any" inputmode="decimal" required></div></div><button class="guide-button" type="submit">Calcular densidade</button><output id="guideDensityResult" role="status"></output></form><p>${sources.density}</p>`)}</section><section class="guide-section"><div class="guide-section-heading"><div><h3>Ideias para suas refeições</h3><p>Combinações para adaptar, sem metas de calorias ou porções fixas.</p></div>${button("Preferências", "LumeGuide.start()")}</div>${
      options.length
        ? `<p class="guide-filter-note">${esc(C.choices.pattern[s.pattern])} · até ${s.time} min. Tempos aproximados, com ingredientes básicos já disponíveis.</p><p class="guide-small">O filtro considera os ingredientes listados. Confira rótulos, substituições e risco de contaminação cruzada, sobretudo em alergias e doença celíaca.</p>${[
            "Café da manhã",
            "Almoço",
            "Lanche",
            "Jantar",
          ]
            .map((kind) => {
              const list = options.filter((m) => m.kind === kind);
              return `<section class="guide-meal-group"><h4>${kind}</h4>${list.length ? list.map((m) => fold(`${m.name} <span class="guide-meal-time">${m.minutes} min</span>`, `<p>${m.foods.map(esc).join(" · ")}</p><p>${esc(m.tip)}</p><p class="guide-small">${esc(m.why)}</p>`)).join("") : '<p class="guide-small">Nenhuma combinação deste grupo atende aos filtros atuais. Você pode rever as preferências.</p>'}</section>`;
            })
            .join("")}`
        : `<p class="guide-note">As combinações estão pausadas. Informe idade adulta, contexto geral e restrições nas preferências. Se houver outra restrição, condição clínica ou fase de vida especial, use orientação individual para escolher refeições.</p>`
    }${s.notes ? `<div class="guide-personal-note"><strong>Seu lembrete</strong><p>${esc(s.notes)}</p></div>` : ""}${button("Registrar o que comi", "switchTab('nutrition')", true)}</section><details class="guide-fold"><summary>Fontes e limites deste guia</summary><p>Conteúdo educativo consultado em 13/11/2026. As combinações são exemplos editoriais inspirados em alimentação variada; não foram calculadas como dieta individual. Estimativas, gostos e filtros não substituem avaliação nutricional.</p><ul class="guide-source-list">${Object.values(
      sources,
    )
      .map((link) => `<li>${link}</li>`)
      .join(
        "",
      )}</ul><p>Os textos ficam disponíveis offline. Os links das fontes precisam de internet.</p></details>`;
  }
  function weight(data) {
    const entries = data.entries.slice().reverse(),
      t = C.trend(data.entries);
    return `<section class="guide-summary-intro"><h2 tabindex="-1">Seu corpo tem uma história.</h2><p>O peso é um registro, não uma nota. Observe o conjunto e escolha uma frequência que seja confortável para você.</p>${button("Registrar peso", "LumeGuide.edit()", true)}</section>${
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
        : `<section class="guide-weight-empty">${metricIllustration("body")}<h3>Um registro de cada vez.</h3><p>Quando você quiser, guarde seu peso e uma observação. Até quatro fotos por registro são opcionais e ficam privadas.</p></section>`
    }${fold("Como fazer registros comparáveis", `<p>Use a mesma balança em piso firme e, quando possível, condições parecidas de horário e roupa. Uma frequência semanal ou mensal pode ser suficiente; não é preciso se pesar todo dia.</p><p>Se registrar o peso ou ver fotos trouxer sofrimento, você pode pausar e buscar apoio. Seu guia continua útil sem isso.</p><p>${sources.weight}</p>`)}<p class="guide-small">Fotos e observações ficam no documento privado da conta ou no modo local e entram no backup. Não vão para amigos e não passam por análise de corpo ou reconhecimento por IA. O limite é de 20 fotos no total para preservar espaço no aparelho.</p>`;
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
  return {
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
