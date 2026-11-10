/* A user-initiated operation: no account is deleted when rendering or opening the editor. */
function clearLumeAccountStorage(storage,owner){
 const exact=new Set([`lume_fit_user_${owner}`,`lume_fit_workout_draft:lume_fit_user_${owner}`]);
 const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(exact.has(key)||key?.startsWith(`lume_fit_pending:${owner}:`))keys.push(key);}
 for(const key of keys)storage.removeItem(key);
}
window.AccountDeletion=(()=>{
 let owner='',pending=false,committing=false;
 function open(){
  if(!window.LumeAuth?.email()){openSheet('<h3>Exclusão da conta</h3><p class="editor-intro">Você está no modo local. Nenhuma conta da nuvem está conectada. Para gerenciar os dados deste navegador, exporte um backup em Ajustes.</p><button class="secondary-btn" onclick="closeSheet()">Entendi</button>');return;}
  owner=LumeAuth.email();pending=false;
  openSheet(`<h3>Excluir minha conta</h3><p class="editor-intro">Esta ação remove sua conta, perfil, amizades, bloqueios, treinos e refeições do Lume Fit. Não é possível desfazer.</p><p class="hint">Backups exportados e caches em outros aparelhos não podem ser apagados por este dispositivo. A senha é usada somente para confirmar sua identidade no Supabase.</p><button type="button" class="secondary-btn" onclick="exportData()">Exportar backup antes de excluir</button><form id="deleteAccountForm" onsubmit="AccountDeletion.submit(event)"><div class="field"><label for="deleteAccountPassword">Sua senha atual</label><input id="deleteAccountPassword" name="password" type="password" autocomplete="current-password" required></div><div class="field"><label for="deleteAccountConfirmation">Digite EXCLUIR para confirmar</label><input id="deleteAccountConfirmation" name="confirmation" required pattern="EXCLUIR" autocomplete="off" autocapitalize="characters" spellcheck="false"></div><p id="deleteAccountStatus" role="status"></p><div class="row-actions"><button type="button" class="ghost-btn" onclick="closeSheet()">Cancelar</button><button id="deleteAccountSubmit" type="submit" class="primary-btn">Excluir minha conta</button></div></form>`);
 }
 async function submit(event){
  event.preventDefault();if(pending||owner!==LumeAuth.email())return;
  const form=event.target,status=document.getElementById('deleteAccountStatus'),button=document.getElementById('deleteAccountSubmit'),confirmation=form.elements.confirmation.value;
  if(confirmation!=='EXCLUIR')return;
  pending=true;button.disabled=true;button.textContent='Aguardando confirmação';
  const accepted=await lumeConfirm('Excluir sua conta definitivamente?','Sua conta e todos os registros associados serão removidos da nuvem. Você já exportou o que deseja guardar?');
  if(!accepted||owner!==LumeAuth.email()||!form.isConnected){pending=false;if(button.isConnected){button.disabled=false;button.textContent='Excluir minha conta';}return;}
  committing=true;const password=form.elements.password.value;form.elements.password.value='';button.textContent='Verificando e excluindo...';status.textContent='Confirmando sua identidade e processando a solicitação.';
  try{await LumeAuth.deleteAccount(password,confirmation);}catch(e){if(form.isConnected){status.textContent=e?.message||'Não foi possível confirmar a exclusão. Verifique a conta antes de tentar novamente.';button.disabled=false;button.textContent='Excluir minha conta';}}finally{pending=false;committing=false;}
 }
 function reset(){owner='';pending=false;committing=false;}
 return {open,submit,reset,get busy(){return committing;}};
})();
