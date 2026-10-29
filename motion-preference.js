/* Device-local preference: system remains the default; full motion is an explicit choice. */
function effectiveReducedMotion(choice,systemReduced){return choice==='reduced'||(choice!=='full'&&systemReduced);}
window.LumeMotionPreference=(()=>{
 const key='lume_motion_preference',query=window.matchMedia('(prefers-reduced-motion: reduce)'),listeners=new Set();let choice='system',testAnimation=null;
 const valid=value=>['system','full','reduced'].includes(value)?value:'system';
 try{choice=valid(localStorage.getItem(key));}catch{}
 function apply(){document.documentElement.dataset.motion=effectiveReducedMotion(choice,query.matches)?'reduced':'full';for(const callback of listeners)callback({matches:effectiveReducedMotion(choice,query.matches)});}
 function refreshSettings(){if(typeof renderSettings==='function')renderSettings();}
 function set(value){choice=valid(value);try{localStorage.setItem(key,choice);}catch{}if(testAnimation){testAnimation.cancel();testAnimation=null;}apply();refreshSettings();}
 function systemChange(){apply();refreshSettings();}
 if(query.addEventListener)query.addEventListener('change',systemChange);else query.addListener?.(systemChange);
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){try{choice=valid(localStorage.getItem(key));}catch{choice='system';}systemChange();}});
 function test(){
  const dot=document.querySelector('.motion-test-dot'),status=document.getElementById('motionTestStatus');if(!dot||!status)return;
  if(effectiveReducedMotion(choice,query.matches)){status.textContent='O modo reduzido está ativo. Escolha Ativadas acima para testar o movimento.';return;}
  if(typeof dot.animate!=='function'){status.textContent='Este navegador não oferece o recurso usado nas animações de interação. Tente uma versão atual do navegador.';return;}
  testAnimation?.cancel();status.textContent='Executando animação…';
  const distance=Math.max(20,dot.parentElement.clientWidth-dot.clientWidth-16);
  const animation=dot.animate([{transform:'translateX(0)'},{transform:`translateX(${distance}px)`,offset:.55},{transform:'translateX(0)'}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});testAnimation=animation;
  animation.onfinish=()=>{if(testAnimation!==animation)return;testAnimation=null;if(status.isConnected)status.textContent='Animação concluída neste navegador.';};
 }
 apply();return {get matches(){return effectiveReducedMotion(choice,query.matches);},get choice(){return choice;},get systemReduced(){return query.matches;},set,test,addEventListener(type,callback){if(type==='change')listeners.add(callback);},removeEventListener(type,callback){if(type==='change')listeners.delete(callback);}};
})();
function motionPreferenceCard(){
 const p=window.LumeMotionPreference;
 const explanation=p.choice==='system'?(p.systemReduced?'O sistema está pedindo movimento reduzido. Por isso os efeitos estão desativados. Você pode escolher Ativadas neste navegador.':'O sistema permite animações. Os efeitos estão ativados.'):(p.matches?'Você escolheu movimento reduzido neste navegador.':'Você ativou as animações neste navegador, independentemente da preferência do sistema.');
 return `<section class="motion-preference-card"><h3>Animações</h3><p>${explanation}</p><div class="field"><label for="motionPreference">Movimento do aplicativo</label><select id="motionPreference" onchange="LumeMotionPreference.set(this.value)">${[['system','Seguir o sistema'],['full','Ativadas'],['reduced','Reduzidas']].map(([key,label])=>`<option value="${key}" ${p.choice===key?'selected':''}>${label}</option>`).join('')}</select></div><div class="motion-test-track" aria-hidden="true"><span class="motion-test-dot"></span></div><button type="button" class="secondary-btn" onclick="LumeMotionPreference.test()">Testar animação</button><p id="motionTestStatus" class="hint" role="status">Preferência salva somente neste navegador.</p><small>Interface v20. Se o visual parecer antigo, recarregue o aplicativo.</small><button class="ghost-btn" onclick="reloadLumeInterface()">Recarregar aplicativo</button></section>`;
}
async function reloadLumeInterface(){if(typeof state!=='undefined'&&state.activeWorkout&&!await lumeConfirm('Recarregar aplicativo?','O treino em andamento ainda não foi salvo. Finalize ou exporte seus registros antes de recarregar.'))return;window.location.reload();}
