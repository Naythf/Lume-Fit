/* Release checks never touch workout data, sessions or authentication storage. */
function lumeCanRefresh({visible,busy,dirty,attempted}){return visible&&!busy&&!dirty&&!attempted;}
window.LumeUpdates=(()=>{
 const release=document.documentElement.dataset.release,root=new URL('./',location.href),isPreview=location.hostname.endsWith('.chatgpt.site');
 let dirty=false,pending=null,inflight=false,lastCheck=0;
 const valid=value=>typeof value==='string'&&/^[a-f0-9]{12}$/.test(value);
 function busy(){
  if(typeof state!=='undefined'&&state.activeWorkout)return true;
  if(document.querySelector('.sheet.active,dialog[open],#personalizePanel:not([hidden])'))return true;
  return [...document.querySelectorAll('input:not([type="hidden"]),textarea,select')].some(el=>el.getClientRects().length&&(el===document.activeElement||((el.tagName==='INPUT'||el.tagName==='TEXTAREA')&&el.value)));
 }
 function reload(){
  if(!valid(pending))return;
  const url=new URL(location.href);url.searchParams.set('lume_release',pending);location.replace(url.href);
 }
 function show(){
  let banner=document.getElementById('releaseNotice');
  if(!banner){banner=document.createElement('aside');banner.id='releaseNotice';banner.className='release-notice';banner.setAttribute('aria-label','Atualização do aplicativo');banner.innerHTML='<span role="status">Nova versão disponível. Atualize quando terminar suas alterações.</span><button type="button">Atualizar agora</button>';banner.querySelector('button').addEventListener('click',async()=>{if((busy()||dirty)&&!await lumeConfirm('Atualizar aplicativo?','Há um treino ou alterações em andamento. Conclua ou salve antes de atualizar. Atualizar agora descarta o que ainda não foi salvo.'))return;reload();});document.body.append(banner);}
 }
 async function check(force=false){
  if(inflight||document.visibilityState==='hidden'||(!force&&Date.now()-lastCheck<5000))return;
  inflight=true;lastCheck=Date.now();
  try{
   const url=new URL('app-version.json',root);url.searchParams.set('check',String(Date.now()));
   const response=await fetch(url,{cache:'no-store',credentials:'same-origin'});
   if(!response.ok||!/(?:application\/json|text\/json)/i.test(response.headers.get('content-type')||''))return;
   const data=await response.json();if(!valid(data.release)||data.release===release)return;
   pending=data.release;
   const safe=lumeCanRefresh({visible:document.visibilityState==='visible',busy:busy(),dirty,attempted:new URL(location.href).searchParams.get('lume_release')===pending});
   if(safe)reload();else show();
  }catch{/* Offline, auth gates and unavailable metadata leave the current page intact. */}finally{inflight=false;}
 }
 async function retirePreviewCache(){
  if(!isPreview)return;
  try{
   if('serviceWorker' in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.filter(reg=>[reg.active,reg.waiting,reg.installing].some(worker=>worker&&new URL(worker.scriptURL).href===new URL('sw.js',root).href)).map(reg=>reg.unregister()));}
   if('caches' in window)await Promise.all((await caches.keys()).filter(key=>key.startsWith('lume-fit-static-')).map(key=>caches.delete(key)));
  }catch{/* Storage restrictions must not prevent using the app. */}
 }
 document.addEventListener('input',event=>{if(event.target.matches('input,textarea,select'))dirty=true;},true);
 document.addEventListener('change',event=>{if(event.target.matches('input,textarea,select'))dirty=true;},true);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
 window.addEventListener('focus',()=>check());window.addEventListener('online',()=>check());
 setInterval(()=>check(),30000);retirePreviewCache();check(true);
 return {check:()=>check(true),release,isPreview};
})();
