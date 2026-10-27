const STORAGE_KEY = 'lumefit_v4_demo';
const PREV_KEY = 'lumefit_v2';
const LEGACY_KEY = 'gymtrack_v1';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
const shortDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const dayLabel = r => Number.isInteger(r.weekday) && r.weekday>=0 && r.weekday<=6 ? WEEKDAYS[r.weekday] : 'Sem dia definido';
const dayField = value => `<div class="field"><label>Dia da semana</label><select name="weekday"><option value="">Escolher depois</option>${WEEKDAYS.map((name,i)=>`<option value="${i}" ${value===i?'selected':''}>${name}</option>`).join('')}</select></div>`;

const state = {
  db: initialData(),
  currentTab: 'home',
  activeWorkout: null,
  selectedRoutineId: null,
  editingExerciseId: null,
  registerMode: 'history',
  historyExerciseFilter: 'all',
  calendarRef: new Date(),
  frequencyView: 'week',
};

function initialData(){
  return {
    profile: { name: 'Atleta', age: '', weight: '', height: '', photo: '', activity: 'moderate', sex: 'unspecified', goal: 'maintain', goalKg: '' },
    routines: [],
    sessions: [],
  };
}

function ex(name, sets, minReps, maxReps, icon){
  return { id: uid(), name, sets, minReps, maxReps, icon };
}

function seedSessions(){
  const today = new Date();
  const iso = (daysAgo) => new Date(today.getFullYear(), today.getMonth(), today.getDate()-daysAgo, 18, 20).toISOString();
  // these IDs will be replaced in normalizeDB when routines exist, so keep empty here
  return [];
}

function loadDB(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(PREV_KEY);
    const parsed = raw ? JSON.parse(raw) : initialData();
    return normalizeDB(parsed);
  } catch {
    return normalizeDB(initialData());
  }
}

function normalizeDB(db){
  const fresh = initialData();
  const out = {
    profile: { ...fresh.profile, ...(db.profile||{}) },
    routines: Array.isArray(db.routines) && db.routines.length ? db.routines : fresh.routines,
    sessions: Array.isArray(db.sessions) ? db.sessions : []
  };
  out.routines = out.routines.map(r => ({
    id: r.id || uid(),
    name: r.name || 'Treino',
    weekday: Number.isInteger(r.weekday) && r.weekday>=0 && r.weekday<=6 ? r.weekday : null,
    exercises: Array.isArray(r.exercises) ? r.exercises.map(e => ({
      id: e.id || uid(),
      name: e.name || 'Exercício',
      sets: clamp(Number(e.sets)||3, 1, 12),
      minReps: clamp(Number(e.minReps)||8, 1, 99),
      maxReps: clamp(Number(e.maxReps)||12, 1, 99),
      icon: e.icon || 'dumbbell'
    })) : []
  }));
  return out;
}

function createSeedSessions(routines){
  const byName = (rName, eName) => routines.find(r=>r.name===rName)?.exercises.find(e=>e.name===eName)?.id;
  const makeSet = (kg, reps) => ({kg, reps});
  const d = new Date();
  const iso = (daysAgo) => new Date(d.getFullYear(), d.getMonth(), d.getDate()-daysAgo, 19, 15).toISOString();
  return [
    {
      id: uid(),
      date: iso(1),
      name: 'Costas e bíceps',
      routineId: routines[1]?.id,
      entries: [
        { exerciseId: byName('Costas e bíceps','Rosca direta'), name:'Rosca direta', sets:[makeSet(12,10), makeSet(12,10), makeSet(14,8)] },
        { exerciseId: byName('Costas e bíceps','Remada baixa'), name:'Remada baixa', sets:[makeSet(35,12), makeSet(40,10), makeSet(40,10)] },
      ]
    },
    {
      id: uid(),
      date: iso(4),
      name: 'Peito, ombro e tríceps',
      routineId: routines[0]?.id,
      entries: [
        { exerciseId: byName('Peito, ombro e tríceps','Supino reto'), name:'Supino reto', sets:[makeSet(28,10), makeSet(30,10), makeSet(30,8)] },
        { exerciseId: byName('Peito, ombro e tríceps','Supino inclinado'), name:'Supino inclinado', sets:[makeSet(22,12), makeSet(22,10), makeSet(24,8)] },
      ]
    },
    {
      id: uid(),
      date: iso(8),
      name: 'Pernas',
      routineId: routines[2]?.id,
      entries: [
        { exerciseId: byName('Pernas','Agachamento'), name:'Agachamento', sets:[makeSet(40,10), makeSet(45,8), makeSet(45,8), makeSet(50,6)] },
      ]
    },
    {
      id: uid(),
      date: iso(11),
      name: 'Peito, ombro e tríceps',
      routineId: routines[0]?.id,
      entries: [
        { exerciseId: byName('Peito, ombro e tríceps','Supino reto'), name:'Supino reto', sets:[makeSet(26,10), makeSet(28,10), makeSet(28,8)] },
      ]
    },
    {
      id: uid(),
      date: iso(15),
      name: 'Costas e bíceps',
      routineId: routines[1]?.id,
      entries: [
        { exerciseId: byName('Costas e bíceps','Rosca direta'), name:'Rosca direta', sets:[makeSet(10,12), makeSet(10,10), makeSet(12,8)] },
      ]
    },
  ];
}

function saveDB(){
  if (window.LumeAuth) window.LumeAuth.persist(state.db);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db));
}

function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.style.display = 'none', 2200);
}

function switchTab(tab){
  state.currentTab = tab;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${tab}`));
  $$('#bottomNav button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  render();
}

function currentRoutine(){
  return state.db.routines.find(r => r.id === state.selectedRoutineId) || state.db.routines[0] || null;
}

function allExercises(){
  return state.db.routines.flatMap(r => r.exercises.map(e => ({...e, routineName: r.name}))); 
}

function volumeOfSession(session){
  return (session.entries||[]).flatMap(e=>e.sets||[]).reduce((sum,s)=>sum+(Number(s.kg)||0)*(Number(s.reps)||0),0);
}

function getMonthSessions(date){
  return state.db.sessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth()===date.getMonth() && d.getFullYear()===date.getFullYear();
  });
}

function frequencyPct(){
  const now = new Date();
  const sessions = getMonthSessions(now);
  const trainedDays = new Set(sessions.map(s => new Date(s.date).toDateString())).size;
  const daysPassed = now.getDate();
  return Math.min(100, Math.round((trainedDays / 20) * 100));
}

function bestWeight(exerciseId){
  let best = null;
  state.db.sessions.forEach(s => {
    (s.entries||[]).forEach(e => {
      if (e.exerciseId === exerciseId) (e.sets||[]).forEach(set => {
        if (best == null || set.kg > best) best = set.kg;
      });
    });
  });
  return best;
}

function lastEntry(exerciseId){
  const matches = state.db.sessions
    .slice()
    .sort((a,b)=> new Date(a.date)-new Date(b.date))
    .flatMap(s => (s.entries||[]).filter(e => e.exerciseId === exerciseId).map(e => ({...e, date:s.date})));
  return matches[matches.length-1] || null;
}

function exerciseProgress(exerciseId){
  const arr = [];
  state.db.sessions
    .slice()
    .sort((a,b)=> new Date(a.date)-new Date(b.date))
    .forEach(s => {
      const entry = (s.entries||[]).find(e => e.exerciseId === exerciseId);
      if (entry){
        const maxKg = Math.max(...entry.sets.map(x => Number(x.kg)||0));
        arr.push({ date: s.date, kg: maxKg });
      }
    });
  return arr;
}

function latestRoutine(){
  return state.db.routines[0] || null;
}

function nextWorkoutCard(){
  const today = new Date().getDay();
  const scheduled = state.db.routines.filter(r=>r.weekday===today);
  const r = scheduled[0] || null;
  if (!state.db.routines.length) return `<div class="today-workout" onclick="openRoutineSheet()"><h4>Seu próximo treino começa aqui</h4><b>Crie sua primeira rotina</b><small>Escolha o dia e adicione seus exercícios</small><div class="arrow">›</div></div>`;
  if (!r) return `<div class="today-workout" onclick="switchTab('workouts')"><h4>Seu planejamento</h4><b>Nenhum treino agendado para hoje</b><small>Confira suas rotinas e os dias da semana</small><div class="arrow">›</div></div>`;
  return `<div class="today-workout" onclick="openRoutine('${r.id}')"><h4>Treino de hoje</h4><b>${esc(r.name)}</b><small>${r.exercises.length} exercícios · ${dayLabel(r)}</small><div class="arrow">›</div>${dumbbellArt()}</div>`;
}

function render(){
  renderHome();
  renderWorkouts();
  renderRegister();
  renderHistory();
  renderFrequency();
  renderSettings();
  renderKnowledge();
}

function weeklyActivityCard(){
 const now=new Date(); const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
 const key=d=>`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
 const hits=new Set(state.db.sessions.map(s=>key(new Date(s.date))));
 const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d;});
 const count=days.filter(d=>hits.has(key(d))).length;
 return `<section class="week-card" aria-label="Atividade desta semana"><div class="week-heading"><h3>Seu ritmo nesta semana</h3><small>${count} ${count===1?'dia ativo':'dias ativos'}</small></div><div class="week-days">${days.map((d,i)=>`<div class="week-day ${hits.has(key(d))?'hit':''} ${key(d)===key(now)?'today':''}" aria-label="${['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'][i]}, dia ${d.getDate()}${hits.has(key(d))?', treino registrado':''}${key(d)===key(now)?', hoje':''}"><span>${['SEG','TER','QUA','QUI','SEX','SÁB','DOM'][i]}</span><b>${d.getDate()}</b></div>`).join('')}</div><p class="week-note">${count?'Cada registro conta a sua história. Confira sua evolução no Histórico.':'Sua semana começa com um registro. Organize suas rotinas e treine no seu ritmo.'} Dias de descanso também fazem parte do planejamento.</p></section>`;
}

function renderHome(){
  const root = $('#screen-home');
  const profile = state.db.profile;
  const total = getMonthSessions(new Date()).length;
  const freq = frequencyPct();
  const vol = state.db.sessions.reduce((s, session) => s + volumeOfSession(session), 0);
  const recent = state.db.sessions.slice().sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,2);
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>${new Date().getHours()<12 ? "Bom dia" : new Date().getHours()<18 ? "Boa tarde" : "Boa noite"},<br>${esc(firstName(profile.name))}.</h1>
        <p>${capitalize(fmtDate(new Date()))}</p>
      </div>
      <button class="icon-btn" onclick="switchTab('frequency')">${calendarIcon()}</button>
    </div>
    <div class="hero-card">
      ${nextWorkoutCard()}
    </div>
    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon">${dumbbellSmallIcon()}</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">Treinos no mês</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">${barsIcon()}</div>
        <div class="stat-value">${freq}%</div>
        <div class="stat-label">Meta mensal</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">${boltIcon()}</div>
        <div class="stat-value">${vol.toLocaleString('pt-BR')}</div>
        <div class="stat-label">Volume total</div>
      </div>
    </div>
    ${weeklyActivityCard()}
    <div class="section-title"><h3>Últimos treinos</h3><button class="link" onclick="switchTab('history')">Ver todos</button></div>
    <div class="mini-list">
      ${recent.length ? recent.map(s => `
        <div class="mini-item" onclick="switchTab('history')">
          <div class="ico">${miniRoutineIcon()}</div>
          <div>
            <strong>${esc(s.name)}</strong>
            <small>${shortDate(s.date)} • ${(s.entries||[]).length} exercícios</small>
          </div>
          <div class="push">›</div>
        </div>`).join('') : `<div class="empty">Sua evolução começa aqui.<br>Conclua seu primeiro treino para acompanhar os resultados.</div>`}
    </div>`;
}

function renderWorkouts(){
  const root = $('#screen-workouts');
  const routine = currentRoutine();
  if (!routine){
    root.innerHTML = `<div class="page-head"><div><h2>Treinos</h2><p>Crie sua primeira rotina para começar.</p></div></div><button class="primary-btn" onclick="openRoutineSheet()">＋ Criar rotina</button>`;
    return;
  }
  if (!state.selectedRoutineId){
    root.innerHTML = `
      <div class="page-head"><div><h2>Treinos</h2></div><button class="icon-btn" onclick="openRoutineSheet()">＋</button></div>
      <div class="list-stack">
        ${state.db.routines.map(r => `
          <div class="card screen-card">
            <div class="mini-item" style="padding:0;background:none;border:0">
              <div class="ico" aria-hidden="true">${miniRoutineIcon()}</div>
              <button type="button" onclick="openRoutine('${r.id}')" style="flex:1;min-width:0;text-align:left;background:transparent;border:0;color:inherit;padding:0">
                <strong>${esc(r.name)}</strong>
                <small>${r.exercises.length} exercícios · ${dayLabel(r)}</small>
              </button>
              <button type="button" class="ghost-btn" aria-label="Excluir rotina ${esc(r.name)}" title="Excluir rotina" style="padding:10px 12px" onclick="deleteRoutine('${r.id}')">Excluir</button>
            </div>
          </div>`).join('')}
      </div>`;
    return;
  }
  root.innerHTML = `
    <div class="bar">
      <button class="back" onclick="closeRoutine()">‹</button>
      <div style="flex:1;text-align:center;font-weight:600;letter-spacing:-.02em">Treino</div>
      <button class="back dot-menu" onclick="openEditRoutineSheet('${routine.id}')" aria-label="Editar dia do treino">✎</button>
    </div>
    <div class="page-head" style="margin-top:0">
      <div>
        <h2 style="font-size:22px">${esc(routine.name)}</h2>
        <p>${routine.exercises.length} exercícios · ${dayLabel(routine)}</p>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px">
      <button class="ghost-btn" onclick="deleteRoutine('${routine.id}')">Excluir rotina</button>
      <button class="ghost-btn" onclick="openExerciseSheet('${routine.id}')">＋ Exercício</button>
    </div>
    <div class="list-stack">
      ${routine.exercises.map(exercise => `
        <div class="exercise-card" onclick="startWorkout('${routine.id}','${exercise.id}')">
          <div class="exercise-thumb">${exerciseIcon(exercise.icon)}</div>
          <div>
            <strong>${esc(exercise.name)}</strong>
            <small>${exercise.sets} séries • ${exercise.minReps}-${exercise.maxReps} reps</small>
          </div>
          <div class="push">›</div>
        </div>`).join('')}
    </div>
    <div class="bottom-cta">
      <button class="primary-btn" onclick="startWorkout('${routine.id}')">▶ Iniciar treino</button>
    </div>`;
}

function renderRegister(){
  const root = $('#screen-register');
  const active = state.activeWorkout;
  if (!active){
    root.innerHTML = `<div class="empty">Selecione um treino para registrar suas séries.</div>`;
    return;
  }
  const routine = state.db.routines.find(r => r.id === active.routineId);
  const current = active.entries[active.index];
  const prev = lastEntry(current.exerciseId);
  const best = bestWeight(current.exerciseId);
  const detailsText = current.targetText;
  root.innerHTML = `
    <div class="bar">
      <button class="back" onclick="cancelWorkout()">‹</button>
      <div style="flex:1;text-align:center;font-weight:600;letter-spacing:-.02em">Registrar</div>
      <button class="back dot-menu" onclick="switchRegisterMode()">⋯</button>
    </div>
    <div class="register-hero">
      <div>
        <h3>${esc(current.name)}</h3>
        <small style="color:#bdbdbd">${esc(routine.name)}</small>
      </div>
      <div class="machine-art">${machineArt(current.icon)}</div>
    </div>
    <div class="segmented">
      <button class="seg-btn ${state.registerMode==='history' ? 'active' : ''}" onclick="setRegisterMode('history')">Histórico</button>
      <button class="seg-btn ${state.registerMode==='details' ? 'active' : ''}" onclick="setRegisterMode('details')">Detalhes</button>
    </div>
    ${state.registerMode==='history' ? `
      <div class="register-stats">
        <div class="mini-stat"><div class="k">Último treino</div><div class="v">${prev ? `${prev.sets[0]?.kg ?? '-'} kg` : '—'}</div><small style="color:#8e8e8e">${prev ? prev.sets.map(s => `${s.kg} x ${s.reps}`).join(' • ') : 'Sem registro'}</small></div>
        <div class="mini-stat"><div class="k">Melhor carga</div><div class="v">${best ?? '—'} kg</div><small style="color:#8e8e8e">meta ${current.targetText}</small></div>
      </div>` : `
      <div class="card"><div class="section-title" style="margin:0 0 10px"><h3>Detalhes</h3></div><p style="margin:0;color:#cacaca">Faça ${current.sets.length} séries dentro da faixa alvo de ${detailsText}. Toque no círculo para marcar a série concluída.</p></div>`}
    <div class="sets-table">
      <div class="table-head"><div>Série</div><div>Carga (kg)</div><div>Repetições</div><div></div></div>
      ${current.sets.map((set, i) => `
        <div class="set-row">
          <div style="text-align:center">${i+1}</div>
          <div><input type="number" inputmode="decimal" min="0" step="0.5" value="${set.kg ?? ''}" onchange="updateSet(${i}, 'kg', this.value)"></div>
          <div><input type="number" inputmode="numeric" min="0" step="1" value="${set.reps ?? ''}" onchange="updateSet(${i}, 'reps', this.value)"></div>
          <button class="check-btn ${set.done ? 'done' : ''}" onclick="toggleSet(${i})">✓</button>
        </div>`).join('')}
    </div>
    <div class="bottom-actions">
      <button class="secondary-btn" onclick="addSetRow()">＋ Adicionar série</button>
      <button class="primary-btn" onclick="completeExercise()">${active.index === active.entries.length-1 ? 'Concluir treino' : 'Concluir exercício'}</button><button class="ghost-btn" onclick="finishWorkout()" style="width:100%">Salvar séries concluídas e finalizar</button>
      <div class="pager"><span>${active.index>0 ? '← Exercício anterior' : ''}</span><span>${active.index < active.entries.length-1 ? 'Próximo exercício →' : ''}</span></div>
    </div>`;
}

function renderHistory(){
  const root = $('#screen-history');
  const exercises = allExercises();
  if (!exercises.length && !state.db.sessions.length){ root.innerHTML = `<div class="page-head"><h2>Histórico</h2></div><div class="empty">Seu histórico aparecerá aqui após registrar um treino.</div>`; return; }
  const selected = state.historyExerciseFilter === 'all' ? exercises.find(e => exerciseProgress(e.id).length) || exercises[0] : exercises.find(e => e.id===state.historyExerciseFilter) || exercises[0];
  const progress = selected ? exerciseProgress(selected.id) : [];
  root.innerHTML = `
    <div class="page-head"><div><h2>Histórico</h2></div></div>
    <div class="chart-card">
      <div class="chart-top">
        <div>
          <div style="font-size:13px;color:#b8b8b8;margin-bottom:8px">Todos os exercícios</div>
          <select class="select" onchange="changeHistoryExercise(this.value)" ${exercises.length ? '' : 'disabled'}>
            <option value="all" ${state.historyExerciseFilter==='all'?'selected':''}>Auto</option>
            ${exercises.map(e => `<option value="${e.id}" ${state.historyExerciseFilter===e.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}
          </select>
        </div>
        <button class="icon-btn" onclick="switchTab('frequency')">↗</button>
      </div>
      <div style="font-size:16px;font-weight:600;margin-bottom:8px">${esc(selected?.name || 'Supino reto')}</div>
      <div class="chart-wrap">${lineChart(progress)}</div>
      <div class="legend">Carga (kg)</div>
    </div>
    <div class="list-stack" style="margin-top:14px">
      ${state.db.sessions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s => `
        <div class="card screen-card">
          <div class="section-title" style="margin:0 0 10px"><h3>${esc(s.name)}</h3><span style="color:#a3a3a3;font-size:14px">${shortDate(s.date)}</span></div>
          ${(s.entries||[]).map(e => `<div style="padding:8px 0;color:#cecece"><strong style="font-size:15px">${esc(e.name)}</strong><br><small>${e.sets.map(x=>`${x.kg} kg × ${x.reps}`).join(' • ')}</small></div>`).join('')}
          <div style="margin-top:8px"><button class="ghost-btn" onclick="deleteSession('${s.id}')">Excluir registro</button></div>
        </div>`).join('')}
    </div>`;
}

function renderFrequency(){
  const root = $('#screen-frequency');
  const ref = state.calendarRef;
  const monthTitle = ref.toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
  root.innerHTML = `
    <div class="page-head"><div><h2>Frequência</h2><p>Consistência, um dia de cada vez.</p></div></div>
    <div class="switcher"><button class="${state.frequencyView==='week'?'active':''}" onclick="setFrequencyView('week')">Semanal</button><button class="${state.frequencyView==='month'?'active':''}" onclick="setFrequencyView('month')">Mensal</button></div>
    <div class="chart-card">
      <div class="section-title"><h3>${state.frequencyView==='week'?'Últimas 8 semanas':'Últimos 6 meses'}</h3><span class="hint">Treinos concluídos</span></div>
      <div class="chart-wrap">${frequencyBars()}</div>
      <p class="hint">Cada barra representa a quantidade de dias em que você registrou um treino.</p>
    </div>
    <div class="calendar-card">
      <div class="calendar-head"><button class="month-nav" onclick="moveMonth(-1)">‹</button><div style="font-size:18px;font-weight:600">${capitalize(monthTitle)}</div><button class="month-nav" onclick="moveMonth(1)">›</button></div>
      <div class="weekdays"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
      <div class="days-grid" style="margin-top:12px">${calendarGrid(ref)}</div>
      <p class="hint" style="margin-bottom:0">Dias claros representam treinos registrados. Dois treinos no mesmo dia contam como um dia de frequência.</p>
    </div>`;
}
function setFrequencyView(view){state.frequencyView=view;renderFrequency()}
function frequencyBars(){
  const now=new Date();now.setHours(0,0,0,0);
  const keys=new Set(state.db.sessions.map(s=>new Date(s.date).toDateString()));
  let bars=[];
  if(state.frequencyView==='week'){
    const current=new Date(now);current.setDate(current.getDate()-((current.getDay()+6)%7));
    for(let i=7;i>=0;i--){let st=new Date(current);st.setDate(st.getDate()-7*i);let count=0;
      for(let k=0;k<7;k++){let d=new Date(st);d.setDate(d.getDate()+k);if(d<=now&&keys.has(d.toDateString()))count++}
      bars.push({name:st.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),value:count})}
  }else{
    for(let i=5;i>=0;i--){let d=new Date(now.getFullYear(),now.getMonth()-i,1);let count=new Set(getMonthSessions(d).map(s=>new Date(s.date).toDateString())).size;bars.push({name:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),value:count})}
  }
  const top=Math.max(1,...bars.map(b=>b.value));
  const width=320,height=170,left=20,bottom=29,usable=height-bottom-12;
  let svg=`<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" role="img" aria-label="Gráfico de frequência">`;
  [0,1,2,3].forEach(n=>{let y=height-bottom-(n/3)*usable;svg+=`<line x1="${left}" y1="${y}" x2="${width-5}" y2="${y}" stroke="#303030" stroke-width=".7"/><text x="2" y="${y+4}" font-size="9" fill="#999">${Math.round((n/3)*top)}</text>`});
  bars.forEach((bar,i)=>{let step=(width-left-9)/bars.length,w=Math.min(24,step*.6),x=left+i*step+(step-w)/2,bh=(bar.value/top)*usable,y=height-bottom-bh;
    svg+=`<rect class="graph-bar" style="animation-delay:${i*65}ms" x="${x}" y="${y}" width="${w}" height="${Math.max(bh,1)}" rx="4" fill="${bar.value?'#eee':'#303030'}"/><text x="${x+w/2}" y="${height-10}" text-anchor="middle" font-size="9" fill="#bbb">${bar.name}</text>`;
    if(bar.value)svg+=`<text x="${x+w/2}" y="${Math.max(10,y-5)}" text-anchor="middle" font-size="9" fill="#fff">${bar.value}</text>`;
  });return svg+'</svg>';
}

function renderSettings(){
  const root = $('#screen-settings');
  const p = state.db.profile;
  root.innerHTML = `
    <div class="page-head"><div><h2>Ajustes</h2></div></div>
    <div class="profile-card">
      <div class="avatar">${p.photo ? `<img class="profile-photo" src="${p.photo}" alt="Foto de perfil">` : userIcon()}</div>
      <div class="profile-meta">
        <h3>${esc(p.name)}</h3>
        <p>${[p.age ? `${p.age} anos` : null, p.weight ? `${p.weight} kg` : null, p.height || null].filter(Boolean).join(" • ") || "Personalize seu perfil"}</p>
      </div>
    </div>
    <div class="session-card">
      <div><strong>Conta conectada</strong><br><small id="accountEmail">${esc(window.LumeAuth?.email() || 'Modo local')}</small></div>
      <button onclick="LumeAuth.signOut()">Sair</button>
    </div>
    <div class="session-card">
      <div><strong>Sincronização</strong><br><small id="cloudState">${esc(window.LumeAuth?.status() || 'Verificando...')}</small></div>
      <button onclick="LumeAuth.syncNow()">Sincronizar</button>
    </div>
    <div class="menu-card">
      <div class="menu-row" onclick="openPhotoPicker()"><div class="menu-ico">${userIcon()}</div><div><strong>Foto de perfil</strong><small>Escolher imagem do dispositivo</small></div><div class="push">›</div></div>
      <div class="menu-row" onclick="openProfileSheet()"><div class="menu-ico">${userBadgeIcon()}</div><div><strong>Meus dados</strong><small>Nome, idade, peso e altura</small></div><div class="push">›</div></div>
      <div class="menu-row" onclick="openRoutineSheet()"><div class="menu-ico">${miniRoutineIcon()}</div><div><strong>Meus treinos</strong><small>Criar ou ajustar rotinas</small></div><div class="push">›</div></div>
      <div class="menu-row" onclick="openExerciseSheet()"><div class="menu-ico">${dumbbellSmallIcon()}</div><div><strong>Exercícios</strong><small>Adicionar novos exercícios</small></div><div class="push">›</div></div>
      <div class="menu-row" onclick="exportData()"><div class="menu-ico">${downloadIcon()}</div><div><strong>Backup e restaurar</strong><small>Exportar ou importar dados</small></div><div class="push">›</div></div>
      <div class="menu-row" onclick="openImportFile()"><div class="menu-ico">${gearIcon()}</div><div><strong>Preferências</strong><small>Importar backup JSON</small></div><div class="push">›</div></div>
    </div>
    <input id="photoFile" class="hidden" type="file" accept="image/*" onchange="receivePhoto(this)">
    <input id="importFile" class="hidden" type="file" accept="application/json,.json" onchange="importData(this)">`;
}

function openRoutine(id){
  state.selectedRoutineId = id;
  switchTab('workouts');
}
function closeRoutine(){ state.selectedRoutineId = null; render(); }

function startWorkout(routineId, exerciseId=null){
  const routine = state.db.routines.find(r=>r.id===routineId);
  if (!routine) return;
  state.activeWorkout = {
    routineId,
    index: exerciseId ? Math.max(0, routine.exercises.findIndex(e=>e.id===exerciseId)) : 0,
    entries: routine.exercises.map(exercise => ({
      exerciseId: exercise.id,
      name: exercise.name,
      icon: exercise.icon,
      targetText: `${exercise.minReps}-${exercise.maxReps} reps`,
      sets: Array.from({length: exercise.sets}, () => ({kg:'', reps:'', done:false}))
    }))
  };
  state.registerMode = 'history';
  switchTab('register');
}

async function cancelWorkout(){
  if (!state.activeWorkout) return;
  if (await lumeConfirm('Descartar treino?', 'As séries ainda não salvas serão perdidas.')) {
    state.activeWorkout = null;
    switchTab('workouts');
  }
}

function setRegisterMode(mode){ state.registerMode = mode; renderRegister(); }
function switchRegisterMode(){ state.registerMode = state.registerMode === 'history' ? 'details' : 'history'; renderRegister(); }

function updateSet(index, key, value){
  const set = state.activeWorkout?.entries[state.activeWorkout.index]?.sets[index];
  if (!set) return;
  set[key] = value;
}
function toggleSet(index){
  const set = state.activeWorkout?.entries[state.activeWorkout.index]?.sets[index];
  if (!set) return;
  set.done = !set.done;
  renderRegister();
}
function addSetRow(){
  const current = state.activeWorkout?.entries[state.activeWorkout.index];
  if (!current) return;
  current.sets.push({kg:'', reps:'', done:false});
  renderRegister();
}

function completeExercise(){
  const active = state.activeWorkout;
  if (!active) return;
  const current = active.entries[active.index];
  const validSets = current.sets.filter(s => s.done && s.kg !== '' && s.reps !== '' && Number(s.kg) >= 0 && Number(s.reps) > 0);
  if (!validSets.length){ toast('Preencha e marque pelo menos uma série.'); return; }
  current.cleanedSets = validSets.map(s => ({kg:Number(s.kg), reps:Number(s.reps)}));
  if (active.index < active.entries.length - 1){
    active.index += 1;
    state.registerMode = 'history';
    renderRegister();
    return;
  }
  finishWorkout();
}

function finishWorkout(){
  const active = state.activeWorkout;
  if (!active) return;
  const routine = state.db.routines.find(r => r.id === active.routineId);
  const entries = active.entries.map(entry => ({
    exerciseId: entry.exerciseId,
    name: entry.name,
    sets: (entry.cleanedSets || entry.sets.filter(s => s.done && s.kg !== '' && s.reps !== '').map(s => ({kg:Number(s.kg), reps:Number(s.reps)})))
  })).filter(e => e.sets.length);
  if (!entries.length){ toast('Nenhuma série válida para salvar.'); return; }
  state.db.sessions.push({
    id: uid(),
    date: new Date().toISOString(),
    name: routine.name,
    routineId: routine.id,
    entries
  });
  saveDB();
  state.activeWorkout = null;
  toast('Treino salvo com sucesso!');
  switchTab('history');
}

async function deleteRoutine(id){
  const routine = state.db.routines.find(r => r.id === id);
  if (!routine) return;
  const ok = await lumeConfirm(
    'Excluir rotina?',
    `A rotina "${routine.name}" e seus exercícios serão removidos. Os treinos já registrados no histórico serão preservados.`
  );
  if (!ok) return;
  // Apenas a rotina é excluída. O histórico é mantido para não perder evolução.
  state.db.routines = state.db.routines.filter(r => r.id !== id);
  if (state.selectedRoutineId === id) state.selectedRoutineId = null;
  if (state.activeWorkout?.routineId === id) state.activeWorkout = null;
  saveDB();
  render();
  toast('Rotina excluída.');
}

async function deleteSession(id){
  if (!await lumeConfirm('Excluir registro?', 'Este treino será removido do histórico e dos gráficos de evolução e frequência. Não é possível desfazer.')) return;
  state.db.sessions = state.db.sessions.filter(s => s.id !== id);
  saveDB();
  render();
}

function moveMonth(delta){
  state.calendarRef = new Date(state.calendarRef.getFullYear(), state.calendarRef.getMonth()+delta, 1);
  renderFrequency();
}

function changeHistoryExercise(id){
  state.historyExerciseFilter = id;
  renderHistory();
}

function openProfileSheet(){
  const p = state.db.profile;
  openSheet(`
    <h3>Editar perfil</h3>
    <form class="form" onsubmit="saveProfile(event)">
      <div class="field"><label>Nome</label><input name="name" value="${esc(p.name)}" required></div>
      <div class="field"><label>Idade</label><input name="age" type="number" min="1" value="${p.age}"></div>
      <div class="field"><label>Peso (kg)</label><input name="weight" type="number" min="1" step="0.1" value="${p.weight}"></div>
      <div class="field"><label>Altura</label><input name="height" value="${esc(p.height)}"></div>
      <div class="row-actions"><button type="button" class="ghost-btn" onclick="closeSheet()">Cancelar</button><button type="submit" class="primary-btn">Salvar</button></div>
    </form>`);
}

function saveProfile(ev){
  ev.preventDefault();
  const f = new FormData(ev.target);
  state.db.profile = {
    name: String(f.get('name')).trim(),
    age: Number(f.get('age')),
    weight: Number(f.get('weight')),
    height: String(f.get('height')).trim(),
    photo: state.db.profile.photo || '',
  };
  saveDB();
  closeSheet();
  render();
  toast('Perfil atualizado.');
}

function openRoutineSheet(){
  openSheet(`
    <h3>Nova rotina</h3>
    <form class="form" onsubmit="saveRoutine(event)">
      <div class="field"><label>Nome da rotina</label><input name="name" placeholder="Ex.: Peito, ombro e tríceps" required></div>
      ${dayField(null)}
      <div class="row-actions"><button type="button" class="ghost-btn" onclick="closeSheet()">Cancelar</button><button type="submit" class="primary-btn">Criar rotina</button></div>
    </form>`);
}

function saveRoutine(ev){
  ev.preventDefault();
  const fields = new FormData(ev.target);
  const name = String(fields.get('name')).trim();
  if (!name) return;
  const rawDay = String(fields.get('weekday') ?? '');
  const weekday = rawDay === '' ? null : Number(rawDay);
  const routine = { id: uid(), name, weekday, exercises: [] };
  state.db.routines.push(routine);
  saveDB();
  closeSheet();
  state.selectedRoutineId = routine.id;
  render();
  toast('Rotina criada.');
}

function openEditRoutineSheet(id){
  const routine=state.db.routines.find(r=>r.id===id);
  if(!routine) return;
  openSheet(`<h3>Editar rotina</h3>
    <form class="form" onsubmit="saveEditedRoutine(event,'${routine.id}')">
      <div class="field"><label>Nome da rotina</label><input name="name" value="${esc(routine.name)}" required></div>
      ${dayField(routine.weekday)}
      <div class="row-actions"><button type="button" class="ghost-btn" onclick="closeSheet()">Cancelar</button><button type="submit" class="primary-btn">Salvar mudanças</button></div>
    </form>`);
}
function saveEditedRoutine(ev,id){
  ev.preventDefault();
  const routine=state.db.routines.find(r=>r.id===id);
  if(!routine)return;
  const f=new FormData(ev.target);
  const name=String(f.get('name')||'').trim();
  if(!name)return toast('Digite um nome para o treino.');
  routine.name=name;
  const rawDay=String(f.get('weekday')??'');
  routine.weekday=rawDay===''?null:Number(rawDay);
  saveDB();closeSheet();render();toast('Rotina atualizada.');
}

function openExerciseSheet(routineId = state.selectedRoutineId){
  if(!state.db.routines.length){toast('Crie uma rotina primeiro.');openRoutineSheet();return}
  const list = state.db.routines.map(r => `<option value="${r.id}" ${r.id===routineId ? 'selected':''}>${esc(r.name)}</option>`).join('');
  openSheet(`
    <h3>Novo exercício</h3>
    <form class="form" onsubmit="saveExercise(event)">
      <div class="field"><label>Rotina</label><select name="routineId">${list}</select></div>
      <div class="field"><label>Nome</label><input name="name" placeholder="Ex.: Supino reto" required></div>
      <div class="field"><label>Séries</label><input name="sets" type="number" min="1" max="12" value="3" required></div>
      <div class="field"><label>Repetições mínimas</label><input name="minReps" type="number" min="1" max="99" value="8" required></div>
      <div class="field"><label>Repetições máximas</label><input name="maxReps" type="number" min="1" max="99" value="12" required></div>
      <div class="field"><label>Ícone</label><select name="icon"><option value="bench">Supino</option><option value="dumbbell">Halter</option><option value="press">Desenvolvimento</option><option value="raise">Elevação</option><option value="cable">Polia</option><option value="pull">Puxada</option><option value="curl">Rosca</option><option value="legs">Pernas</option></select></div>
      <div class="row-actions"><button type="button" class="ghost-btn" onclick="closeSheet()">Cancelar</button><button type="submit" class="primary-btn">Adicionar</button></div>
    </form>`);
}

function saveExercise(ev){
  ev.preventDefault();
  const f = new FormData(ev.target);
  const routine = state.db.routines.find(r => r.id === f.get('routineId'));
  if (!routine) return;
  const minReps = Number(f.get('minReps'));
  const maxReps = Number(f.get('maxReps'));
  routine.exercises.push({
    id: uid(),
    name: String(f.get('name')).trim(),
    sets: clamp(Number(f.get('sets')) || 3, 1, 12),
    minReps: Math.min(minReps, maxReps),
    maxReps: Math.max(minReps, maxReps),
    icon: String(f.get('icon'))
  });
  saveDB();
  closeSheet();
  state.selectedRoutineId = routine.id;
  render();
  toast('Exercício adicionado.');
}

function exportData(){
  const blob = new Blob([JSON.stringify(state.db, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lume-fit-backup.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 800);
  toast('Backup exportado.');
}

function openImportFile(){ $('#importFile')?.click(); }
async function importData(input){
  const file = input.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.routines)||!Array.isArray(parsed.sessions))throw Error('Backup inválido');
    if (!await lumeConfirm('Importar backup?', 'Isso substituirá os treinos e os dados atuais deste aparelho.'))return;
    state.db = normalizeDB(parsed);
    saveDB();
    render();
    toast('Backup importado.');
  } catch {
    toast('Arquivo inválido.');
  }
  input.value = '';
}

function openSheet(html){
  $('#sheetContent').innerHTML = html;
  $('#sheet').classList.add('active');
  $('#sheet').setAttribute('aria-hidden', 'false');
}
function closeSheet(){
  $('#sheet').classList.remove('active');
  $('#sheet').setAttribute('aria-hidden', 'true');
}
$$('#bottomNav button').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
$('#dialogCancel').addEventListener('click',()=>answerDialog(false));
$('#dialogConfirm').addEventListener('click',()=>answerDialog(true));
$('#sheet').addEventListener('click', (e)=>{ if (e.target.id === 'sheet') closeSheet(); });

function lineChart(points){
  if(!points.length) return `<div class="empty">Seu gráfico aparecerá após registrar este exercício.</div>`;
  const values=points.slice(-10);
  const width=600,height=250;
  const left=46,right=20,top=27,bottom=38;
  const pw=width-left-right,ph=height-top-bottom;
  const rawMin=Math.min(...values.map(p=>p.kg));
  const rawMax=Math.max(...values.map(p=>p.kg));
  const step=Math.max(2, Math.ceil((rawMax-rawMin || Math.max(rawMax*.18,2))/4));
  const min=Math.max(0,Math.floor((rawMin-step)/step)*step);
  const max=Math.max(rawMax+step,min+step*4);
  const px=i=>values.length===1 ? left+pw/2 : left+12+(pw-24)*i/(values.length-1);
  const py=v=>top+ph-(v-min)/(max-min)*ph;
  const ticks=Array.from({length:5},(_,i)=>min+(max-min)*i/4);
  const grid=ticks.map(v=>`<g><line x1="${left}" x2="${width-right}" y1="${py(v)}" y2="${py(v)}" stroke="#242424" stroke-width="1"/><text x="${left-12}" y="${py(v)+4}" text-anchor="end" font-size="12" fill="#909090">${Number.isInteger(v)?v:v.toFixed(1)}</text></g>`).join('');
  const stride=values.length>5?Math.ceil(values.length/5):1;
  const xLabels=values.map((p,i)=>i%stride===0||i===values.length-1?`<text x="${px(i)}" y="${height-10}" text-anchor="middle" fill="#9c9c9c" font-size="12">${new Date(p.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</text>`:'').join('');
  const d=values.map((p,i)=>`${i?'L':'M'}${px(i).toFixed(1)},${py(p.kg).toFixed(1)}`).join(' ');
  const dots=values.map((p,i)=>`<g><circle class="progress-point" style="animation-delay:${.2+i*.09}s" cx="${px(i)}" cy="${py(p.kg)}" r="5" fill="#f6f6f6" stroke="#101010" stroke-width="2"><title>${new Date(p.date).toLocaleDateString('pt-BR')}: ${p.kg} kg</title></circle></g>`).join('');
  const latest=values[values.length-1];
  return `<div class="progress-summary"><span>Melhor carga</span><strong>${rawMax.toLocaleString('pt-BR')} kg</strong><small>${values.length} ${values.length===1?'registro':'registros'} exibidos</small></div><svg class="progress-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução de carga por data" xmlns="http://www.w3.org/2000/svg">${grid}${values.length>1?`<path class="progress-path" d="${d}" fill="none" stroke="#eeeeee" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>`:''}${dots}${xLabels}</svg>`;
}

function calendarGrid(ref){
  const sessions = new Set(getMonthSessions(ref).map(s => new Date(s.date).getDate()));
  const year = ref.getFullYear(), month = ref.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = first.getDay();
  const total = last.getDate();
  const prevLast = new Date(year, month, 0).getDate();
  let cells = '';
  for (let i = 0; i < start; i++){
    cells += `<div class="day-cell muted">${prevLast - start + i + 1}</div>`;
  }
  const now = new Date();
  for (let day = 1; day <= total; day++){
    const isToday = now.getFullYear()===year && now.getMonth()===month && now.getDate()===day;
    cells += `<div class="day-cell ${sessions.has(day)?'hit':''} ${isToday?'today':''}">${day}</div>`;
  }
  const filled = start + total;
  const rest = (7 - (filled % 7)) % 7;
  for (let d = 1; d <= rest; d++) cells += `<div class="day-cell muted">${d}</div>`;
  return cells;
}

function capitalize(str){ return str.charAt(0).toUpperCase() + str.slice(1); }
function firstName(name){ return String(name||'').split(' ')[0] || 'Atleta'; }

function dumbbellArt(){
  return `<svg class="dumbbell-art" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="rgba(255,255,255,.75)" stroke-width="9" stroke-linecap="round">
      <path d="M56 62h108"/>
      <path d="M42 42v40M57 36v52M164 36v52M179 42v40"/>
      <path d="M30 48v28M191 48v28"/>
    </g>
  </svg>`;
}

function machineArt(kind='bench'){
 const shapes={
  bench:'<path d="M20 55h108M42 55V78M108 55V78M65 36h45M66 38l-15 17M95 39l15 16M28 18v32M132 18v32M18 29h124M10 21v16M150 21v16"/><circle cx="76" cy="42" r="8"/>',
  dumbbell:'<path d="M28 44h104M20 30v28M34 25v38M126 25v38M140 30v28M11 36v16M149 36v16"/>',
  press:'<circle cx="80" cy="25" r="9"/><path d="M80 34v32M80 45l-22-18M80 45l22-18M58 27V12M102 27V12M47 12h22M91 12h22M80 66l-19 19M80 66l19 19"/>',
  raise:'<circle cx="80" cy="24" r="9"/><path d="M80 33v32M80 42l-35-24M80 42l35-24M35 18h19M106 18h19M80 65l-18 20M80 65l18 20"/>',
  cable:'<path d="M25 13v70M135 13v70M25 13h110M80 13v23M68 36h24"/><circle cx="80" cy="48" r="9"/><path d="M80 57v17M80 61l-22 9M80 61l22 9"/>',
  pull:'<path d="M25 12h110M80 12v15M53 26h54"/><circle cx="80" cy="45" r="9"/><path d="M80 54v25M80 61l-20 10M80 61l20 10M62 32l-9-6M98 32l9-6"/>',
  curl:'<circle cx="80" cy="22" r="9"/><path d="M80 31v31M80 42l-20 9M80 42l20 9M60 51l-13-12M100 51l13-12M39 39h16M105 39h16M80 62l-18 23M80 62l18 23"/>',
  legs:'<path d="M22 17h116M35 17v11M125 17v11M65 30h30M80 30v28M80 43l-26 16M80 43l26 16M54 59l-12 23M106 59l12 23"/><circle cx="80" cy="20" r="8"/>'
 };
 return `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#e9e9e9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${shapes[kind]||shapes.dumbbell}</svg>`;
}
function exerciseIcon(kind){ return machineArt(kind); }
function calendarIcon(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18v15H3z"/><path d="M3 10h18M7 3v6M17 3v6"/></svg>`; }
function userIcon(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="4.1"/><path d="M4.5 20c1.9-3.7 4.7-5.5 7.5-5.5s5.6 1.8 7.5 5.5"/></svg>`; }
function userBadgeIcon(){ return userIcon(); }
function miniRoutineIcon(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h3v6H4zM17 9h3v6h-3zM7 10.5h10M7 13.5h10M2 7h2v10H2zM20 7h2v10h-2z"/></svg>`; }
function dumbbellSmallIcon(){ return miniRoutineIcon(); }
function barsIcon(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19V11M12 19V5M19 19v-8"/></svg>`; }
function boltIcon(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>`; }
function downloadIcon(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 20h16"/></svg>`; }
function gearIcon(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15.5 1.1-.64 1.27.34 1.08 1.26 1.84-1.06-.37-1.62.74-1.13 1.56-.41v-2.12l-1.56-.4-.74-1.14.37-1.61-1.84-1.06-1.08 1.26-1.27.34L12 3.5l-1.1.64-1.27-.34L8.55 2.54 6.7 3.6l.37 1.61-.74 1.14-1.56.4v2.12l1.56.41.74 1.13-.37 1.62 1.84 1.06 1.08-1.26 1.27-.34z"/><circle cx="12" cy="10.75" r="2.6"/></svg>`; }


// Dialogos com identidade visual do aplicativo, sem alertas nativos do navegador.
let dialogResolver=null;
function answerDialog(value){
 $('#dialogOverlay').classList.remove('active');$('#dialogOverlay').setAttribute('aria-hidden','true');
 const callback=dialogResolver;dialogResolver=null;if(callback)callback(value);
}
function lumeConfirm(title,message){
 if(dialogResolver)answerDialog(false);
 $('#dialogTitle').textContent=title;$('#dialogMessage').textContent=message;
 $('#dialogOverlay').classList.add('active');$('#dialogOverlay').setAttribute('aria-hidden','false');
 return new Promise(resolve=>{dialogResolver=resolve});
}
$('#dialogOverlay').addEventListener('click',e=>{if(e.target.id==='dialogOverlay')answerDialog(false)});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(dialogResolver)answerDialog(false);else closeSheet()}});

function openPhotoPicker(){ $('#photoFile')?.click(); }
async function receivePhoto(input){
 const file=input.files?.[0];if(!file)return;
 if(!file.type.startsWith('image/')){toast('Escolha uma imagem.');return}
 if(file.size>8*1024*1024){toast('Imagem muito grande (máx. 8 MB).');return}
 try{
  const bitmap=await createImageBitmap(file);let w=bitmap.width,h=bitmap.height;
  const s=Math.min(1,480/Math.max(w,h));w=Math.round(w*s);h=Math.round(h*s);
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=480;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#111';ctx.fillRect(0,0,480,480);
  ctx.drawImage(bitmap,(480-w)/2,(480-h)/2,w,h);bitmap.close();
  state.db.profile.photo=canvas.toDataURL('image/jpeg',.82);saveDB();render();toast('Foto atualizada.');
 }catch(err){toast('Não foi possível abrir a foto.')}
 input.value='';
}

const knowledgeState={sex:'unspecified',activity:'moderate',goal:'maintain',target:''};
function metricIllustration(kind){
 const paths={water:'<path d="M48 12C39 27 27 38 27 51a21 21 0 0 0 42 0C69 38 57 27 48 12Z"/><path d="M35 53c0 8 5 13 12 13"/>',energy:'<path d="m53 13-25 39h19l-4 29 25-40H49Z"/>',body:'<path d="M24 69a31 31 0 1 1 48 0M48 48l16-17"/><circle cx="48" cy="48" r="4"/><path d="M25 78h46"/>',goal:'<circle cx="48" cy="48" r="29"/><circle cx="48" cy="48" r="16"/><path d="m48 48 29-29m-1 1v13m0-13H63"/>'};
 return `<svg class="metric-illustration metric-${kind}" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]||paths.goal}</svg>`;
}
function knowledgeIntro(){
 return `<section class="knowledge-intro"><div><div class="eyebrow">SABER · ENTENDER PARA EVOLUIR</div><h3>Conheça os números.<br>Respeite seu ritmo.</h3><p>Transforme suas informações em referências fáceis de entender. Sem metas automáticas, sem comparações.</p></div><div class="knowledge-art" aria-hidden="true">${metricIllustration('body')}<span>SEU CORPO, SEU CONTEXTO</span></div></section>`;
}
function knowledgeEmpty(){
 return `<section class="metrics-preview" aria-label="Métricas disponíveis"><div class="section-title"><h3>Seu painel começa aqui</h3><span class="hint">Preencha e calcule</span></div><div class="metric-grid">${[['water','Hidratação','Referência de líquidos por dia'],['energy','Energia','Estimativa de manutenção'],['body','IMC','Um indicador, com limites'],['goal','Seu objetivo','Diferença até o peso informado']].map(([kind,title,note])=>`<div class="metric-preview">${metricIllustration(kind)}<div><strong>${title}</strong><p>${note}</p></div></div>`).join('')}</div></section>`;
}
function renderKnowledge(){
 const root=$('#screen-knowledge'),p=state.db.profile;
 root.innerHTML=`
  <div class="page-head"><div><h2>Saber</h2><p>Referências para compreender o seu corpo.</p></div></div>
  ${knowledgeIntro()}
  <div class="card knowledge-calculator"><div class="calculator-heading"><div><span class="step-label">01 / SEUS DADOS</span><h3>Vamos entender seu momento?</h3><p>Preencha abaixo para montar seu painel. Estes campos não alteram o perfil.</p></div></div>
   <div class="knowledge-form">
    <div class="field"><label>Peso (kg)</label><input id="kWeight" type="number" min="20" max="400" step=".1" placeholder="Ex.: 65" value="${p.weight||''}"></div>
    <div class="field"><label>Altura (cm)</label><input id="kHeight" type="number" min="100" max="250" placeholder="Ex.: 170" value="${parseHeight(p.height)||''}"></div>
    <div class="field"><label>Idade</label><input id="kAge" type="number" min="18" max="100" placeholder="Ex.: 25" value="${p.age||''}"></div>
    <div class="field"><label>Equação metabólica</label><select id="kSex"><option value="unspecified" ${knowledgeState.sex==='unspecified'?'selected':''}>Não informar</option><option value="female" ${knowledgeState.sex==='female'?'selected':''}>Referência feminina</option><option value="male" ${knowledgeState.sex==='male'?'selected':''}>Referência masculina</option></select></div>
    <div class="field wide"><label>Nível de atividade diária</label><select id="kActivity"><option value="sedentary" ${knowledgeState.activity==='sedentary'?'selected':''}>Pouco ativo</option><option value="light" ${knowledgeState.activity==='light'?'selected':''}>Levemente ativo</option><option value="moderate" ${knowledgeState.activity==='moderate'?'selected':''}>Moderadamente ativo</option><option value="active" ${knowledgeState.activity==='active'?'selected':''}>Muito ativo</option></select></div>
    <div class="field wide"><label>Objetivo</label><select id="kGoal"><option value="maintain" ${knowledgeState.goal==='maintain'?'selected':''}>Manter peso</option><option value="gain" ${knowledgeState.goal==='gain'?'selected':''}>Ganhar peso</option><option value="lose" ${knowledgeState.goal==='lose'?'selected':''}>Perder peso</option></select></div>
    <div class="field wide"><label>Peso desejado (kg) — opcional</label><input id="kTarget" type="number" min="20" max="400" step=".1" placeholder="Ex.: 70" value="${knowledgeState.target||''}"></div>
   </div>
   <button class="primary-btn" style="margin-top:20px" onclick="calculateMetrics()">Calcular métricas</button>
   <p class="hint">As estimativas dependem de idade, altura, peso e nível de atividade. Não representam uma prescrição nutricional.</p>
  </div>
  <div id="metricResults" aria-live="polite" aria-atomic="true">${knowledgeEmpty()}</div>
  <section class="knowledge-guide"><span class="step-label">LEIA ALÉM DOS NÚMEROS</span><h3>O contexto também importa.</h3>
   <details><summary>${metricIllustration('water')}<span>Hidratação não é uma meta fixa</span></summary><p>Referência geral de 30–35 mL de líquidos por kg por dia. Calor, exercícios, alimentação e condições de saúde podem alterar essa necessidade. O desenho não representa consumo registrado.</p></details>
   <details><summary>${metricIllustration('energy')}<span>Calorias são uma estimativa</span></summary><p>A manutenção usa a equação Mifflin-St Jeor para adultos e um fator de atividade. Não indica quanto você deve comer. Seu consumo real pode ser diferente.</p></details>
   <details><summary>${metricIllustration('body')}<span>IMC não conta a história toda</span></summary><p>Relaciona peso e altura, mas não distingue massa muscular de gordura. Não é diagnóstico nem medida direta de desempenho.</p></details>
   <details><summary>${metricIllustration('goal')}<span>Sua evolução tem seu próprio ritmo</span></summary><p>Diferença de peso e projeções são apenas ilustrativas, não uma previsão individual. Caso tenha menos de 18 anos, gestação ou condição clínica, procure orientação individualizada.</p></details>
  </section>`;
}
function parseHeight(h){const n=Number(String(h||'').replace(',','.').replace(/[^0-9.]/g,''));if(!n)return '';return n<3?Math.round(n*100):Math.round(n)}
function setGoal(goal){knowledgeState.goal=goal}
function calculateMetrics(){
 const weight=Number($('#kWeight').value),height=Number($('#kHeight').value),age=Number($('#kAge').value);
 const sex=$('#kSex').value,activity=$('#kActivity').value,goal=$('#kGoal').value,target=Number($('#kTarget').value);
 if(!(weight>=20&&weight<=400&&height>=100&&height<=250&&age>=18&&age<=100)){toast('Informe peso, altura e idade válidos (18+).');return}
 knowledgeState.sex=sex;knowledgeState.activity=activity;knowledgeState.goal=goal;knowledgeState.target=target;
 const factor={sedentary:1.2,light:1.375,moderate:1.55,active:1.725}[activity];
 // Formula de Mifflin-St Jeor; sem referencia sexo-especifica, fornecer intervalo.
 const base=10*weight+6.25*height-5*age;
 const fem=Math.round((base-161)*factor),male=Math.round((base+5)*factor);
 const cal=sex==='female'?fem:sex==='male'?male:null;
 const hydration=[Math.round(weight*30),Math.round(weight*35)];
 const km=(height/100)**2,imc=(weight/km).toFixed(1);
 const targetValid=target>=20&&target<=400&&((goal==='gain'&&target>weight)||(goal==='lose'&&target<weight));
 const diff=targetValid?Math.abs(target-weight):0;
 const weeks=targetValid ? `${Math.ceil(diff/(weight*.005))}–${Math.ceil(diff/(weight*.0025))} semanas` : '—';
 const energy=cal==null?`${fem.toLocaleString('pt-BR')}–${male.toLocaleString('pt-BR')}`:cal.toLocaleString('pt-BR');
 const extra=goal==='maintain'?'Manutenção':goal==='gain'?'Ganho de peso':'Perda de peso';
 const marker=Math.max(0,Math.min(100,(Number(imc)-10)/35*100));
 $('#metricResults').innerHTML=`<section class="metrics-dashboard"><div class="section-title"><div><span class="step-label">02 / SUAS REFERÊNCIAS</span><h3>Um olhar sobre você.</h3></div><span class="estimate-tag">Estimativas</span></div>
 <div class="metric-grid">
  <article class="metric-tile visual-metric"><div class="metric-top"><span>Hidratação</span>${metricIllustration('water')}</div><b>${(hydration[0]/1000).toLocaleString('pt-BR')}–${(hydration[1]/1000).toLocaleString('pt-BR')} <em>L</em></b><small>Referência diária de líquidos</small><div class="metric-divider"></div><p>${hydration[0].toLocaleString('pt-BR')}–${hydration[1].toLocaleString('pt-BR')} mL por dia. Ajustes dependem do seu contexto.</p></article>
  <article class="metric-tile visual-metric"><div class="metric-top"><span>Energia de manutenção</span>${metricIllustration('energy')}</div><b>${energy}</b><small>kcal / dia · estimativa</small><div class="metric-divider"></div><p>${sex==='unspecified'?'Intervalo entre as duas referências da equação.':'Referência da equação selecionada.'} Não é uma prescrição alimentar.</p></article>
  <article class="metric-tile visual-metric"><div class="metric-top"><span>Índice de massa corporal</span>${metricIllustration('body')}</div><b>${Number(imc).toLocaleString('pt-BR')}</b><small>Relação entre peso e altura</small><div class="imc-scale" aria-hidden="true"><i style="--marker:${marker}%"></i></div><div class="scale-labels" aria-hidden="true"><span>10</span><span>27,5</span><span>45</span></div><p>Escala visual de 10 a 45, com extremos limitados. Não distingue músculo de gordura.</p></article>
  <article class="metric-tile visual-metric"><div class="metric-top"><span>Diferença até o objetivo</span>${metricIllustration('goal')}</div><b>${targetValid?diff.toLocaleString('pt-BR',{maximumFractionDigits:1})+' <em>kg</em>':'—'}</b><small>${extra}</small>${targetValid?`<div class="weight-route"><span>Agora<strong>${weight.toLocaleString('pt-BR')} kg</strong></span><i aria-hidden="true">→</i><span>Objetivo<strong>${target.toLocaleString('pt-BR')} kg</strong></span></div><p>Distância ao valor informado, não progresso já realizado.</p>`:'<div class="metric-divider"></div><p>Escolha ganhar ou perder peso e informe um peso desejado coerente para visualizar a diferença.</p>'}</article>
 </div>
 <aside class="metric-context"><strong>Referências, não regras.</strong><p>${targetValid?'Projeção meramente matemática a uma taxa de 0,25–0,5% do peso por semana: '+weeks+'. Não é previsão individual.':'Os resultados usam os valores informados nesta calculadora.'}</p><p>Não definimos automaticamente déficit ou superávit calórico. Treino, alimentação e saúde precisam ser considerados com acompanhamento profissional.</p></aside></section>`;
 $('#metricResults').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
window.switchTab = switchTab;
window.openRoutine = openRoutine;
window.closeRoutine = closeRoutine;
window.startWorkout = startWorkout;
window.cancelWorkout = cancelWorkout;
window.setRegisterMode = setRegisterMode;
window.switchRegisterMode = switchRegisterMode;
window.updateSet = updateSet;
window.toggleSet = toggleSet;
window.addSetRow = addSetRow;
window.completeExercise = completeExercise;
window.finishWorkout = finishWorkout;
window.changeHistoryExercise = changeHistoryExercise;
window.moveMonth = moveMonth;
window.openProfileSheet = openProfileSheet;
window.saveProfile = saveProfile;
window.openRoutineSheet = openRoutineSheet;
window.openEditRoutineSheet = openEditRoutineSheet;
window.saveEditedRoutine = saveEditedRoutine;
window.saveRoutine = saveRoutine;
window.openExerciseSheet = openExerciseSheet;
window.saveExercise = saveExercise;
window.deleteSession = deleteSession;
window.deleteRoutine = deleteRoutine;
window.exportData = exportData;
window.openImportFile = openImportFile;
window.importData = importData;
window.closeSheet = closeSheet;
window.setFrequencyView = setFrequencyView;
window.openPhotoPicker = openPhotoPicker;
window.receivePhoto = receivePhoto;
window.calculateMetrics = calculateMetrics;
window.setGoal = setGoal;

render();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
