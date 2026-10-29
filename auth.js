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
  let revision = 0;
  let savedRevision = 0;
  let timer = null;
  let inFlight = null;
  let currentUserToken = 0;
  let syncError = '';

  const el = id => document.getElementById(id);
  const notify = msg => { el('authMessage').textContent = msg; };
  const localKey = uid => `lume_fit_user_${uid}`;
  const snapshot = db => JSON.parse(JSON.stringify(db));
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
    const u=session?.user;
    if(!u){ showLogin(); return; }
    const token=++currentUserToken;
    user=u; demo=false; syncError=''; revision=0; savedRevision=0;
    const key=localKey(u.id);
    let local=null;
    try {const s=localStorage.getItem(key);if(s)local=JSON.parse(s);}catch{}
    let cloud;
    try {
      const {data,error}=await client.from('user_data').select('data').eq('user_id',u.id).maybeSingle();
      if(error)throw error;
      cloud=data?.data || null;
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
    state.db=normalizeDB(result);
    if(!cloud && !local && u.user_metadata?.name) state.db.profile.name=u.user_metadata.name;
    try{localStorage.setItem(key,JSON.stringify(state.db));}catch{}
    if(!cloud && local) scheduleSync();
    state.selectedRoutineId=null;
    state.activeWorkout=null;
    document.body.classList.remove('auth-locked');
    authEl.hidden=true;
    state.currentTab='home';
    document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='screen-home'));
    document.querySelectorAll('#bottomNav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='home'));
    render();
    setSyncLabel();
    window.ProfileExperience?.afterLogin();
  }
  function showLogin(){
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
    document.body.classList.remove('auth-locked');authEl.hidden=true;
    switchTab('home');
    window.ProfileExperience?.afterLogin();
    toast('Modo local: seus dados não estão na nuvem.');
  }
  function persist(db){
    if(demo){try{localStorage.setItem('lumefit_v4_demo',JSON.stringify(db));}catch{toast('Armazenamento local cheio. Exporte um backup.');}return;}
    if(!user)return;
    try{localStorage.setItem(localKey(user.id), JSON.stringify(db));}catch{syncError='Armazenamento local cheio';}
    revision++;
    scheduleSync();
  }
  function scheduleSync(){
    if(!user || !client)return;
    clearTimeout(timer);
    timer=setTimeout(()=>syncNow().catch(()=>{}),700);
    setSyncLabel();
  }
  async function syncNow(){
    if(demo){toast('Modo local: sem sincronização.');return;}
    if(!user || !client)return;
    clearTimeout(timer);
    if(inFlight){await inFlight;if(savedRevision<revision)return syncNow();return;}
    const id=user.id;
    const token=currentUserToken;
    const payload=snapshot(state.db);
    const rev=revision;
    setSyncLabel('Sincronizando...');
    inFlight=(async()=>{
      try {
        const {error}=await client.from('user_data').upsert({user_id:id,data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});
        if(error)throw error;
        if(token===currentUserToken && user?.id===id){savedRevision=Math.max(savedRevision,rev);syncError='';}
      }catch(e){if(token===currentUserToken){syncError=printError(e);console.warn('Lume Fit: sincronização falhou',e);}}
      finally{inFlight=null;setSyncLabel();}
    })();
    await inFlight;
    if(user?.id===id && !syncError && savedRevision<revision)await syncNow();
  }
  function setSyncLabel(text){
    const node=el('cloudState');
    if(node)node.textContent=text||status();
  }
  function status(){
    if(demo)return 'Modo local — sem nuvem';
    if(!user)return 'Desconectado';
    if(syncError)return 'Falha: '+syncError;
    return revision>savedRevision?'Pendente de sincronização':'Dados na nuvem';
  }
  async function signOut(){
    if(demo){demo=false;showLogin();return;}
    if(!client || !user)return;
    try{await syncNow();}catch{}
    if(syncError){toast('Erro ao sincronizar. Faça um backup antes de sair.');return;}
    clearTimeout(timer);
    ++currentUserToken;
    const {error}=await client.auth.signOut();
    if(error){toast(printError(error));return;}
    showLogin();
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
  window.LumeAuth={showMode,submit,startDemo,persist,signOut,syncNow,resetPassword,status,email:()=>user?.email||''};
  window.addEventListener('online',()=>{if(user)syncNow();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden' && user && revision>savedRevision)syncNow();});
  init();
})();
