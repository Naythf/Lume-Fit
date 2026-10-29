/* Interaction-led motion; no timers for fake loading or persistence changes. */
window.LumeMotion=(()=>{
 const records=new WeakMap(),running=new Set(),navAnimations=new WeakMap();
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 function finish(record,expanded){
  if(record.animation){const animation=record.animation;record.animation=null;animation.cancel();}
  record.expanded=expanded;record.details.open=expanded;record.body.inert=!expanded;record.details.removeAttribute('data-disclosure-state');record.details.classList.remove('lume-disclosure-animating');running.delete(record);
 }
 function toggle(record){
  const {details,body}=record;
  const state=details.dataset.disclosureState,expanded=state==='closing'?true:state==='opening'?false:!details.open;
  const start=details.getBoundingClientRect().height;
  if(record.animation){record.animation.cancel();record.animation=null;}
  if(preference.matches||typeof details.animate!=='function'){finish(record,expanded);return;}
  if(expanded){details.open=true;body.inert=false;}
  const full=details.getBoundingClientRect().height;
  const end=expanded?full:Math.max(0,full-body.getBoundingClientRect().height);
  if(!expanded){if(body.contains(document.activeElement))record.summary.focus({preventScroll:true});body.inert=true;}
  details.dataset.disclosureState=expanded?'opening':'closing';details.classList.add('lume-disclosure-animating');
  const animation=details.animate([{height:start+'px'},{height:end+'px'}],{duration:expanded?320:240,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  record.animation=animation;record.expanded=expanded;running.add(record);
  animation.onfinish=()=>{if(record.animation===animation)finish(record,expanded);};
 }
 function enhance(){
  for(const record of running)if(!record.details.isConnected)finish(record,record.expanded);
  document.querySelectorAll('details').forEach(details=>{
   if(records.has(details))return;
   const summary=[...details.children].find(el=>el.tagName==='SUMMARY');if(!summary)return;
   const body=document.createElement('div');body.className='lume-disclosure-body';
   let child=summary.nextSibling;while(child){const next=child.nextSibling;body.append(child);child=next;}
   details.append(body);body.inert=!details.open;
   const record={details,summary,body,animation:null,expanded:details.open};records.set(details,record);
   summary.addEventListener('click',event=>{if(event.target.closest('a,button,input,select,textarea'))return;event.preventDefault();toggle(record);});
   details.addEventListener('toggle',()=>{if(!record.animation)body.inert=!details.open;});
  });
 }
 document.addEventListener('invalid',event=>{
  let details=event.target.closest('details');
  while(details){const record=records.get(details);if(record)finish(record,true);details=details.parentElement?.closest('details');}
 },true);
 document.addEventListener('click',event=>{
  const button=event.target.closest('#bottomNav button');if(!button||preference.matches||!button.animate)return;
  navAnimations.get(button)?.cancel();navAnimations.set(button,button.animate([{transform:'scale(1)'},{transform:'scale(.94)',offset:.28},{transform:'scale(1.018)',offset:.72},{transform:'scale(1)'}],{duration:300,easing:'cubic-bezier(.2,.7,.3,1)'}));
 },true);
 preference.addEventListener('change',()=>{if(preference.matches)for(const record of [...running])finish(record,record.expanded);});
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();return {enhance};
})();
