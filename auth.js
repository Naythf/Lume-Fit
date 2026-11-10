/* Lume Fit 4 — autenticação e armazenamento por usuário.
   RLS no Supabase é obrigatório para proteger dados de outros usuários. */
(() => {
  'use strict';
  const config = window.LUME_CONFIG || {};
  const url = String(config.supabaseUrl || '').trim();
  const pub = String(config.supabasePublishableKey || '').trim();
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) && pub.length > 20;
  const sdkReady = Boolean(window.supabase?.createClient);
  const client = configured && sdkReady ? window.supabase.createClient(url, pub, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
  const authEl = document.getElementById('authScreen');
  let user = null;
  let mode = 'login';
  let demo = false;
  let loading = false;
  let documentSync = null;
  let syncBusy = false;
  let deletingAccount = false;
  let timer = null;
  let currentUserToken = 0;

  const el = id => document.getElementById(id);
  const notify = msg => { el('authMessage').textContent = msg; };
  const localKey = uid => `lume_fit_user_${uid}`;
  const printError = err => {
    const msg = String(err?.message || err || 'Ocorreu um erro.');
    if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar.';
    if (/User already registered/i.test(msg)) return 'Este e-mail já está cadastrado.';
    if (/Password should be at least/i.test(msg)) return 'A senha deve ter pelo menos 6 caracteres.';
    if (/Failed to fetch|NetworkError/i.test(msg)) return 'Não foi possível conectar ao servidor. Verifique sua internet.';
    return msg.length < 220 ? msg : 'Não foi possível concluir a operação. Tente novamente.';
  };
  function setLoading(on){
    loading=on;
    el('authSubmit').disabled=on || !client;
    if (on) el('authSubmit').textContent='Aguarde...';
    else el('authSubmit').textContent=mode==='login'?'Entrar':mode==='signup'?'Criar minha conta':mode==='newpassword'?'Salvar nova senha':'Enviar recuperação';
  }
  function showMode(next){
    mode=next;
    el('authTabLogin').classList.toggle('active',mode==='login');
    el('authTabLogin').disabled=mode==='newpassword'; el('authTabSignup').disabled=mode==='newpassword';
    el('authTabSignup').classList.toggle('active',mode==='signup');
    el('authNameWrap').hidden=mode!=='signup';
    el('authName').required=mode==='signup';
    el('authPasswordWrap').hidden=mode==='recover';
    el('authPassword').required=mode!=='recover';
    el('authPassword').autocomplete=mode==='signup'||mode==='newpassword'?'new-password':'current-password';
    el('authTitle').textContent=mode==='signup'?'Comece sua jornada.':mode==='recover'?'Recupere seu acesso.':mode==='newpassword'?'Escolha uma nova senha.':'Bem-vindo de volta.';
    el('authDescription').textContent=mode==='signup'?'Crie seu perfil e acompanhe cada evolução.':mode==='recover'?'Enviaremos instruções ao seu e-mail.':mode==='newpassword'?'Defina uma senha segura para voltar a treinar.':'Seus treinos, sua evolução. Tudo no mesmo lugar.';
    el('authForgot').textContent=mode==='recover'?'Voltar para entrar':'Esqueci minha senha';
    el('authForgot').hidden=mode==='newpassword'; el('authEmailWrap').hidden=mode==='newpassword'; el('authEmail').required=mode!=='newpassword';
    el('authSubmit').textContent=mode==='signup'?'Criar minha conta':mode==='recover'?'Enviar recuperação':mode==='newpassword'?'Salvar nova senha':'Entrar';
    notify('');
    setLoading(false);
  }
  async function submit(event){
    event.preventDefault();
    if(loading || !client){ notify('Configure o Supabase para habilitar contas reais.'); return; }
    const email=el('authEmail').value.trim();
    const password=el('authPassword').value;
    const name=el('authName').value.trim();
    if(mode==='signup' && !name){notify('Informe seu nome.');return;}
    setLoading(true);notify('');
    try {
      if(mode==='newpassword'){
        const {error}=await client.auth.updateUser({password});
        if(error)throw error;
        await client.auth.signOut();
        showLogin();showMode('login');notify('Senha redefinida. Entre com sua nova senha.');
      } else if(mode==='recover'){
        const redirectTo = new URL('./', location.href).href;
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});
        if(error)throw error;
        notify('Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.');
      } else if(mode==='signup'){
        const {data,error}=await client.auth.signUp({email,password,options:{data:{name},emailRedirectTo:new URL('./',location.href).href}});
        if(error)throw error;
        el('authPassword').value='';
        if(data.session) await enterSession(data.session);
        else notify('Cadastro solicitado. Verifique seu e-mail para confirmar a conta e depois entre.');
      } else {
        const {data,error}=await client.auth.signInWithPassword({email,password});
        if(error)throw error;
        await enterSession(data.session);
      }
    }catch(e){notify(printError(e));}
    finally {setLoading(false);}
  }
  async function enterSession(session){
    window.FoodDiary?.reset();
    const u=session?.user;
    if(!u){ showLogin(); return; }
    const token=++currentUserToken;
    window.Friends?.reset();
    user=u; demo=false;
    const key=localKey(u.id);
    let local=null;
    try {const s=localStorage.getItem(key);if(s)local=JSON.parse(s);}catch{}
    let cloud,cloudRecord;
    try {
      const {data,error}=await client.from('user_data').select('data,updated_at').eq('user_id',u.id).maybeSingle();
      if(error)throw error;
      cloudRecord=data;cloud=data?.data || null;
    }catch(e){
      if(token!==currentUserToken)return;
      user=null;
      showLogin();
      notify('Não foi possível ler os dados da conta. Verifique se o SQL do banco foi executado. Detalhe: '+printError(e));
      return;
    }
    if(token!==currentUserToken)return;
    // Dados da nuvem têm prioridade. Nenhum dado de outro usuário é acessado.
    const result=cloud || local || initialData();
    let resumeId;try{resumeId=sessionStorage.getItem('lume_sync_tab');}catch{}const tabId=crypto.randomUUID();
    documentSync=createLumeDocumentSync({owner:u.id,record:cloudRecord,initial:result,storage:localStorage,tabId,resumeId,onKey:id=>{try{sessionStorage.setItem('lume_sync_tab',id);}catch{}},active:()=>token===currentUserToken&&user?.id===u.id,changed:setSyncLabel,rpc:async(args)=>{const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),15000);try{return await client.rpc('lume_sync_document',args).abortSignal(controller.signal);}finally{clearTimeout(deadline);}}});
    state.db=normalizeDB(documentSync.db);
    if(!cloud && !local && u.user_metadata?.name) state.db.profile.name=u.user_metadata.name;
    try{localStorage.setItem(key,JSON.stringify(state.db));}catch{}
    if(!cloud && local&&!documentSync.pending)documentSync.update(state.db);
    if(documentSync.pending&&!documentSync.conflict)scheduleSync();
    state.selectedRoutineId=null;
    state.activeWorkout=null;
    window.GuidedWorkout?.attach(key);
    window.FrequencyExperience?.reset();
    document.body.classList.remove('auth-locked');
    authEl.hidden=true;
    state.currentTab='home';
    document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='screen-home'));
    document.querySelectorAll('#bottomNav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='home'));
    render();
    setSyncLabel();
    window.ProfileExperience?.afterLogin();
    window.SocialProfile?.connect(profileConnection());
    window.Friends?.connect(profileConnection());
  }
  function showLogin(){
    window.FoodDiary?.reset();
    documentSync=null;clearTimeout(timer);deletingAccount=false;
    window.AccountDeletion?.reset();
    closeSheet();
    window.Friends?.reset();
    window.SocialProfile?.reset();
    window.GuidedWorkout?.detach();
    window.FrequencyExperience?.reset();
    window.AutoRoutine?.reset();
    window.ProfileExperience?.reset();
    document.body.classList.add('auth-locked');
    authEl.hidden=false;
    user=null;demo=false;state.db=initialData();
    state.activeWorkout=null;state.selectedRoutineId=null;
    el('authPassword').value='';
  }
  function startDemo(){
    if(user)return;
    demo=true;
    try {state.db=normalizeDB(JSON.parse(localStorage.getItem('lumefit_v4_demo')||'null')||initialData());}
    catch {state.db=initialData();}
    window.GuidedWorkout?.attach('demo');
    document.body.classList.remove('auth-locked');authEl.hidden=true;
    switchTab('home');
    window.ProfileExperience?.afterLogin();
    window.SocialProfile?.connect(profileConnection());
    window.Friends?.connect(profileConnection());
    toast('Modo local: seus dados não estão na nuvem.');
  }
  function persist(db){
    if(demo){try{localStorage.setItem('lumefit_v4_demo',JSON.stringify(db));return true;}catch{toast('Armazenamento local cheio. Exporte um backup.');return false;}}
    if(!user||!documentSync||deletingAccount)return false;
    const ok=documentSync.update(db);if(ok)scheduleSync();return ok;
  }
  function scheduleSync(){if(!user||!client||!documentSync)return;clearTimeout(timer);timer=setTimeout(()=>syncNow().catch(()=>{}),700);setSyncLabel();}
  async function syncNow(){if(deletingAccount)return;if(demo){toast('Modo local: sem sincronização.');return;}if(!documentSync||!user)return;clearTimeout(timer);syncBusy=true;setSyncLabel();try{await documentSync.sync();}finally{syncBusy=false;setSyncLabel();}}
  function syncPanel(){
    if(demo||!user)return '<p class="hint">Modo local: seus registros ficam neste navegador. Exporte um backup para guardá-los fora deste dispositivo.</p>';
    const drafts=documentSync?.drafts()||[];
    return '<p class="hint">'+(documentSync?.conflict?'Outra sessão mudou os dados da nuvem. Exporte seu rascunho antes de carregar a versão da nuvem. Ele também será mantido neste navegador.':'Cada aba preserva seu rascunho. Alterações concorrentes pedem revisão antes de substituir seus dados.')+'</p>'+
      (documentSync?.conflict?'<div class="backup-actions"><button class="secondary-btn" onclick="exportData()">Exportar meu rascunho</button><button class="ghost-btn" onclick="LumeAuth.useCloud()">Carregar versão da nuvem</button></div>':'')+
      (drafts.length?'<details><summary>Outros rascunhos neste dispositivo ('+drafts.length+')</summary>'+drafts.map((d,i)=>'<button class="ghost-btn" onclick="LumeAuth.restoreDraft('+i+')">Recuperar rascunho de '+esc(new Date(d.savedAt).toLocaleString('pt-BR'))+'</button>').join('')+'</details>':'');
  }
  async function useCloud(){
    const engine=documentSync,owner=user?.id,token=currentUserToken;if(!engine||engine.busy)return;
    if(state.activeWorkout||document.getElementById('sheet')?.classList.contains('active')){toast('Feche a edição e finalize ou pause seu treino antes de trocar os dados.');return;}
    if(!await lumeConfirm('Carregar dados da nuvem?','Os dados abertos serão trocados pela versão da nuvem. Seu rascunho atual continuará disponível neste navegador. Exporte também um backup para guardá-lo fora deste dispositivo.'))return;
    if(engine!==documentSync||token!==currentUserToken)return;
    try{const {data,error}=await client.from('user_data').select('data,updated_at').eq('user_id',owner).maybeSingle();if(error)throw error;if(engine!==documentSync||token!==currentUserToken)return;const result=engine.useCloud(data);if(result===false)return;state.db=normalizeDB(result);window.FoodDiary?.reset();window.FrequencyExperience?.reset();render();toast('Versão da nuvem carregada.');}catch{toast('Não foi possível carregar. Seu rascunho foi mantido.');}
  }
  async function restoreDraft(index){const engine=documentSync,draft=engine?.drafts()[index];if(!draft||engine.busy)return;if(!await lumeConfirm('Recuperar rascunho?','A versão aberta será preservada como outro rascunho local. O rascunho recuperado não será enviado automaticamente para a nuvem.'))return;if(engine!==documentSync)return;const result=engine.restore(draft.key);if(result!==false){state.db=normalizeDB(result);render();}}
  function setSyncLabel(text){
    const node=el('cloudState');
    if(node)node.textContent=text||status();
    const panel=el('syncPanel');if(panel)panel.innerHTML=syncPanel();
    const notice=el('syncNotice');if(notice){notice.hidden=!documentSync?.conflict;notice.innerHTML=documentSync?.conflict?`<span>Alterações de outra sessão detectadas. Seu rascunho está preservado.</span><button class="ghost-btn" onclick="switchTab('settings')">Revisar sincronização</button>`:'';}
  }
  function status(){
    if(demo)return 'Modo local — sem nuvem';
    if(!user)return 'Desconectado';
    if(syncBusy)return 'Sincronizando...';
    if(documentSync?.conflict)return 'Conflito — rascunho preservado';
    if(documentSync?.error)return documentSync.error;
    return documentSync?.pending?'Pendente de sincronização':'Dados na nuvem';
  }
  async function signOut(){
    if(demo){demo=false;showLogin();return;}
    if(!client || !user)return;
    try{await syncNow();}catch{}
    if(documentSync?.pending){toast('Há alterações pendentes. Exporte seu backup e resolva a sincronização antes de sair.');return;}
    clearTimeout(timer);
    const departing=user.id,departingToken=currentUserToken;
    const {error}=await client.auth.signOut();
    if(error){toast(printError(error));return;}
    if(user?.id===departing&&currentUserToken===departingToken){++currentUserToken;showLogin();}
  }
  async function deleteAccount(password,confirmation){
    if(!user||demo||deletingAccount||confirmation!=='EXCLUIR')throw Error('Entre na conta e confirme a exclusão.');
    const owner=user.id,email=user.email,token=currentUserToken,engine=documentSync;
    deletingAccount=true;clearTimeout(timer);
    const verifier=window.supabase.createClient(url,pub,{auth:{storageKey:'lume-delete-verification-'+crypto.randomUUID(),persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input,options={})=>{const controller=new AbortController(),abort=()=>controller.abort(),deadline=setTimeout(abort,15000);options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();try{return await fetch(input,{...options,signal:controller.signal});}finally{clearTimeout(deadline);options.signal?.removeEventListener('abort',abort);}}}});
    let sent=false;
    try{
      if(engine?.busy)await engine.sync();
      const login=await verifier.auth.signInWithPassword({email,password});
      if(login.error)throw Error('Não foi possível confirmar sua senha. Confira os dados e a conexão.');
      if(token!==currentUserToken||user?.id!==owner||login.data?.user?.id!==owner)throw Error('A conta mudou. Reabra a exclusão.');
      const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),15000);let response;
      try{sent=true;response=await verifier.rpc('lume_delete_own_account',{p_confirmation:confirmation}).abortSignal(controller.signal);}finally{clearTimeout(deadline);}
      if(response.error){
        if(response.error.code==='PGRST202')throw Error('A exclusão ainda precisa ser ativada no servidor. Nenhum sucesso foi confirmado.');
        if(/REAUTH_REQUIRED|MFA_REQUIRED/.test(response.error.message||''))throw Error('O servidor exige uma verificação adicional de identidade. A exclusão não foi concluída.');
        throw Error('Não foi possível confirmar a exclusão. Verifique se a conta ainda existe antes de tentar novamente.');
      }
      if(response.data?.deleted!==true)throw Error('O servidor não confirmou a exclusão. Verifique sua conta antes de tentar novamente.');
      if(token!==currentUserToken||user?.id!==owner)return;
      ++currentUserToken;window.GuidedWorkout?.clearDraft();window.GuidedWorkout?.detach();
      let cleaned=true;try{clearLumeAccountStorage(localStorage,owner);localStorage.setItem('lume_account_deleted',JSON.stringify({owner,at:Date.now()}));localStorage.removeItem('lume_account_deleted');}catch{cleaned=false;}
      documentSync=null;showLogin();closeSheet();
      try{await client.auth.signOut({scope:'local'});}catch{}
      notify(cleaned?'Conta e registros excluídos. Backups exportados e dados locais de outros aparelhos não foram apagados.':'Conta excluída no servidor. Não foi possível limpar todo o cache deste navegador; remova os dados do site nas configurações do navegador.');
    }catch(e){if(sent){clearTimeout(timer);}throw e;}
    finally{deletingAccount=false;try{await verifier.auth.signOut({scope:'local'});}catch{}setSyncLabel();}
  }
  function resetPassword(){
    if(mode==='recover')showMode('login');
    else showMode('recover');
  }
  async function init(){
    el('authSetup').hidden=Boolean(client);
    if(!client){
      notify(configured?'Não foi possível carregar o serviço de autenticação. Verifique a conexão.':'');
      setLoading(false);
      return;
    }
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT' && user){++currentUserToken;showLogin();}
      if(event==='PASSWORD_RECOVERY'){
        showLogin();showMode('newpassword');
        notify('Digite uma nova senha para concluir a recuperação.');
      }
    });
    try {
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      if(data.session && mode!=='newpassword')await enterSession(data.session);
      else if(!data.session)showLogin();
    }catch(e){showLogin();notify(printError(e));}
  }
  function profileConnection(){if(!user||demo||!client)return null;const owner=user.id,token=currentUserToken;return async(name,args,options={})=>{if(token!==currentUserToken||user?.id!==owner)throw Error('ACCOUNT_CHANGED');const request=client.rpc(name,args);const result=await (options.signal&&typeof request.abortSignal==='function'?request.abortSignal(options.signal):request);if(token!==currentUserToken||user?.id!==owner)throw Error('ACCOUNT_CHANGED');return result;};}
  window.LumeAuth={profileConnection,deleteAccount,syncPanel,useCloud,restoreDraft,showMode,submit,startDemo,persist,signOut,syncNow,resetPassword,status,email:()=>user?.email||''};
  window.addEventListener('storage',event=>{if(event.key!=='lume_account_deleted'||!user)return;try{const notice=JSON.parse(event.newValue||'null');if(notice?.owner!==user.id)return;++currentUserToken;clearTimeout(timer);window.GuidedWorkout?.clearDraft();window.GuidedWorkout?.detach();try{clearLumeAccountStorage(localStorage,user.id);}catch{}documentSync=null;showLogin();notify('Esta conta foi excluída em outra aba deste dispositivo.');client.auth.signOut({scope:'local'}).catch(()=>{});}catch{}});
  window.addEventListener('online',()=>{if(user)syncNow();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden' && user && documentSync?.pending)syncNow();});
  init();
})();
