/* Local icon artwork and routine editor helpers. No remote uploads. */
const TRAINING_ICONS = [
 ['dumbbell','Halter'],['bench','Supino'],['press','Desenvolvimento'],['raise','Elevação lateral'],['pull','Puxada'],['row','Remada'],['curl','Rosca'],['triceps','Tríceps'],['cable','Polia'],['squat','Agachamento'],['legpress','Leg press'],['deadlift','Levantamento terra'],['legs','Pernas'],['calf','Panturrilha'],['core','Abdominal'],['plank','Prancha'],['run','Corrida'],['bike','Bicicleta'],['stretch','Alongamento'],['kettlebell','Kettlebell']
];
function suggestTrainingIcon(name){
 const n=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const rules=[[/leg\s*press/,'legpress'],[/supino|bench|peitoral|peito|crucifixo/,'bench'],[/remada|row/,'row'],[/puxada|barra fixa|costas|pulldown/,'pull'],[/triceps|frances|testa/,'triceps'],[/rosca|biceps/,'curl'],[/agacha|squat|afundo|passada/,'squat'],[/terra|stiff|deadlift/,'deadlift'],[/panturr|gemeos/,'calf'],[/prancha|plank/,'plank'],[/abdomin|core/,'core'],[/corrida|esteira|caminhada/,'run'],[/bicic|bike|ciclismo/,'bike'],[/along|mobilidade|stretch/,'stretch'],[/kettlebell/,'kettlebell'],[/elevacao lateral|elevacao frontal/,'raise'],[/desenvolvimento|ombro/,'press'],[/polia|crossover/,'cable'],[/perna|extensora|flexora|gluteo/,'legs']];
 return rules.find(([rx])=>rx.test(n))?.[1]||'dumbbell';
}
function safeIconImage(value){return typeof value==='string'&&value.length<=65000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)?value:'';}
function trainingGraphic(kind){
 // One silhouette language: solid heads, connected limbs, lighter equipment.
 const head=(x,y)=>`<circle cx="${x}" cy="${y}" r="6" fill="currentColor" stroke="none"/>`;
 const body=d=>`<path d="${d}" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
 const gear=d=>`<path d="${d}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
 const dumbbell=(x,y)=>`<g transform="translate(${x} ${y})" stroke="currentColor" stroke-width="3" fill="none"><path d="M-10 0h20M-7-7V7M7-7V7M-11-4v8M11-4v8"/></g>`;
 const bar=(y)=>gear(`M35 ${y}h90M42 ${y-9}v18M48 ${y-12}v24M112 ${y-12}v24M118 ${y-9}v18`);
 const standing=head(80,16)+body('M80 28v26M80 54 68 78M80 54l12 24');
 const shapes={
  dumbbell:bar(45),
  bench:head(52,47)+body('M65 51h31M96 51l13 22h15M73 50V28')+gear('M40 60h63M47 60v18M94 60v18')+bar(21),
  press:head(80,27)+body('M80 39v24M80 42 59 37V20M80 42l21-5V20M80 63 65 78M80 63l15 15')+gear('M66 66h28M80 66v15')+dumbbell(59,14)+dumbbell(101,14),
  raise:standing+body('M80 33H48M80 33h32')+dumbbell(38,33)+dumbbell(122,33),
  pull:head(80,34)+body('M80 46v20M80 48 59 38V24M80 48l21-10V24M80 66H60l-4 13M80 66h20l4 13')+gear('M32 79V10h96v69M80 10v11M55 24h50M65 70h30'),
  row:head(69,28)+body('M70 40 74 57H57l-5 18M70 43l24 5 20-2')+gear('M43 65h37M49 65v14M83 79h48M126 15v64M126 20h-12v19M114 46h12M32 79h32'),
  curl:standing+body('M80 34 59 49 48 36M80 34l21 15 11-13')+dumbbell(45,29)+dumbbell(115,29),
  triceps:head(71,23)+body('M72 35v22M72 39l20 8 7 13M72 57 62 79M72 57l15 22')+gear('M118 79V11H99v12M99 23v28M91 61l8-10 9 10M108 70h19M108 75h19'),
  cable:gear('M33 79V11h94v68M42 20h14v42H42zM104 20h14v42h-14zM49 20v-4h62v4M61 16l9 29M99 16l-9 29M64 48l7-6 6 7M83 49l6-7 7 6M24 79h40M96 79h40'),
  squat:head(77,20)+body('M77 32 66 48 91 61 79 79M66 48 47 60 52 79M77 33H61M77 33h20')+bar(30)+gear('M46 81h13M73 81h15'),
  legpress:head(49,38)+body('M53 50 69 66 87 54 105 33M69 66l27-2 16-26')+gear('M35 39l18 33h30M48 75h36M48 75v7M79 75v7M91 19l31 27M97 81l35-63M108 81l35-63M31 83h111'),
  deadlift:head(65,22)+body('M69 33 92 48 78 62 88 79M92 48l14 14-5 17M74 36 65 65M86 44l-6 21')+bar(69),
  legs:gear('M53 15h54M56 15v22l14 17-4 24M104 15v22L90 54l4 24M80 26v18M70 54l10-10 10 10M59 80h13M88 80h13'),
  calf:gear('M68 12v31l-8 22 3 11h17l23-12M80 12v33l-7 17 7 3M61 80h27v-9h24M87 80h25')+gear('M101 33v17M96 38l5-5 5 5'),
  core:head(55,34)+body('M62 44 83 62l20-23 20 23M69 50 61 25M61 25l-7 5')+gear('M31 78h103M35 82h95'),
  plank:head(41,40)+body('M53 46 100 52l26 22M60 47 51 69H36')+gear('M29 80h105'),
  run:head(91,15)+body('M85 27 72 48 93 61 79 79M72 48 55 65H34M81 32 62 30 52 42M83 30l17 15h18'),
  bike:gear('M48 77h68M61 77l18-24M79 53l23 24M79 53l-5-18M64 35h21M94 23h19M102 23 90 54M87 59l-15 8M87 59l14-8')+'<circle cx="87" cy="59" r="15" fill="none" stroke="currentColor" stroke-width="3"/>',
  stretch:head(78,26)+body('M78 38v21M78 59 60 79M78 59l28 20M78 40 59 25l17-13M78 40l19 4 11-13'),
  kettlebell:gear('M65 35V24c0-14 30-14 30 0v11')+'<path d="M65 35h30c18 11 21 42 2 45H63c-19-3-16-34 2-45Z" fill="currentColor" stroke="none"/>'
 };
 const drawing=Object.prototype.hasOwnProperty.call(shapes,kind)?shapes[kind]:shapes.dumbbell;
 return `<svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">${drawing}</svg>`;
}
function trainingVisual(item){const image=safeIconImage(item?.iconImage);return image?`<img class="custom-training-icon" src="${image}" alt="" width="128" height="128" loading="lazy" decoding="async">`:trainingGraphic(item?.icon||suggestTrainingIcon(item?.name));}
let trainingDraft={icon:'auto',image:'',busy:false};
function resetTrainingDraft(item){trainingDraft={icon:item?.icon||'auto',image:safeIconImage(item?.iconImage),busy:false};}
function iconPicker(){return `<fieldset class="training-picker"><legend>Escolha um ícone</legend><p class="hint">Use a sugestão pelo nome, escolha uma ilustração ou envie sua imagem.</p><input type="hidden" name="icon" value="${esc(trainingDraft.icon)}"><div class="icon-selection"><div id="trainingIconPreview" class="icon-live-preview">${trainingVisual({icon:trainingDraft.icon==='auto'?'dumbbell':trainingDraft.icon,iconImage:trainingDraft.image})}</div><div><strong id="trainingIconLabel">${trainingDraft.image?'Imagem própria':trainingDraft.icon==='auto'?'Sugestão pelo nome':TRAINING_ICONS.find(x=>x[0]===trainingDraft.icon)?.[1]||'Ícone'}</strong><small>Sua escolha aparece na rotina e durante o treino.</small></div></div><div class="icon-choices"><button type="button" data-icon="auto" aria-pressed="${trainingDraft.icon==='auto'&&!trainingDraft.image}" onclick="chooseTrainingIcon('auto')"><span class="auto-symbol">✦</span><span>Automático</span></button>${TRAINING_ICONS.map(([id,label])=>`<button type="button" data-icon="${id}" aria-pressed="${trainingDraft.icon===id&&!trainingDraft.image}" onclick="chooseTrainingIcon('${id}')">${trainingGraphic(id)}<span>${label}</span></button>`).join('')}</div><div class="icon-upload"><button type="button" class="secondary-btn" onclick="document.getElementById('trainingIconFile').click()">Enviar imagem própria</button><input id="trainingIconFile" hidden type="file" accept="image/jpeg,image/png,image/webp" onchange="receiveTrainingIcon(this)"><button type="button" class="ghost-btn" onclick="chooseTrainingIcon('auto')">Usar automático</button></div><p class="hint" id="trainingIconStatus" role="status">JPG, PNG ou WebP até 5 MB. A imagem será reduzida para 128 × 128 px.</p></fieldset>`;}
function updateTrainingPreview(){
 if(typeof updateMuscleEditor==='function')updateMuscleEditor();
 const form=document.querySelector('#sheet form');if(!form)return;
 const icon=trainingDraft.icon==='auto'?suggestTrainingIcon(form.elements.name.value):trainingDraft.icon;
 form.elements.icon.value=trainingDraft.icon;
 document.getElementById('trainingIconPreview').innerHTML=trainingVisual({icon,iconImage:trainingDraft.image});
 document.getElementById('trainingIconLabel').textContent=trainingDraft.image?'Imagem própria':(trainingDraft.icon==='auto'?'Sugerido: ':'')+(TRAINING_ICONS.find(x=>x[0]===icon)?.[1]||'Halter');
 form.querySelectorAll('[data-icon]').forEach(b=>b.setAttribute('aria-pressed',String(!trainingDraft.image&&b.dataset.icon===trainingDraft.icon)));
}
function chooseTrainingIcon(icon){if(trainingDraft.busy)return;if(icon!=='auto'&&!TRAINING_ICONS.some(x=>x[0]===icon))return;trainingDraft.icon=icon;trainingDraft.image='';updateTrainingPreview();}
async function receiveTrainingIcon(input){
 const file=input.files?.[0];if(!file)return;
 const status=document.getElementById('trainingIconStatus');const form=input.closest('form');const draft=trainingDraft;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){status.textContent='Escolha JPG, PNG ou WebP de até 5 MB.';input.value='';return;}
 draft.busy=true;form.querySelector('[type=submit]').disabled=true;status.textContent='Preparando sua imagem…';
 try{
  const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#141414';ctx.fillRect(0,0,128,128);const scale=Math.min(128/bitmap.width,128/bitmap.height);const w=bitmap.width*scale,h=bitmap.height*scale;ctx.drawImage(bitmap,(128-w)/2,(128-h)/2,w,h);bitmap.close();
  if(trainingDraft!==draft||!form.isConnected||!document.getElementById('sheet').classList.contains('active'))return;
  draft.image=canvas.toDataURL('image/jpeg',.8);status.textContent='Imagem pronta. Salve para aplicar.';updateTrainingPreview();
 }catch{if(status.isConnected)status.textContent='Não foi possível abrir a imagem. Escolha outro arquivo.';}
 finally{draft.busy=false;if(form.isConnected)form.querySelector('[type=submit]').disabled=false;input.value='';}
}
function chosenTrainingFields(name){return {icon:trainingDraft.icon==='auto'?suggestTrainingIcon(name):trainingDraft.icon,iconImage:safeIconImage(trainingDraft.image)};}
function dayPicker(value){return `<fieldset class="day-picker"><legend>Quando você quer treinar?</legend><div class="day-options">${[[null,'Livre'],[1,'Seg'],[2,'Ter'],[3,'Qua'],[4,'Qui'],[5,'Sex'],[6,'Sáb'],[0,'Dom']].map(([n,label])=>`<label><input type="radio" name="weekday" value="${n===null?'':n}" ${value===n?'checked':''}><span>${label}</span></label>`).join('')}</div><p class="hint">O dia destaca sua rotina no início. Você pode mudar depois.</p></fieldset>`;}
