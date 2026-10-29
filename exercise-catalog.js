/* Explicit catalog for repeat-based routines. No name inference is used by the planner. */
const EXERCISE_CATALOG = (() => {
 const all=['gym','home','calisthenics'];
 const make=(id,name,primary,secondary,pattern,equipment,level=0,note='',modes=all)=>({id,name,primary,secondary,pattern,equipment,level,note,modes,measurement:'reps'});
 return [
 make('wall-push','Flexão na parede','chest',['triceps','shoulders'],'push',[],0,'Use uma parede firme; ajuste a distância para uma execução confortável.'),
 make('knee-push','Flexão com joelhos apoiados','chest',['triceps','shoulders'],'push',[],0,'Mantenha o tronco alinhado e controle a descida.'),
 make('pushup','Flexão de braços','chest',['triceps','shoulders'],'push',[],1,'Mantenha o corpo alinhado durante o movimento.'),
 make('close-push','Flexão com mãos próximas','triceps',['chest','shoulders'],'push',[],1,'Aproxime as mãos apenas até onde for confortável para os punhos.'),
 make('db-floor','Supino no chão com halteres','chest',['triceps','shoulders'],'push',['dumbbells'],0,'Use o chão como apoio; não é necessário banco.'),
 make('db-press','Desenvolvimento com halteres','shoulders',['triceps'],'push',['dumbbells'],0,'Evite compensar o movimento arqueando a lombar.'),
 make('db-raise','Elevação lateral com halteres','shoulders',[],'accessory',['dumbbells'],0,'Use amplitude confortável e movimento controlado.'),
 make('db-triceps','Extensão de tríceps com halter','triceps',[],'accessory',['dumbbells'],0,'Mantenha os cotovelos estáveis e escolha uma carga confortável.'),
 make('db-curl','Rosca com halteres','biceps',[],'accessory',['dumbbells'],0,'Evite balançar o tronco.'),
 make('db-row','Remada curvada com halteres','back',['biceps'],'pull',['dumbbells'],0,'Incline pelo quadril e mantenha a coluna estável.'),
 make('band-row','Remada com elástico','back',['biceps'],'pull',['bands'],0,'Confira a integridade do elástico e use um apoio de fixação adequado.'),
 make('band-curl','Rosca com elástico','biceps',[],'accessory',['bands'],0,'Mantenha o elástico estável e controle o retorno.'),
 make('band-raise','Elevação lateral com elástico','shoulders',[],'accessory',['bands'],0,'Controle a tensão e evite movimentos bruscos.'),
 make('band-triceps','Extensão de tríceps com elástico','triceps',[],'accessory',['bands'],0,'Use uma fixação segura e mantenha os cotovelos estáveis.'),
 make('pullup','Barra fixa pronada','back',['biceps'],'pull',['pullup'],1,'Use uma barra instalada com segurança e evite impulsos.'),
 make('chinup','Barra fixa supinada','back',['biceps'],'pull',['pullup'],1,'Controle o movimento e respeite a amplitude confortável.'),
 make('squat','Agachamento com peso corporal','quads',['glutes'],'knee',[],0,'Mantenha os pés estáveis e use amplitude confortável.'),
 make('reverse-lunge','Afundo reverso','quads',['glutes'],'knee',[],1,'Repetições por lado; use um apoio firme se precisar de equilíbrio.'),
 make('db-squat','Agachamento com halter','quads',['glutes'],'knee',['dumbbells'],0,'Segure o halter próximo ao tronco.'),
 make('db-rdl','Levantamento romeno com halteres','hamstrings',['glutes'],'hinge',['dumbbells'],1,'Leve o quadril para trás mantendo a coluna estável.'),
 make('bridge','Elevação de quadril no chão','glutes',['hamstrings'],'hinge',[],0,'Eleve o quadril sem hiperestender a lombar.'),
 make('heel-bridge','Ponte com apoio nos calcanhares','hamstrings',['glutes'],'hinge',[],0,'Apoie os calcanhares e eleve o quadril de forma controlada.'),
 make('calf','Elevação de panturrilhas em pé','calves',[],'accessory',[],0,'Use apoio firme para equilíbrio e controle a descida.'),
 make('db-calf','Elevação de panturrilhas com halteres','calves',[],'accessory',['dumbbells'],0,'Use uma carga que permita manter o equilíbrio.'),
 make('deadbug','Dead bug alternado','core',[],'core',[],0,'Repetições por lado; mantenha a lombar confortável junto ao chão.'),
 make('birddog','Bird dog alternado','core',['glutes'],'core',[],1,'Repetições por lado; evite girar o quadril.'),
 make('curlup','Abdominal curto','core',[],'core',[],0,'Eleve o tronco suavemente sem puxar o pescoço.'),
 make('prone-w','Elevação de braços em W deitado','back',['shoulders'],'pull',[],0,'Sem carga, com amplitude pequena e confortável. Alternativa de controle, não equivalente a uma remada com carga.'),
 make('machine-chest','Supino na máquina','chest',['triceps','shoulders'],'push',['machines'],0,'Ajuste banco e pegada antes de começar.',['gym']),
 make('machine-row','Remada na máquina','back',['biceps'],'pull',['machines'],0,'Ajuste os apoios para manter o tronco estável.',['gym']),
 make('pulldown','Puxada na polia','back',['biceps'],'pull',['machines'],0,'Puxe à frente do corpo, sem impulsos.',['gym']),
 make('cable-triceps','Tríceps na polia','triceps',[],'accessory',['machines'],0,'Mantenha os cotovelos próximos ao corpo.',['gym']),
 make('cable-curl','Rosca na polia','biceps',[],'accessory',['machines'],0,'Mantenha o tronco estável e controle o retorno.',['gym']),
 make('legpress','Leg press','quads',['glutes'],'knee',['machines'],0,'Ajuste o banco e respeite a amplitude confortável.',['gym']),
 make('legcurl','Flexão de joelhos na máquina','hamstrings',[],'hinge',['machines'],0,'Ajuste os apoios ao seu corpo e controle o retorno.',['gym']),
 make('legextension','Extensão de joelhos na máquina','quads',[],'accessory',['machines'],0,'Ajuste os apoios e evite movimentos bruscos.',['gym']),
 make('bar-row','Remada com barra','back',['biceps'],'pull',['barbell'],1,'Mantenha a coluna estável e controle a carga.',['gym','home']),
 make('bar-rdl','Levantamento romeno com barra','hamstrings',['glutes'],'hinge',['barbell'],1,'Leve o quadril para trás mantendo a barra próxima ao corpo.',['gym','home'])
 ];
})();
function catalogEligible(preferences,level='beginner'){
 const p=normalizeTrainingPreferences(preferences);
 return EXERCISE_CATALOG.filter(e=>e.modes.some(m=>p.modes.includes(m))&&e.equipment.every(k=>p.equipment.includes(k))&&e.level<=(level==='intermediate'?1:0));
}
function catalogExercise(id){return EXERCISE_CATALOG.find(e=>e.id===id);}
function catalogFields(exercise){const c=catalogExercise(exercise.catalogId);return {catalogId:c&&c.name===exercise.name?c.id:''};}
function plannedMinutes(exercises,goal){
 const rest=goal==='strength'?90:60;
 return Math.ceil(5+exercises.reduce((n,e)=>n+(Number(e.sets)||0)*(40+rest)+45,0)/60);
}
function buildAutomaticPlan(preferences,level='beginner'){
 const p=normalizeTrainingPreferences(preferences),pool=catalogEligible(p,level),days=p.days.slice().sort((a,b)=>(a+6)%7-(b+6)%7);
 if(!p.modes.length)return {error:'Escolha onde você quer treinar.'};
 if(!days.length||days.length>6)return {error:'Escolha de 1 a 6 dias para organizar a semana e reservar descanso.'};
 if(p.goal==='mobility')return {error:'Esta versão monta rotinas de fortalecimento. Para continuar, escolha outro objetivo; uma rotina de mobilidade precisa de exercícios e registros próprios.'};
 if(!pool.length)return {error:'Não encontramos exercícios com essa combinação. Revise a modalidade e os equipamentos.'};
 const sets=level==='intermediate'?3:2,rest=p.goal==='strength'?90:60;
 const slots=Math.max(1,Math.min(6,Math.floor((p.minutes-5)*60/(sets*(40+rest)+45))));
 const lower=['quads','hamstrings','glutes','calves'],used=new Map(),warnings=[];
 const routines=days.map((day,index)=>{
  const split=days.length>=4?(index%2===0?'upper':'lower'):'full';
  const candidates=pool.filter(e=>split==='full'||(split==='lower')===lower.includes(e.primary));
  const focus=p.focus.filter(k=>candidates.some(e=>e.primary===k));
  const patterns=split==='full'?['push','knee','pull','hinge','core']:split==='upper'?['push','pull','accessory','core']:['knee','hinge','accessory','core'];
  const order=patterns.slice(index%patterns.length).concat(patterns.slice(0,index%patterns.length));
  const chosen=[];
  function choose(list,reason){
   const available=list.filter(e=>!chosen.some(c=>c.catalogId===e.id)).sort((a,b)=>Number(p.focus.includes(b.primary))-Number(p.focus.includes(a.primary))||b.equipment.length-a.equipment.length||(used.get(a.id)||0)-(used.get(b.id)||0)||a.id.localeCompare(b.id));
   const e=available[0];if(!e)return;
   chosen.push({catalogId:e.id,name:e.name,sets,minReps:p.goal==='strength'?6:p.goal==='conditioning'?10:8,maxReps:p.goal==='strength'?10:p.goal==='conditioning'?15:12,reason});used.set(e.id,(used.get(e.id)||0)+1);
  }
  // Put a chosen priority first, then retain movement variety in the remaining slots.
  if(focus.length)choose(candidates.filter(e=>e.primary===focus[index%focus.length]),'Prioriza uma região que você escolheu.');
  for(const pattern of order){if(chosen.length>=slots)break;if(chosen.some(c=>catalogExercise(c.catalogId).pattern===pattern))continue;choose(candidates.filter(e=>e.pattern===pattern),'Acrescenta variedade de movimentos à sessão.');}
  while(chosen.length<slots){const before=chosen.length;choose(candidates,'Completa a sessão com os equipamentos disponíveis.');if(before===chosen.length)break;}
  return {name:split==='full'?'Corpo inteiro '+(index+1):split==='upper'?'Superiores '+(Math.floor(index/2)+1):'Inferiores '+(Math.floor(index/2)+1),weekday:day,exercises:chosen};
 });
 warnings.push(...automaticPlanWarnings(p,routines));
 if(routines.some(r=>r.exercises.length<slots))warnings.push('O catálogo é limitado para esta combinação. A sessão ficou menor para evitar repetir exercícios no mesmo dia.');
 return {preferences:p,level,routines,warnings};
}

function automaticPlanWarnings(preferences,routines){
 const p=normalizeTrainingPreferences(preferences),warnings=[];
 const covered=new Set(routines.flatMap(r=>r.exercises.flatMap(e=>{const c=catalogExercise(e.catalogId);return [c.primary,...c.secondary];})));
 for(const key of p.focus)if(!routines.some(r=>r.exercises.some(e=>catalogExercise(e.catalogId).primary===key)))warnings.push('O foco em '+MUSCLE_GROUPS[key]+' não teve exercício principal nesta combinação. Revise equipamentos, nível ou duração.');
 if(p.days.some(day=>p.days.includes((day+1)%7)))warnings.push('Há dias consecutivos, inclusive na virada da semana. Revise a recuperação dos músculos antes de repetir as sessões.');
 if(['chest','back','quads','hamstrings','core'].some(k=>!covered.has(k)))warnings.push('Esta combinação não cobre todos os grandes grupos na semana. Você pode ampliar o tempo, os dias ou ajustar os exercícios.');
 if(p.goal==='conditioning')warnings.push('Este rascunho cobre fortalecimento. Atividades aeróbicas precisam ser planejadas separadamente.');
 return warnings;
}
