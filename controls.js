/* Lume select-only comboboxes. Native values remain the form's source of truth. */
function lumeOptionSearch(options,query){
 const clean=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const terms=clean(query).split(/\s+/).filter(Boolean);
 return options.filter(option=>!option.hidden&&terms.every(term=>clean(option.label).includes(term)));
}
function lumeOptionStep(options,current,direction){
 const enabled=options.filter(o=>!o.disabled).map(o=>o.index);if(!enabled.length)return -1;
 const at=enabled.indexOf(current);return enabled[(at<0?(direction>0?0:enabled.length-1):(at+direction+enabled.length)%enabled.length)];
}
window.LumeControls=(()=>{
 const records=new WeakMap();let active=null,serial=0,scheduled=false;
 const chevron='<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const attr=(el,name,value)=>{const next=String(value);if(el.getAttribute(name)!==next)el.setAttribute(name,next);};
 function optionsOf(select){return [...select.options].map((o,index)=>({index,value:o.value,label:o.textContent.trim(),disabled:o.disabled||o.parentElement?.disabled===true,hidden:o.hidden||(o.parentElement?.tagName==='OPTGROUP'&&o.parentElement.hidden),group:o.parentElement?.tagName==='OPTGROUP'?o.parentElement.label:''}));}
 function sync(record){
  const {select,button,value,label}=record;if(!select.isConnected)return;
  const text=select.selectedOptions[0]?.textContent.trim()||'Escolher uma opção';if(value.textContent!==text)value.textContent=text;
  if(button.disabled!==select.disabled)button.disabled=select.disabled;attr(button,'aria-required',select.required);if(label?.id)attr(button,'aria-labelledby',label.id);
  if(active===record&&select.disabled)close(false);
 }
 function close(restore=true){
  const record=active;if(!record)return;active=null;
  attr(record.button,'aria-expanded',false);record.button.removeAttribute('aria-activedescendant');record.popup.inert=true;record.popup.setAttribute('aria-hidden','true');
  const hide=()=>{if(active===record)return;if(record.popup.hasAttribute('popover')&&typeof record.popup.hidePopover==='function'&&record.popup.matches(':popover-open'))record.popup.hidePopover();record.popup.hidden=true;};
  if(record.popup.isConnected&&record.popup.animate&&!(window.LumeMotionPreference||window.matchMedia('(prefers-reduced-motion: reduce)')).matches){
   const animation=record.popup.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-3px)'}],{duration:140,easing:'ease-out',fill:'both'});record.exitAnimation=animation;
   animation.onfinish=()=>{if(record.exitAnimation!==animation)return;record.exitAnimation=null;hide();animation.cancel();};
  }else hide();
  if(restore&&record.button.isConnected&&!record.button.disabled)record.button.focus({preventScroll:true});
 }
 function position(record){
  const rect=record.button.getBoundingClientRect(),viewport=window.visualViewport,vw=viewport?.width||window.innerWidth,vh=viewport?.height||window.innerHeight,offsetY=viewport?.offsetTop||0,offsetX=viewport?.offsetLeft||0;
  if(rect.bottom<offsetY||rect.top>vh+offsetY){close(false);return;}
  const below=vh+offsetY-rect.bottom-12,above=rect.top-offsetY-12,up=below<220&&above>below;
  const available=Math.max(96,Math.min(360,up?above:below));
  Object.assign(record.popup.style,{width:Math.min(Math.max(rect.width,280),vw-24)+'px',maxHeight:available+'px',left:Math.max(offsetX+12,Math.min(rect.left,offsetX+vw-Math.min(Math.max(rect.width,280),vw-24)-12))+'px',top:'0px'});
  const height=Math.min(record.popup.getBoundingClientRect().height,available);
  record.popup.style.top=Math.max(offsetY+8,up?rect.top-height-8:rect.bottom+8)+'px';
 }
 function focusOption(record,index){
  record.highlight=index;
  [...record.list.children].forEach(el=>{if(el.dataset.optionIndex!=null)el.classList.toggle('is-highlighted',Number(el.dataset.optionIndex)===index);});
  const option=record.list.querySelector(`[data-option-index="${index}"]`);
  const owner=document.activeElement===record.search?record.search:record.button;
  if(option){attr(owner,'aria-activedescendant',option.id);option.scrollIntoView({block:'nearest'});}else owner.removeAttribute('aria-activedescendant');
 }
 function drawOptions(record,query=''){
  record.filtered=lumeOptionSearch(optionsOf(record.select),query);record.list.replaceChildren();
  let lastGroup='';
  for(const option of record.filtered){
   if(option.group&&option.group!==lastGroup){const group=document.createElement('div');group.className='lume-option-group';group.setAttribute('role','presentation');group.textContent=option.group;record.list.append(group);lastGroup=option.group;}
   const row=document.createElement('div');row.id=record.id+'-option-'+option.index;row.className='lume-option';row.setAttribute('role','option');row.setAttribute('aria-selected',String(option.index===record.select.selectedIndex));row.setAttribute('aria-disabled',String(option.disabled));row.dataset.optionIndex=option.index;
   const text=document.createElement('span');text.textContent=option.label;row.append(text);
   if(option.index===record.select.selectedIndex){const check=document.createElement('span');check.className='lume-option-check';check.setAttribute('aria-hidden','true');check.textContent='✓';row.append(check);}
   row.addEventListener('pointermove',()=>{if(!option.disabled)focusOption(record,option.index);});
   row.addEventListener('pointerdown',event=>event.preventDefault());
   row.addEventListener('click',()=>{if(!option.disabled)choose(record,option.index);});record.list.append(row);
  }
  if(!record.filtered.length){const empty=document.createElement('div');empty.className='lume-option-empty';empty.setAttribute('role','presentation');empty.textContent='Nenhuma opção encontrada.';record.list.append(empty);}
  record.status.textContent=record.filtered.length+' opções disponíveis';
  const initial=record.filtered.find(o=>!o.disabled&&o.index===record.select.selectedIndex)||record.filtered.find(o=>!o.disabled);
  focusOption(record,initial?.index??-1);
 }
 function open(record,edge){
  if(record.select.disabled)return;if(active===record){close();return;}close(false);if(record.exitAnimation){record.exitAnimation.cancel();record.exitAnimation=null;}record.popup.inert=false;record.popup.removeAttribute('aria-hidden');active=record;
  sync(record);record.search.value='';record.search.hidden=record.select.options.length<8;record.popup.hidden=false;attr(record.button,'aria-expanded',true);
  record.popup.setAttribute('popover','manual');
  if(typeof record.popup.showPopover==='function'){try{record.popup.showPopover();}catch{record.popup.removeAttribute('popover');}}else record.popup.removeAttribute('popover');
  drawOptions(record);position(record);
  if(!record.search.hidden){record.search.focus({preventScroll:true});focusOption(record,record.highlight);}else record.button.focus({preventScroll:true});
  if(edge==='last'){const item=record.filtered.filter(o=>!o.disabled).at(-1);focusOption(record,item?.index??-1);}
 }
 function choose(record,index){
  const option=record.select.options[index];if(!option||option.disabled||option.parentElement?.disabled)return;
  const id=record.select.id,changed=record.select.selectedIndex!==index;record.select.selectedIndex=index;sync(record);close(false);
  if(changed){record.select.dispatchEvent(new Event('input',{bubbles:true}));record.select.dispatchEvent(new Event('change',{bubbles:true}));}
  enhance();requestAnimationFrame(()=>{const replacement=id?document.getElementById(id):null;const target=records.get(replacement)?.button||(record.button.isConnected?record.button:null);target?.focus({preventScroll:true});});
 }
 function keydown(record,event){
  if(active!==record){if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();open(record,event.key==='ArrowUp'?'last':undefined);}return;}
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
  if(event.key==='Tab'){
   if(document.activeElement===record.search){event.preventDefault();event.stopPropagation();const scope=record.button.closest('dialog[open],.sheet.active,.personalize-panel:not([hidden])')||document.body;const focusables=[...scope.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&!record.popup.contains(el)&&el.getClientRects().length);const index=focusables.indexOf(record.button),next=focusables[(index+(event.shiftKey?-1:1)+focusables.length)%focusables.length];close(false);next?.focus();}else close(false);return;
  }
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
   event.preventDefault();const enabled=record.filtered.filter(o=>!o.disabled);
   let index;if(event.key==='Home')index=enabled[0]?.index;else if(event.key==='End')index=enabled.at(-1)?.index;else index=lumeOptionStep(record.filtered,record.highlight,event.key==='ArrowDown'?1:-1);
   focusOption(record,index??-1);return;
  }
  if(event.key==='Enter'||(event.key===' '&&document.activeElement!==record.search)){event.preventDefault();choose(record,record.highlight);return;}
  if(document.activeElement===record.button&&event.key.length===1&&!event.ctrlKey&&!event.metaKey){event.preventDefault();record.typeahead=(record.typeahead||'')+event.key;clearTimeout(record.typeTimer);record.typeTimer=setTimeout(()=>record.typeahead='',700);const match=lumeOptionSearch(record.filtered,record.typeahead).find(o=>!o.disabled);if(match)focusOption(record,match.index);}
 }
 function enhance(){
  if(active&&(!active.select.isConnected||!active.button.getClientRects().length||active.button.closest('[hidden],.sheet[aria-hidden="true"]'))){close(false);}
  document.querySelectorAll('select:not([multiple])').forEach(select=>{
   if(records.has(select)){sync(records.get(select));return;}
   // Leave intentional hidden selects alone; only enhance controls that belong to the UI.
   if(select.hidden)return;
   const id='lume-select-'+(++serial),label=[...select.labels][0]||select.closest('.field')?.querySelector('label');
   const wrapper=document.createElement('div');wrapper.className='lume-select';const button=document.createElement('button');button.type='button';button.className='lume-select-trigger';button.id=id;button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-controls',id+'-list');button.setAttribute('aria-expanded','false');
   if(label){label.id ||= id+'-label';label.htmlFor=id;button.setAttribute('aria-labelledby',label.id);}else button.setAttribute('aria-label',select.getAttribute('aria-label')||'Escolha uma opção');
   const value=document.createElement('span');value.className='lume-select-value';button.append(value);const icon=document.createElement('span');icon.className='lume-select-chevron';icon.innerHTML=chevron;button.append(icon);
   const popup=document.createElement('div');popup.className='lume-select-menu';popup.hidden=true;
   const search=document.createElement('input');search.type='search';search.className='lume-select-search';search.placeholder='Buscar opção…';search.autocomplete='off';search.setAttribute('role','combobox');search.setAttribute('aria-expanded','true');search.setAttribute('aria-controls',id+'-list');search.setAttribute('aria-autocomplete','list');search.setAttribute('aria-label','Buscar em '+(label?.textContent.trim()||'opções'));
   const list=document.createElement('div');list.id=id+'-list';list.className='lume-select-list';list.setAttribute('role','listbox');list.setAttribute('aria-label',label?.textContent.trim()||'Opções');
   const status=document.createElement('div');status.className='lume-select-status';status.setAttribute('role','status');popup.append(search,list,status);wrapper.append(button,popup);select.after(wrapper);
   const record={id,select,button,value,label,popup,search,list,status,filtered:[],highlight:-1};records.set(select,record);select.hidden=true;select.tabIndex=-1;select.classList.add('lume-native-select');sync(record);
   button.addEventListener('click',()=>open(record));button.addEventListener('keydown',event=>keydown(record,event));search.addEventListener('keydown',event=>keydown(record,event));search.addEventListener('input',()=>{drawOptions(record,search.value);position(record);});select.addEventListener('change',()=>sync(record));
   select.addEventListener('invalid',event=>{event.preventDefault();button.setAttribute('aria-invalid','true');button.focus();open(record);});
  });
 }
 document.addEventListener('pointerdown',event=>{if(active&&!active.popup.contains(event.target)&&!active.button.contains(event.target))close(false);},true);
 document.addEventListener('change',event=>{if(event.target.tagName==='SELECT'){const record=records.get(event.target);if(record){record.button.removeAttribute('aria-invalid');sync(record);}}});
 document.addEventListener('reset',()=>requestAnimationFrame(enhance),true);
 document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'&&!active.popup.contains(event.target)&&event.target!==active.button){event.preventDefault();event.stopPropagation();close();}},true);
 window.addEventListener('resize',()=>{if(active)position(active);});window.visualViewport?.addEventListener('resize',()=>{if(active)position(active);});
 document.addEventListener('scroll',event=>{if(active&&!active.popup.contains(event.target))position(active);},true);
 new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','hidden','open','aria-hidden']});
 enhance();return {enhance,close};
})();
