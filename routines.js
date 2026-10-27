/* Local icon artwork and routine editor helpers. No remote uploads. */
const TRAINING_ICONS = [
 ['dumbbell','Halter'],['bench','Supino'],['press','Desenvolvimento'],['raise','Elevação lateral'],['pull','Puxada'],['row','Remada'],['curl','Rosca'],['triceps','Tríceps'],['cable','Polia'],['squat','Agachamento'],['legpress','Leg press'],['deadlift','Levantamento terra'],['legs','Pernas'],['calf','Panturrilha'],['core','Abdominal'],['plank','Prancha'],['run','Corrida'],['bike','Bicicleta'],['stretch','Alongamento'],['kettlebell','Kettlebell']
];
function suggestTrainingIcon(name){
 const n=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const rules=[[/leg\s*press/,'legpress'],[/supino|bench|peitoral|peito|crucifixo/,'bench'],[/remada|row/,'row'],[/puxada|barra fixa|costas|pulldown/,'pull'],[/triceps|frances|testa/,'triceps'],[/rosca|biceps/,'curl'],[/agacha|squat|afundo|passada/,'squat'],[/terra|stiff|deadlift/,'deadlift'],[/panturr|gemeos/,'calf'],[/prancha|plank/,'plank'],[/abdomin|core/,'core'],[/corrida|esteira|caminhada/,'run'],[/bicic|bike|ciclismo/,'bike'],[/along|mobilidade|stretch/,'stretch'],[/kettlebell/,'kettlebell'],[/desenvolvimento|ombro/,'press'],[/elevacao lateral|elevacao frontal/,'raise'],[/polia|crossover/,'cable'],[/perna|extensora|flexora|gluteo/,'legs']];
 return rules.find(([rx])=>rx.test(n))?.[1]||'dumbbell';
}
function safeIconImage(value){return typeof value==='string'&&value.length<=65000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)?value:'';}
function trainingGraphic(kind){
 const shapes={
 row:'<path d="M18 74h46l25-9 31 13M30 30v44M30 42h25l20 15 25-13M100 44l26-8M21 22h18"/><circle cx="62" cy="28" r="8"/>',
 triceps:'<circle cx="80" cy="20" r="8"/><path d="M80 29v35M80 40l-20 5-5-21M80 40l20 5 5-21M46 21h18M96 21h18M80 64 63 83M80 64l17 19"/>',
 squat:'<circle cx="79" cy="18" r="8"/><path d="M79 26 68 47l26 14-26 21M68 47 50 59l-8 23M42 82h18M68 82h16M38 33h83M44 23v20M116 23v20M68 34l-13 5M85 33l15 7"/>',
 legpress:'<path d="M25 20v55h44M38 58l26-9 18 12 29-31M64 49l15-14 24 8M99 21l24 24M18 82h114M40 76v6M116 74l23-55"/><circle cx="38" cy="43" r="8"/>',
 deadlift:'<circle cx="60" cy="20" r="8"/><path d="m62 28 28 20-9 18 22 17M90 48l18 18-5 17M69 32l-8 33M86 43l-7 22M35 68h87M42 58v20M114 58v20M76 83h13M101 83h15"/>',
 calf:'<circle cx="80" cy="17" r="8"/><path d="M80 25v30M80 36l-22 9M80 36l22 9M80 55l-11 23 10-3M80 55l13 23 10-3M58 84h50M47 84v-8h14"/>',
 core:'<circle cx="46" cy="32" r="8"/><path d="m52 39 30 21 22-25 28 27M62 47l-17 7M74 57l-18 7M20 75h120M18 81h124"/>',
 plank:'<circle cx="30" cy="41" r="8"/><path d="m39 45 58 7 30 18M45 46l-10 22H19M97 52l15 18h20M17 78h124"/>',
 run:'<circle cx="88" cy="18" r="8"/><path d="m84 28-16 23 21 12-15 20M68 51 47 67l-22-2M76 38l-24 1-13-12M83 33l17 19 22-4"/>',
 bike:'<circle cx="40" cy="65" r="20"/><circle cx="121" cy="65" r="20"/><path d="m40 65 23-32 22 32H40m23-32h43l-21 32m36 0-15-42h-11M55 28h18"/>',
 stretch:'<circle cx="78" cy="18" r="8"/><path d="m78 27-6 27-31 27M72 54l35 27M73 38 39 24M74 38l32-20M35 19l7 11M105 14l5 10M34 82h14M104 82h14"/>',
 kettlebell:'<path d="M64 35c-14-28 47-28 32 0M65 34C45 40 43 79 67 82h26c24-3 22-42 2-48Z"/>'
 };
 return shapes[kind]?`<svg viewBox="0 0 160 90" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[kind]}</svg>`:machineArt(kind);
}
function trainingVisual(item){const image=safeIconImage(item?.iconImage);return image?`<img class="custom-training-icon" src="${image}" alt="" width="128" height="128" loading="lazy" decoding="async">`:trainingGraphic(item?.icon||suggestTrainingIcon(item?.name));}
let trainingDraft={icon:'auto',image:'',busy:false};
function resetTrainingDraft(item){trainingDraft={icon:item?.icon||'auto',image:safeIconImage(item?.iconImage),busy:false};}
function iconPicker(){return `<fieldset class="training-picker"><legend>Escolha um ícone</legend><p class="hint">Use a sugestão pelo nome, escolha uma ilustração ou envie sua imagem.</p><input type="hidden" name="icon" value="${esc(trainingDraft.icon)}"><div class="icon-selection"><div id="trainingIconPreview" class="icon-live-preview">${trainingVisual({icon:trainingDraft.icon==='auto'?'dumbbell':trainingDraft.icon,iconImage:trainingDraft.image})}</div><div><strong id="trainingIconLabel">${trainingDraft.image?'Imagem própria':trainingDraft.icon==='auto'?'Sugestão pelo nome':TRAINING_ICONS.find(x=>x[0]===trainingDraft.icon)?.[1]||'Ícone'}</strong><small>Sua escolha aparece na rotina e durante o treino.</small></div></div><div class="icon-choices"><button type="button" data-icon="auto" aria-pressed="${trainingDraft.icon==='auto'&&!trainingDraft.image}" onclick="chooseTrainingIcon('auto')"><span class="auto-symbol">✦</span><span>Automático</span></button>${TRAINING_ICONS.map(([id,label])=>`<button type="button" data-icon="${id}" aria-pressed="${trainingDraft.icon===id&&!trainingDraft.image}" onclick="chooseTrainingIcon('${id}')">${trainingGraphic(id)}<span>${label}</span></button>`).join('')}</div><div class="icon-upload"><button type="button" class="secondary-btn" onclick="document.getElementById('trainingIconFile').click()">Enviar imagem própria</button><input id="trainingIconFile" hidden type="file" accept="image/jpeg,image/png,image/webp" onchange="receiveTrainingIcon(this)"><button type="button" class="ghost-btn" onclick="chooseTrainingIcon('auto')">Usar automático</button></div><p class="hint" id="trainingIconStatus" role="status">JPG, PNG ou WebP até 5 MB. A imagem será reduzida para 128 × 128 px.</p></fieldset>`;}
function updateTrainingPreview(){
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
