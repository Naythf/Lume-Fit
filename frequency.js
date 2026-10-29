/* Calendar arithmetic uses local dates; ISO timestamps remain unchanged in storage. */
function activityDate(value){
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)){const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d,12);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;}
 if(value==null||value==='')return null;const date=new Date(value);return Number.isFinite(date.getTime())?date:null;
}
function activityKey(value){const d=activityDate(value);return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:'';}
function activityMonday(value){const d=activityDate(value);if(!d)return null;return new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7),12);}
function activityAddDays(date,n){return new Date(date.getFullYear(),date.getMonth(),date.getDate()+n,12);}
function normalizeFrequencyGoals(value){
 const goals=new Map();if(!Array.isArray(value))return [];
 for(const item of value){const date=activityDate(item?.week);if(!date||activityKey(date)!==item.week||date.getDay()!==1||date.getFullYear()<2000||date.getFullYear()>2100||!Number.isInteger(item.days)||item.days<1||item.days>7)continue;goals.set(item.week,{week:item.week,days:item.days});}
 return [...goals.values()].sort((a,b)=>a.week.localeCompare(b.week));
}
function frequencyTargetFromNormalized(goals,key){for(let i=goals.length-1;i>=0;i--)if(goals[i].week<=key)return goals[i].days;return 0;}
function activityTarget(goals,date){return frequencyTargetFromNormalized(normalizeFrequencyGoals(goals),activityKey(activityMonday(date)));}
function activitySessions(sessions,now=new Date()){
 const today=activityKey(now);return (Array.isArray(sessions)?sessions:[]).filter(s=>{const key=activityKey(s?.date);return key&&key<=today;});
}
function activityDays(sessions,start,end,now=new Date()){
 const lo=activityKey(start),hi=activityKey(end);return new Set(activitySessions(sessions,now).map(s=>activityKey(s.date)).filter(k=>k>=lo&&k<=hi));
}
function weeklyConsistency(sessions,goals,now=new Date()){
 const policies=normalizeFrequencyGoals(goals),monday=activityMonday(now),currentKey=activityKey(monday),hits=new Set(activitySessions(sessions,now).map(s=>activityKey(s.date)));
 let run=0,best=0,current=0;const weeks=[];
 if(policies.length&&policies[0].week<=currentKey){for(let week=activityDate(policies[0].week);week<=monday;week=activityAddDays(week,7)){
   const key=activityKey(week),target=frequencyTargetFromNormalized(policies,key);let count=0;for(let d=0;d<7;d++)if(hits.has(activityKey(activityAddDays(week,d))))count++;
   const met=target>0&&count>=target,open=key===currentKey;
   if(met){run++;best=Math.max(best,run);}else if(!open)run=0;
   weeks.push({week:key,target,count,met,open});
  }current=run;}
 const count=[...hits].filter(k=>k>=currentKey&&k<=activityKey(activityAddDays(monday,6))).length;
 return {current,best,count,target:activityTarget(policies,monday),met:activityTarget(policies,monday)>0&&count>=activityTarget(policies,monday),weeks};
}
function nextFrequencyGoal(goals,days,now=new Date()){
 if(!Number.isInteger(days)||days<1||days>7)return null;
 const current=normalizeFrequencyGoals(goals),monday=activityMonday(now),week=activityKey(activityAddDays(monday,activityTarget(current,monday)?7:0));
 if(activityTarget(current,monday)===days)return current.filter(g=>g.week!==week);
 return normalizeFrequencyGoals([...current.filter(g=>g.week!==week),{week,days}]);
}
function activityMonthSummary(sessions,ref,now=new Date()){
 const first=new Date(ref.getFullYear(),ref.getMonth(),1,12),last=new Date(ref.getFullYear(),ref.getMonth()+1,0,12);
 const current=now.getFullYear()===ref.getFullYear()&&now.getMonth()===ref.getMonth();
 const previousFirst=new Date(ref.getFullYear(),ref.getMonth()-1,1,12),previousLast=new Date(ref.getFullYear(),ref.getMonth(),0,12);
 const cutoff=current?Math.min(now.getDate(),previousLast.getDate()):previousLast.getDate();
 const actual=activitySessions(sessions,now).filter(s=>{const k=activityKey(s.date);return k>=activityKey(first)&&k<=activityKey(last);});
 const prior=activityDays(sessions,previousFirst,new Date(previousFirst.getFullYear(),previousFirst.getMonth(),cutoff,12),now).size;
 return {days:new Set(actual.map(s=>activityKey(s.date))).size,sessions:actual.length,prior,comparable:activityKey(first)<=activityKey(now),partial:current,cutoff};
}
function activitySetValues(sets){return (Array.isArray(sets)?sets:[]).filter(s=>Number.isFinite(Number(s.kg))&&Number(s.kg)>=0&&s.kg!==''&&Number.isFinite(Number(s.reps))&&Number(s.reps)>0);}
function historyExerciseKey(entry){return entry.exerciseId?'id:'+entry.exerciseId:'legacy:'+String(entry.name||'Exercício sem nome');}
function activityExerciseOptions(routines,sessions){
 const map=new Map();
 for(const routine of routines||[])for(const e of routine.exercises||[])map.set('id:'+e.id,{key:'id:'+e.id,name:e.name,label:e.name+' · '+routine.name});
 for(const session of activitySessions(sessions))for(const e of session.entries||[]){const key=historyExerciseKey(e);if(!map.has(key))map.set(key,{key,name:e.name||'Exercício sem nome',label:(e.name||'Exercício sem nome')+' · histórico'});}
 return [...map.values()];
}
function activityExercisePoints(sessions,key,now=new Date()){
 return activitySessions(sessions,now).slice().sort((a,b)=>activityDate(a.date)-activityDate(b.date)).flatMap(s=>{
  const sets=(s.entries||[]).filter(e=>historyExerciseKey(e)===key).flatMap(e=>activitySetValues(e.sets));
  if(!sets.length)return [];
  return [{date:s.date,load:Math.max(...sets.map(x=>Number(x.kg))),reps:sets.reduce((n,x)=>n+Number(x.reps),0),volume:sets.reduce((n,x)=>n+Number(x.kg)*Number(x.reps),0),sets:sets.length}];
 });
}
const FREQUENCY_METRICS={load:{label:'Carga máxima',unit:'kg'},reps:{label:'Repetições totais',unit:'reps'},volume:{label:'Volume registrado',unit:'kg × reps'}};
function activityLineChart(points,metric){
 if(!points.length)return '<div class="empty">Conclua um treino com este exercício para começar o gráfico.</div>';
 const info=FREQUENCY_METRICS[metric]||FREQUENCY_METRICS.load,data=points.slice(-12),max=Math.max(1,...data.map(p=>p[metric]||0));
 const x=i=>data.length===1?180:40+i*290/(data.length-1),y=v=>152-v/max*118;
 const labels=data.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p[metric])}" r="4" fill="#fff"><title>${esc(shortDate(p.date))}: ${p[metric].toLocaleString('pt-BR')} ${info.unit}</title></circle>${i===0||i===data.length-1?`<text x="${x(i)}" y="180" text-anchor="middle" fill="#bbb" font-size="11">${esc(shortDate(p.date))}</text>`:''}`).join('');
 return `<svg viewBox="0 0 370 195" role="img" aria-label="${info.label}: ${data.length} ${data.length===1?'registro':'registros'}. Valores disponíveis na tabela abaixo."><line x1="40" x2="335" y1="152" y2="152" stroke="#555"/><text x="5" y="156" fill="#aaa" font-size="10">0</text><text x="5" y="27" fill="#aaa" font-size="10">${max.toLocaleString('pt-BR',{maximumFractionDigits:1})}</text>${data.length>1?`<path class="frequency-line" d="${data.map((p,i)=>`${i?'L':'M'}${x(i)} ${y(p[metric])}`).join(' ')}" fill="none" stroke="#eee" stroke-width="2"/>`:''}${labels}</svg>`;
}
function activityFrequencySeries(sessions,view,now=new Date()){
 const monday=activityMonday(now);
 return Array.from({length:view==='month'?6:8},(_,i)=>{
  const start=view==='month'?new Date(now.getFullYear(),now.getMonth()-5+i,1,12):activityAddDays(monday,(i-7)*7);
  const end=view==='month'?new Date(start.getFullYear(),start.getMonth()+1,0,12):activityAddDays(start,6);
  return {label:view==='month'?start.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''):start.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),name:view==='month'?start.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'Semana de '+start.toLocaleDateString('pt-BR'),count:activityDays(sessions,start,end,now).size};
 });
}
window.FrequencyExperience=(()=>{
 let section='calendar',selected=activityKey(new Date()),exerciseKey='',metric='load',limit=20,trendView='week';
 const number=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:1});
 function reset(){section='calendar';selected=activityKey(new Date());exerciseKey='';metric='load';limit=20;trendView='week';state.calendarRef=new Date();}
 function go(view){section=['calendar','history','progress'].includes(view)?view:'calendar';switchTab('frequency');}
 function view(value){section=value;renderFrequency();requestAnimationFrame(()=>document.querySelector(`[data-frequency-section="${value}"]`)?.focus({preventScroll:true}));}
 function changeMetric(value){if(!Object.hasOwn(FREQUENCY_METRICS,value))return;metric=value;renderFrequency();document.getElementById('frequencyMetric')?.focus();}
 function changeExercise(value){exerciseKey=value;renderFrequency();document.getElementById('frequencyExercise')?.focus();}
 function goalEditor(){
  const goals=normalizeFrequencyGoals(state.db.profile.frequencyGoals),stats=weeklyConsistency(state.db.sessions,goals),monday=activityMonday(new Date()),pending=goals.find(g=>g.week>activityKey(monday));
  const suggested=pending?.days||stats.target||normalizeTrainingPreferences(state.db.profile.trainingPreferences).days.length||3;
  openSheet(`<h3>Sua meta de constância</h3><p class="editor-intro">Quantos dias ativos cabem na sua semana? Dois treinos no mesmo dia contam como um dia.</p><form class="form" onsubmit="FrequencyExperience.saveGoal(event)"><div class="field"><label for="frequencyGoal">Dias ativos por semana</label><select id="frequencyGoal" name="days">${Array.from({length:7},(_,i)=>i+1).map(n=>`<option value="${n}" ${n===suggested?'selected':''}>${n} ${n===1?'dia':'dias'}</option>`).join('')}</select></div><p class="hint">${stats.target?'A alteração vale a partir da próxima segunda-feira. As semanas anteriores mantêm suas metas.':'A primeira meta começa nesta semana. Não cria conquistas em semanas anteriores.'} Os outros dias não precisam de registro de descanso.</p><div class="row-actions"><button type="button" class="ghost-btn" onclick="closeSheet()">Cancelar</button><button type="submit" class="primary-btn">Salvar meta</button></div></form>`);
 }
 function saveGoal(event){event.preventDefault();const days=Number(event.target.elements.days.value),policies=nextFrequencyGoal(state.db.profile.frequencyGoals,days);if(!policies)return toast('Escolha de 1 a 7 dias.');state.db.profile.frequencyGoals=policies;saveDB();closeSheet();render();toast('Meta salva. Confira quando ela começa em Frequência.');}
 function month(delta){const ref=state.calendarRef;state.calendarRef=new Date(ref.getFullYear(),ref.getMonth()+delta,1,12);selected=activityKey(state.calendarRef);renderFrequency();document.getElementById(delta<0?'previousActivityMonth':'nextActivityMonth')?.focus();}
 function today(){state.calendarRef=new Date();selected=activityKey(new Date());renderFrequency();document.querySelector(`[data-activity-date="${selected}"]`)?.focus();}
 function selectDay(key){if(!activityDate(key))return;selected=key;renderFrequency();document.querySelector(`[data-activity-date="${key}"]`)?.focus({preventScroll:true});}
 function calendarKey(event,key){const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];if(!delta)return;event.preventDefault();const d=activityAddDays(activityDate(key),delta);state.calendarRef=new Date(d.getFullYear(),d.getMonth(),1,12);selectDay(activityKey(d));}
 function sessionMarkup(session,expanded=false){
  return `<details class="activity-session" ${expanded?'open':''}><summary><span><strong>${esc(session.name||'Treino')}</strong><small>${esc(shortDate(session.date))} · ${(session.entries||[]).length} ${(session.entries||[]).length===1?'exercício':'exercícios'}</small></span><span class="activity-chevron" aria-hidden="true">⌄</span></summary><div class="activity-session-body">${(session.entries||[]).map(e=>`<div class="activity-entry"><strong>${esc(e.name||'Exercício')}</strong><p>${activitySetValues(e.sets).map(s=>`${number(s.kg)} kg × ${number(s.reps)}`).join(' · ')||'Sem séries válidas registradas.'}</p></div>`).join('')||'<p class="hint">Este registro antigo não contém detalhes dos exercícios.</p>'}<button class="ghost-btn" onclick="FrequencyExperience.deleteRecord(${state.db.sessions.indexOf(session)})">Excluir registro</button></div></details>`;
 }
 function calendarMarkup(now){
  const ref=state.calendarRef,first=new Date(ref.getFullYear(),ref.getMonth(),1,12),total=new Date(ref.getFullYear(),ref.getMonth()+1,0,12).getDate(),start=(first.getDay()+6)%7;
  const hits=new Set(activitySessions(state.db.sessions,now).map(s=>activityKey(s.date))),scheduled=state.db.routines.filter(r=>Number.isInteger(r.weekday)),todayKey=activityKey(now);
  let cells=Array.from({length:start},()=>'<span aria-hidden="true"></span>').join('');
  for(let n=1;n<=total;n++){const d=new Date(ref.getFullYear(),ref.getMonth(),n,12),key=activityKey(d),planned=key>=todayKey&&scheduled.some(r=>r.weekday===d.getDay()),rest=key>=todayKey&&scheduled.length&&!planned,hit=hits.has(key);
   cells+=`<button type="button" data-activity-date="${key}" class="activity-day ${hit?'recorded':planned?'planned':rest?'rest':''} ${key===todayKey?'is-today':''}" aria-pressed="${selected===key}" ${key===todayKey?'aria-current="date"':''} aria-label="${esc(d.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}))}, ${hit?'treino registrado':planned?'treino planejado':rest?'descanso no plano atual':'sem registro'}${key===todayKey?', hoje':''}" onclick="FrequencyExperience.selectDay('${key}')" onkeydown="FrequencyExperience.calendarKey(event,'${key}')">${n}<i aria-hidden="true"></i></button>`;
  }
  const date=activityDate(selected)||now,key=activityKey(date),sessions=activitySessions(state.db.sessions,now).filter(s=>activityKey(s.date)===key),plans=key>=todayKey?scheduled.filter(r=>r.weekday===date.getDay()):[];
  return `<div class="activity-calendar-layout"><section class="activity-calendar"><div class="activity-calendar-head"><button id="previousActivityMonth" class="ghost-btn" aria-label="Mês anterior" onclick="FrequencyExperience.month(-1)">‹</button><h3>${esc(ref.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}))}</h3><button id="nextActivityMonth" class="ghost-btn" aria-label="Próximo mês" onclick="FrequencyExperience.month(1)">›</button></div><button class="activity-today" onclick="FrequencyExperience.today()">Ir para hoje</button><div class="activity-weekdays" aria-hidden="true">${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=>`<span>${d}</span>`).join('')}</div><div class="activity-grid" aria-label="Dias do mês">${cells}</div><div class="activity-calendar-legend"><span><i class="recorded"></i>Registrado</span><span><i class="planned"></i>Planejado</span><span><i class="rest"></i>Descanso</span></div><p class="hint">Planejamento usa as rotinas atuais e aparece de hoje em diante. Dias anteriores sem treino ficam sem registro.</p></section><section class="activity-day-detail" aria-label="Detalhes do dia selecionado"><h3>${esc(date.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}))}</h3>${sessions.length?sessions.map(s=>sessionMarkup(s,true)).join(''):`<div class="activity-day-empty">${key>todayKey?'Os treinos concluídos aparecerão aqui.':key===todayKey?'Nenhum treino registrado hoje.':'Nenhum treino registrado neste dia.'}</div>`}${plans.length?`<h4>No seu planejamento</h4>${plans.map(r=>`<button class="activity-planned-routine" onclick="FrequencyExperience.openPlan(${state.db.routines.indexOf(r)})"><span>${esc(r.name)}<small>${r.exercises.length} exercícios</small></span><span aria-hidden="true">›</span></button>`).join('')}`:key>=todayKey?`<p class="hint">${scheduled.length?'Dia de descanso no planejamento atual.':'Defina os dias das rotinas para visualizar seu planejamento.'}</p>`:''}</section></div>`;
 }
 function trendsMarkup(){
  const bars=activityFrequencySeries(state.db.sessions,trendView),max=Math.max(1,...bars.map(b=>b.count));
  return `<section class="activity-trends"><div class="activity-trend-head"><h3>Seu ritmo ao longo do tempo</h3><div role="group" aria-label="Período do gráfico"><button data-trend="week" aria-pressed="${trendView==='week'}" onclick="FrequencyExperience.trend('week')">8 semanas</button><button data-trend="month" aria-pressed="${trendView==='month'}" onclick="FrequencyExperience.trend('month')">6 meses</button></div></div><ol class="activity-bars" style="--bars:${bars.length}" aria-label="Dias ativos por período">${bars.map(b=>`<li aria-label="${esc(b.name)}: ${b.count} ${b.count===1?'dia ativo':'dias ativos'}"><strong aria-hidden="true">${b.count}</strong><div class="activity-bar-track" aria-hidden="true"><span style="height:${b.count/max*100}%"></span></div><small aria-hidden="true">${esc(b.label)}</small></li>`).join('')}</ol><p class="hint">Dias ativos, sem somar duas vezes os treinos do mesmo dia. A semana atual e o mês atual ainda estão em andamento.</p></section>`;
 }
 function historyMarkup(){
  const sessions=activitySessions(state.db.sessions).slice().sort((a,b)=>activityDate(b.date)-activityDate(a.date));
  return `<section class="activity-history"><div class="section-title"><h3>Seu histórico</h3><span class="hint">${sessions.length} ${sessions.length===1?'treino registrado':'treinos registrados'}</span></div>${sessions.length?sessions.slice(0,limit).map(s=>sessionMarkup(s)).join(''):'<div class="empty">Seu histórico começa com o primeiro treino concluído.</div>'}${sessions.length>limit?'<button class="secondary-btn" onclick="FrequencyExperience.more()">Carregar mais registros</button>':''}</section>`;
 }
 function progressMarkup(){
  const options=activityExerciseOptions(state.db.routines,state.db.sessions);if(!options.length)return '<div class="empty">Crie uma rotina e conclua um treino para acompanhar sua evolução por exercício.</div>';
  let chosen=options.find(e=>e.key===exerciseKey)||options.find(e=>activityExercisePoints(state.db.sessions,e.key).length)||options[0];exerciseKey=chosen.key;
  const points=activityExercisePoints(state.db.sessions,exerciseKey),last=points.at(-1),first=points[0],info=FREQUENCY_METRICS[metric];
  const change=points.length>1?last[metric]-first[metric]:null;
  return `<section class="activity-progress"><div class="activity-progress-controls"><div class="field"><label for="frequencyExercise">Exercício</label><select id="frequencyExercise" onchange="FrequencyExperience.changeExercise(this.value)">${options.map(e=>`<option value="${esc(e.key)}" ${chosen.key===e.key?'selected':''}>${esc(e.label)}</option>`).join('')}</select></div><div class="field"><label for="frequencyMetric">O que acompanhar</label><select id="frequencyMetric" onchange="FrequencyExperience.changeMetric(this.value)">${Object.entries(FREQUENCY_METRICS).map(([k,v])=>`<option value="${k}" ${metric===k?'selected':''}>${v.label}</option>`).join('')}</select></div></div><h3>${esc(chosen.name)}</h3>${last?`<div class="activity-latest"><div><span>Última carga máxima</span><strong>${number(last.load)} <small>kg</small></strong></div><div><span>Repetições no treino</span><strong>${number(last.reps)}</strong></div><div><span>Volume no treino</span><strong>${number(last.volume)} <small>kg × reps</small></strong></div></div>`:''}<div class="activity-chart">${activityLineChart(points,metric)}</div>${points.length?`<p class="hint">${change===null?'Mais um registro permitirá comparar os treinos.':`Variação entre primeiro e último registro: ${change>0?'+':''}${number(change)} ${info.unit}.`} O gráfico mostra até 12 registros recentes. Cargas diferentes, execução e número de séries mudam a comparação.</p><details class="activity-values"><summary>Ver valores registrados · ${points.length} ${points.length===1?'treino':'treinos'}</summary><div class="activity-table-scroll"><table><caption>Registros de ${esc(chosen.name)}</caption><thead><tr><th scope="col">Data</th><th scope="col">Carga máx.</th><th scope="col">Reps</th><th scope="col">Volume</th></tr></thead><tbody>${points.slice().reverse().map(p=>`<tr><td>${esc(activityDate(p.date).toLocaleDateString('pt-BR'))}</td><td>${number(p.load)} kg</td><td>${number(p.reps)}</td><td>${number(p.volume)}</td></tr>`).join('')}</tbody></table></div></details>`:''}<p class="activity-explanation">Volume = carga registrada × repetições, somadas no treino. Em exercícios com peso corporal, 0 kg representa ausência de carga adicional; não mede o esforço total. Não compare volumes entre exercícios diferentes.</p></section>`;
 }
 function render(){
  const root=document.getElementById('screen-frequency');if(!root)return;
  const now=new Date(),goals=normalizeFrequencyGoals(state.db.profile.frequencyGoals),stats=weeklyConsistency(state.db.sessions,goals,now),pending=goals.find(g=>g.week>activityKey(activityMonday(now))),monthly=activityMonthSummary(state.db.sessions,state.calendarRef,now),weekStart=activityMonday(now);
  const previousStart=activityAddDays(weekStart,-7),elapsed=(now.getDay()+6)%7,previousCount=activityDays(state.db.sessions,previousStart,activityAddDays(previousStart,elapsed),now).size;
  const monthName=state.calendarRef.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  root.innerHTML=`<div class="page-head"><div><h2>Frequência</h2><p>Seu ritmo, seus registros, sua evolução.</p></div><button class="ghost-btn" onclick="FrequencyExperience.goalEditor()">${stats.target?'Ajustar meta':'Definir meta'}</button></div><section class="constancy-card"><div class="constancy-main"><div class="constancy-symbol" aria-hidden="true">${constancySymbol()}</div><div><h3>${stats.current?`${stats.current} ${stats.current===1?'semana de constância':'semanas de constância'}`:'Construa seu ritmo.'}</h3><p>${!stats.target?'Defina uma meta de dias ativos para começar sua sequência.':stats.met?'Meta da semana cumprida. Seu descanso também faz parte do plano.':`${stats.count} de ${stats.target} dias ativos nesta semana. Você tem até domingo para completar sua meta.`}</p></div></div><div class="constancy-progress"><span>Esta semana</span><strong>${stats.target?stats.count+' / '+stats.target:'Sem meta definida'}</strong>${stats.target?`<progress max="${stats.target}" value="${Math.min(stats.count,stats.target)}" aria-label="Dias ativos nesta semana"></progress>`:''}<small>Melhor sequência: ${stats.best} ${stats.best===1?'semana':'semanas'}</small></div>${pending?`<p class="constancy-pending">Próxima meta: ${pending.days} dias por semana, a partir de ${esc(activityDate(pending.week).toLocaleDateString('pt-BR'))}.</p>`:''}<details class="constancy-rules"><summary>Como a sequência funciona</summary><p>Uma semana vai de segunda a domingo. Ao atingir sua meta de dias ativos, ela soma uma semana à sequência. Descanso não exige registro; vários treinos no mesmo dia contam como um dia. A semana atual em andamento não quebra a sequência anterior. Uma semana encerrada abaixo da meta reinicia a contagem. A primeira meta começa na semana em que você a define; alterações valem na próxima semana.</p></details></section><div class="activity-summary"><section><h3>Semana atual</h3><strong>${stats.count} <small>${stats.count===1?'dia ativo':'dias ativos'}</small></strong><p>${previousCount} até o mesmo dia da semana anterior.</p></section><section><h3>${esc(monthName)}</h3><strong>${monthly.days} <small>${monthly.days===1?'dia ativo':'dias ativos'}</small></strong><p>${monthly.sessions} ${monthly.sessions===1?'treino concluído':'treinos concluídos'}. ${monthly.comparable?`${monthly.prior} dias ativos ${monthly.partial?'até dia '+monthly.cutoff+' do':'no'} mês anterior.`:''}</p></section></div><div class="activity-sections" role="group" aria-label="Seções de frequência">${[['calendar','Calendário'],['history','Histórico'],['progress','Evolução']].map(([k,label])=>`<button data-frequency-section="${k}" aria-pressed="${section===k}" onclick="FrequencyExperience.view('${k}')">${label}</button>`).join('')}</div><div class="activity-content">${section==='calendar'?calendarMarkup(now)+trendsMarkup():section==='history'?historyMarkup():progressMarkup()}</div>`;
 }
 return {render,go,view,reset,trend(value){trendView=value==='month'?'month':'week';renderFrequency();document.querySelector(`[data-trend="${trendView}"]`)?.focus({preventScroll:true});},goalEditor,saveGoal,month,today,selectDay,calendarKey,changeMetric,changeExercise,deleteRecord(index){const s=state.db.sessions[index];if(s)deleteSession(s.id);},openPlan(index){const r=state.db.routines[index];if(r)openRoutine(r.id);},more(){limit+=20;renderFrequency();}};
})();
function constancySymbol(){return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 28a15 15 0 1 0 6-16M9 12v10h10"/><path d="m18 26 5 5 10-13"/></svg>';}
function renderFrequency(){window.FrequencyExperience.render();}
