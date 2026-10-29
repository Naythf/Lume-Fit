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
  calendarRef: new Date(),
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
  out.profile.social=normalizeSocialProfile(out.profile.social);
  out.profile.trainingPreferences=normalizeTrainingPreferences(out.profile.trainingPreferences);
  out.profile.visibility='private';
  out.profile.onboardingComplete=out.profile.onboardingComplete===true;
  out.profile.bio=String(out.profile.bio||'').slice(0,160);
  out.profile.frequencyGoals=normalizeFrequencyGoals(out.profile.frequencyGoals);
  out.routines = out.routines.map(r => ({
    id: r.id || uid(),
    name: r.name || 'Treino',
    icon: r.icon || suggestTrainingIcon(r.name),
    iconImage: safeIconImage(r.iconImage),
    weekday: Number.isInteger(r.weekday) && r.weekday>=0 && r.weekday<=6 ? r.weekday : null,
    exercises: Array.isArray(r.exercises) ? r.exercises.map(e => ({
      id: e.id || uid(),
      name: e.name || 'Exercício',
      sets: clamp(Number(e.sets)||3, 1, 12),
      minReps: clamp(Number(e.minReps)||8, 1, 99),
      maxReps: clamp(Number(e.maxReps)||12, 1, 99),
      icon: e.icon || suggestTrainingIcon(e.name),
      iconImage: safeIconImage(e.iconImage),
      ...normalizeMuscleFields(e),
      ...catalogFields(e)
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
  if (window.LumeAuth) return window.LumeAuth.persist(state.db);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db));
  return true;
}

function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.style.display = 'none', 2200);
}

function switchTab(tab){
  if(tab==='history'){window.FrequencyExperience.go('history');return;}
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
  return activitySessions(state.db.sessions).filter(s=>{const d=activityDate(s.date);return d.getMonth()===date.getMonth()&&d.getFullYear()===date.getFullYear();});
}

function frequencyPct(){
  const stats=weeklyConsistency(state.db.sessions,state.db.profile.frequencyGoals);
  return stats.target?Math.min(100,Math.round(stats.count/stats.target*100)):null;
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
  renderFrequency();
  renderSettings();
  renderKnowledge();
  renderProfile();
}

function weeklyActivityCard(){
 const now=new Date(),monday=activityMonday(now),key=activityKey;
 const hits=activityDays(state.db.sessions,monday,activityAddDays(monday,6),now);
 const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d;});
 const count=days.filter(d=>hits.has(key(d))).length;
 return `<section class="week-card" aria-label="Atividade desta semana"><div class="week-heading"><h3>Seu ritmo nesta semana</h3><small>${count} ${count===1?'dia ativo':'dias ativos'}</small></div><div class="week-days">${days.map((d,i)=>`<div class="week-day ${hits.has(key(d))?'hit':''} ${key(d)===key(now)?'today':''}" aria-label="${['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'][i]}, dia ${d.getDate()}${hits.has(key(d))?', treino registrado':''}${key(d)===key(now)?', hoje':''}"><span>${['SEG','TER','QUA','QUI','SEX','SÁB','DOM'][i]}</span><b>${d.getDate()}</b></div>`).join('')}</div><p class="week-note">${count?'Cada registro conta a sua história. Confira seus registros e evolução em Frequência.':'Sua semana começa com um registro. Organize suas rotinas e treine no seu ritmo.'} Dias de descanso também fazem parte do planejamento.</p></section>`;
}

function recentWorkoutVisual(session){const routine=state.db.routines.find(r=>r.id===session.routineId);return trainingVisual(routine||{name:session.name,icon:session.icon,iconImage:session.iconImage});}

function renderHome(){
  const root = $('#screen-home');
  const profile = state.db.profile;
  const total = getMonthSessions(new Date()).length;
  const freq = frequencyPct();
  const vol = state.db.sessions.reduce((s, session) => s + volumeOfSession(session), 0);
  const recent = activitySessions(state.db.sessions).slice().sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,2);
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>${new Date().getHours()<12 ? "Bom dia" : new Date().getHours()<18 ? "Boa tarde" : "Boa noite"},<br>${esc(firstName(profile.name))}.</h1>
        <p>${capitalize(fmtDate(new Date()))}</p>
      </div>
      <button class="icon-btn" onclick="switchTab('frequency')">${calendarIcon()}</button>
    </div>
    ${GuidedWorkout.banner()}
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
        <div class="stat-value">${freq===null?'—':freq+'%'}</div>
        <div class="stat-label">Meta da semana</div>
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
          <div class="ico recent-workout-icon" aria-hidden="true">${recentWorkoutVisual(s)}</div>
          <div>
            <strong>${esc(s.name)}</strong>
            <small>${shortDate(s.date)} • ${(s.entries||[]).length} ${(s.entries||[]).length===1?'exercício':'exercícios'}</small>
          </div>
          <div class="push">›</div>
        </div>`).join('') : `<div class="empty">Sua evolução começa aqui.<br>Conclua seu primeiro treino para acompanhar os resultados.</div>`}
    </div>`;
}

function renderWorkouts(){
 const root=$('#screen-workouts');
 const selected=state.db.routines.find(r=>r.id===state.selectedRoutineId);
 if(!selected){
  state.selectedRoutineId=null;
  root.innerHTML=`<div class="page-head"><div><h2>Seus treinos</h2><p>Seu plano, organizado do seu jeito.</p></div><button class="primary-btn compact" onclick="openRoutineSheet()">＋ Nova rotina</button></div>
  ${GuidedWorkout.banner()}
  ${automaticRoutineEntry()}
  ${!state.db.routines.length?`<section class="routine-empty"><div class="routine-empty-art">${trainingGraphic('dumbbell')}</div><h3>Comece pelo seu próximo treino.</h3><p>Dê um nome à rotina, escolha o dia e adicione seus exercícios. Os ícones ajudam a reconhecer cada movimento.</p><button class="primary-btn" onclick="openRoutineSheet()">Criar minha primeira rotina</button></section>`:`<div class="routine-summary"><span>${state.db.routines.length} ${state.db.routines.length===1?'rotina':'rotinas'}</span><span>${state.db.routines.reduce((n,r)=>n+r.exercises.length,0)} ${state.db.routines.reduce((n,r)=>n+r.exercises.length,0)===1?'exercício':'exercícios'} no seu plano</span></div><div class="routine-list">${state.db.routines.map(r=>`<article class="routine-plan ${r.weekday===new Date().getDay()?'scheduled-today':''}"><div class="routine-plan-head"><div class="routine-art">${trainingVisual(r)}</div><div class="routine-plan-title"><span class="routine-day">${r.weekday===new Date().getDay()?'Hoje · ':''}${dayLabel(r)}</span><h3>${esc(r.name)}</h3><p>${r.exercises.length} ${r.exercises.length===1?'exercício':'exercícios'}${r.exercises.length?' · '+r.exercises.reduce((n,e)=>n+e.sets,0)+' séries':''}</p></div><button class="icon-btn" aria-label="Editar rotina ${esc(r.name)}" onclick="openEditRoutineSheet('${r.id}')">${editTrainingIcon()}</button></div><div class="routine-preview">${r.exercises.length?r.exercises.slice(0,3).map(e=>`<span>${esc(e.name)}</span>`).join('')+(r.exercises.length>3?`<span>＋${r.exercises.length-3}</span>`:''):'<span>Adicione os movimentos que fazem parte do seu treino.</span>'}</div><div class="routine-plan-actions"><button class="secondary-btn" onclick="openRoutine('${r.id}')">${r.exercises.length?'Ver exercícios':'Adicionar exercícios'}</button><button class="primary-btn" ${r.exercises.length?'':'disabled'} onclick="startWorkout('${r.id}')">Iniciar treino</button></div></article>`).join('')}</div>`}`;
  return;
 }
 const routine=selected;
 root.innerHTML=`<div class="routine-toolbar"><button class="ghost-btn" onclick="closeRoutine()">‹ Todas as rotinas</button><button class="ghost-btn" onclick="openEditRoutineSheet('${routine.id}')">Editar rotina</button></div><div class="routine-detail-heading"><div class="routine-art">${trainingVisual(routine)}</div><div><span class="routine-day">${dayLabel(routine)}</span><h2>${esc(routine.name)}</h2><p>${routine.exercises.length} ${routine.exercises.length===1?'exercício':'exercícios'} · ${routine.exercises.reduce((n,e)=>n+e.sets,0)} séries planejadas</p></div></div><div class="section-title"><h3>Seus movimentos</h3><button class="ghost-btn" onclick="openExerciseSheet('${routine.id}')">＋ Adicionar</button></div><p class="hint">Toque em um exercício para começar por ele. Use o lápis para editar o nome, as séries ou o ícone.</p><div class="exercise-plan-list">${routine.exercises.length?routine.exercises.map((e,i)=>`<article class="exercise-plan"><span class="exercise-order">${i+1}</span><button class="exercise-open" onclick="startWorkout('${routine.id}','${e.id}')"><div class="exercise-thumb">${trainingVisual(e)}</div><div><strong>${esc(e.name)}</strong><small>${e.sets} séries · ${e.minReps}–${e.maxReps} repetições</small>${muscleBadges(e)}</div></button><button class="muscle-link" onclick="openMuscleDetails('${routine.id}','${e.id}')" aria-label="Ver músculos de ${esc(e.name)}">Músculos</button><button class="icon-btn" aria-label="Editar exercício ${esc(e.name)}" onclick="openExerciseSheet('${routine.id}','${e.id}')">${editTrainingIcon()}</button></article>`).join(''):`<div class="empty"><strong>A rotina está criada.</strong><p>Agora adicione seu primeiro exercício e escolha o ícone que combina com ele.</p><button class="secondary-btn" onclick="openExerciseSheet('${routine.id}')">＋ Adicionar exercício</button></div>`}</div><div class="routine-detail-actions"><button class="primary-btn" ${routine.exercises.length?'':'disabled'} onclick="startWorkout('${routine.id}')">Iniciar treino</button><button class="ghost-btn" onclick="deleteRoutine('${routine.id}')">Excluir rotina</button></div>`;
}
function editTrainingIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 5 5 5M4 20l5-1L21 7l-4-4L5 15Z"/></svg>';}

function renderRegister(){ window.GuidedWorkout.render(); }

function renderSettings(){
  const root = $('#screen-settings');
  const p = state.db.profile;
  const expanded = [...root.querySelectorAll('details[open][data-setting]')].map(el=>el.dataset.setting);
  root.innerHTML = `
    <div class="page-head"><div><h2>Ajustes</h2></div></div>
    <button class="secondary-btn" style="margin-bottom:20px" onclick="switchTab('profile')">Meu perfil</button>
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
    <div class="settings-groups">
      <details class="settings-group" data-setting="preferences" ${expanded.includes('preferences')?'open':''}>
        <summary><span class="settings-group-icon" aria-hidden="true">${gearIcon()}</span><span><strong>Preferências</strong><small>Animações e movimento do aplicativo</small></span></summary>
        <div class="settings-group-content">${motionPreferenceCard()}</div>
      </details>
      <details class="settings-group" data-setting="backup" ${expanded.includes('backup')?'open':''}>
        <summary><span class="settings-group-icon" aria-hidden="true">${downloadIcon()}</span><span><strong>Backup e restauração</strong><small>Salve uma cópia ou restaure seus dados</small></span></summary>
        <div class="settings-group-content"><p class="hint">Guarde uma cópia dos seus treinos, histórico e perfil em um arquivo JSON.</p><div class="backup-actions"><button type="button" class="secondary-btn" onclick="exportData()">Exportar backup</button><button type="button" class="secondary-btn" onclick="openImportFile()">Restaurar backup</button></div><p class="hint">Ao restaurar, os dados atuais serão substituídos. Você poderá confirmar antes da importação.</p></div>
      </details>
    </div>
    <input id="photoFile" class="hidden" type="file" accept="image/*" onchange="receivePhoto(this)">
    <input id="importFile" class="hidden" type="file" accept="application/json,.json" onchange="importData(this)">`;
}

function openRoutine(id){
  state.selectedRoutineId = id;
  switchTab('workouts');
}
function closeRoutine(){ state.selectedRoutineId = null; render(); }

function startWorkout(routineId,exerciseId=null){ return GuidedWorkout.start(routineId,exerciseId); }
function cancelWorkout(){ return GuidedWorkout.discard(); }
function setRegisterMode(mode){state.registerMode=mode;renderRegister();}
function switchRegisterMode(){state.registerMode=state.registerMode==='history'?'details':'history';renderRegister();}
function updateSet(index,key,value){ GuidedWorkout.update(index,key,value); }
function toggleSet(index){ GuidedWorkout.toggle(index); }
function addSetRow(){ GuidedWorkout.add(); }
function completeExercise(){ GuidedWorkout.next(); }
function finishWorkout(){ return GuidedWorkout.finish(); }

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
  // An active session owns a snapshot and may be finished after routine deletion.
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

function openProfileSheet(){
  const p = state.db.profile;
  openSheet(`
    <h3>Editar perfil</h3>
    <form class="form" onsubmit="saveProfile(event)">
      <div class="field"><label for="profileName">Nome</label><input id="profileName" name="name" value="${esc(p.name)}" required></div>
      <div class="field"><label for="profileAge">Idade</label><input id="profileAge" name="age" type="number" min="1" value="${p.age}"></div>
      <div class="field"><label for="profileWeight">Peso (kg)</label><input id="profileWeight" name="weight" type="number" min="1" step="0.1" value="${p.weight}"></div>
      <div class="field"><label for="profileHeight">Altura</label><input id="profileHeight" name="height" value="${esc(p.height)}"></div>
      <div class="row-actions"><button type="button" class="ghost-btn" onclick="closeSheet()">Cancelar</button><button type="submit" class="primary-btn">Salvar</button></div>
    </form>`);
}

function saveProfile(ev){
  ev.preventDefault();
  const f = new FormData(ev.target);
  state.db.profile = {
    ...state.db.profile,
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
  resetTrainingDraft(null);
  openSheet(`
    <h3>Monte sua rotina</h3><p class="editor-intro">Comece pelo nome e pelo dia. Depois, adicione os exercícios na ordem que você treina.</p>
    <form class="form" onsubmit="saveRoutine(event)">
      <div class="field"><label>Nome da rotina</label><input name="name" maxlength="80" placeholder="Ex.: Peito, ombro e tríceps" oninput="updateTrainingPreview()" required></div>
      ${dayPicker(null)}
      ${iconPicker()}
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
  if(trainingDraft.busy)return;
  const routine = { id: uid(), name, weekday, ...chosenTrainingFields(name), exercises: [] };
  state.db.routines.push(routine);
  saveDB();
  closeSheet();
  state.selectedRoutineId = routine.id;
  switchTab('workouts');
  toast('Rotina criada. Adicione seu primeiro exercício.');
}

function openEditRoutineSheet(id){
  const routine=state.db.routines.find(r=>r.id===id);
  if(!routine) return;
  resetTrainingDraft(routine);
  openSheet(`<h3>Editar rotina</h3>
    <form class="form" onsubmit="saveEditedRoutine(event,'${routine.id}')">
      <div class="field"><label>Nome da rotina</label><input name="name" maxlength="80" value="${esc(routine.name)}" oninput="updateTrainingPreview()" required></div>
      ${dayPicker(routine.weekday)}
      ${iconPicker()}
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
  if(trainingDraft.busy)return;
  routine.name=name;
  Object.assign(routine,chosenTrainingFields(name));
  const rawDay=String(f.get('weekday')??'');
  routine.weekday=rawDay===''?null:Number(rawDay);
  saveDB();closeSheet();render();toast('Rotina atualizada.');
}

function openExerciseSheet(routineId = state.selectedRoutineId,exerciseId=null){
 if(!state.db.routines.length){toast('Crie uma rotina primeiro.');openRoutineSheet();return;}
 const routine=state.db.routines.find(r=>r.id===routineId)||state.db.routines[0];
 const item=exerciseId?routine.exercises.find(e=>e.id===exerciseId):null;
 if(exerciseId&&!item)return;
 resetTrainingDraft(item);
 const list=state.db.routines.map(r=>`<option value="${r.id}" ${r.id===routine.id?'selected':''}>${esc(r.name)}</option>`).join('');
 openSheet(`<h3>${item?'Editar exercício':'Adicione um movimento'}</h3><p class="editor-intro">Defina as séries e repetições planejadas. As cargas serão registradas durante o treino.</p><form class="form training-form" onsubmit="saveExercise(event)"><input type="hidden" name="exerciseId" value="${item?.id||''}"><div class="field"><label>Rotina</label><select name="routineId" ${item?'disabled':''}>${list}</select></div><div class="field"><label>Nome do exercício</label><input name="name" maxlength="100" placeholder="Ex.: Supino reto" oninput="updateTrainingPreview()" value="${esc(item?.name||'')}" required></div><div class="training-numbers"><div class="field"><label>Séries</label><input name="sets" type="number" min="1" max="12" value="${item?.sets||3}" required></div><div class="field"><label>Reps mín.</label><input name="minReps" type="number" min="1" max="99" value="${item?.minReps||8}" required></div><div class="field"><label>Reps máx.</label><input name="maxReps" type="number" min="1" max="99" value="${item?.maxReps||12}" required></div></div>${muscleEditor(item)}${iconPicker()}<div class="row-actions editor-actions"><button type="button" class="ghost-btn" onclick="closeSheet()">Cancelar</button><button type="submit" class="primary-btn">${item?'Salvar mudanças':'Adicionar exercício'}</button></div></form>`);
 updateTrainingPreview();
 updateMuscleEditor();
}
function saveExercise(ev){
 ev.preventDefault();if(trainingDraft.busy)return;
 const form=ev.target,f=new FormData(form);
 const routine=state.db.routines.find(r=>r.id===form.elements.routineId.value);if(!routine)return;
 const name=String(f.get('name')||'').trim();if(!name)return toast('Digite o nome do exercício.');
 const sets=Number(f.get('sets')),minReps=Number(f.get('minReps')),maxReps=Number(f.get('maxReps'));
 if(!Number.isInteger(sets)||sets<1||sets>12||!Number.isInteger(minReps)||minReps<1||minReps>99||!Number.isInteger(maxReps)||maxReps<1||maxReps>99)return toast('Confira as séries e repetições.');
 if(minReps>maxReps)return toast('As repetições mínimas não podem superar as máximas.');
 const id=String(f.get('exerciseId')||'');const item=id?routine.exercises.find(e=>e.id===id):null;if(id&&!item)return;
 const values={name,sets,minReps,maxReps,...chosenTrainingFields(name),...readMuscleEditor(form)};
 if(item)Object.assign(item,values);else routine.exercises.push({id:uid(),...values});
 saveDB();closeSheet();state.selectedRoutineId=routine.id;switchTab('workouts');toast(item?'Exercício atualizado.':'Exercício adicionado.');
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
    GuidedWorkout.clearDraft();
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
  $('#sheet .sheet-panel').scrollTop=0;
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
 $('#metricResults').scrollIntoView({behavior:(window.LumeMotionPreference||window.matchMedia('(prefers-reduced-motion: reduce)')).matches?'auto':'smooth',block:'start'});
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
window.openPhotoPicker = openPhotoPicker;
window.receivePhoto = receivePhoto;
window.calculateMetrics = calculateMetrics;
window.setGoal = setGoal;

render();
if ('serviceWorker' in navigator && !location.hostname.endsWith('.chatgpt.site')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{}));
}
