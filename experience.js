/* Accessible interaction polish; no telemetry or personal-data logging. */
(() => {
 'use strict';
 const enhance = () => {
  const badge=document.querySelector('.offline-pill');
  if(badge) badge.textContent=!navigator.onLine?'Sem conexão':window.LumeAuth?.email()?'Conta online':'Modo local';
  document.querySelectorAll('.field').forEach(field=>{const label=field.querySelector('label');const input=field.querySelector('input,select');if(label&&input&&!label.htmlFor){input.id ||= 'field-'+Math.random().toString(36).slice(2);label.htmlFor=input.id;}});
  document.querySelectorAll('div[onclick]').forEach(node => {
   if (node.querySelector('button,input,select,a')) return;
   node.setAttribute('role','button'); node.tabIndex=0;
  });
  document.querySelectorAll('.nav button').forEach(b => {
   if(b.classList.contains('active')) b.setAttribute('aria-current','page');
   else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('button.icon-btn:not([aria-label])').forEach(b => b.setAttribute('aria-label', b.textContent.trim()==='＋'?'Criar rotina':'Abrir frequência'));
  document.querySelectorAll('.chart-wrap svg').forEach(s=>{s.setAttribute('role','img');s.setAttribute('aria-label','Evolução das cargas registradas. Os valores estão indicados no gráfico.');});
 };
 enhance();
 window.addEventListener('online',enhance);window.addEventListener('offline',enhance);
 const main=document.getElementById('mainContent');
 new MutationObserver(enhance).observe(main,{childList:true,subtree:true});
 new MutationObserver(enhance).observe(document.getElementById('bottomNav'),{attributes:true,subtree:true,attributeFilter:['class']});
 document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ') && e.target.matches('div[role=button][onclick]')){e.preventDefault();e.target.click();}
 });
 const sheetFocus=new WeakMap();
 const sheets=[...document.querySelectorAll('.sheet')];
 const topSheet=()=>sheets.find(el=>el.id==='dialogOverlay'&&el.classList.contains('active'))||sheets.find(el=>el.classList.contains('active'))||null;
 const focusable=sheet=>[...sheet.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(x=>x.type!=='hidden'&&!x.disabled&&x.getClientRects().length);
 function syncSheets(){
  const top=topSheet(),blocked=!!top||document.body.classList.contains('personalizing');
  sheets.forEach(el=>{el.inert=el!==top;});
  document.querySelector('.app').inert=blocked;document.getElementById('bottomNav').inert=blocked;
  return top;
 }
 sheets.forEach(sheet=>{
  new MutationObserver(()=>{
   const opened=sheet.classList.contains('active');
   if(opened){sheetFocus.set(sheet,document.activeElement);enhance();}
   syncSheets();
   requestAnimationFrame(()=>{
    const top=topSheet();
    if(opened&&sheet===top){focusable(top)[0]?.focus();return;}
    if(!opened){const back=sheetFocus.get(sheet);if(back?.isConnected&&!back.disabled&&!back.closest('[inert]'))back.focus();else if(top)focusable(top)[0]?.focus();}
   });
  }).observe(sheet,{attributes:true,attributeFilter:['class']});
  sheet.addEventListener('keydown',e=>{
   if(e.key!=='Tab'||sheet!==topSheet())return;
   const f=focusable(sheet);if(!f.length)return;
   if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus();}
   else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus();}
  });
 });
 const policies={
 privacy:['Privacidade e armazenamento',`<p>Atualizado em 27 de outubro de 2026. Este aviso descreve a versão atual do Lume Fit.</p><h3>O que você informa</h3><p>Contas usam e-mail e senha no Supabase Authentication. O app registra nome, apresentação opcional, modalidades, objetivo, preferências de foco muscular, disponibilidade, equipamentos, metas de frequência, rotinas, séries, cargas, repetições e histórico. A personalização pode ser adiada; por padrão estes dados não são compartilhados. A opção Perfil e privacidade permite escolher nome de usuário, nome no perfil, foto e apresentação opcionais, contagens de dias ativos e nomes/datas dos últimos 10 treinos para pessoas autenticadas no Lume, após confirmação. A visibilidade pode ser restrita a amizades aceitas. A aba Amigos mantém solicitações, amizades e bloqueios no servidor; receber solicitações começa desativado. Ativar permite localizar seu nome e @ pela busca exata, mesmo com perfil privado. Bloquear encerra a conexão e impede visualização entre as duas contas. Solicitações podem ser limitadas para evitar abuso. O nome de usuário só é reservado quando confirmado pelo servidor. Peso, medidas, cargas, séries e repetições não integram a visualização compartilhada. Rascunhos no modo local não publicam dados. Informações pessoais e foto de perfil são utilizadas nas funções que você escolher preencher. Evite adicionar dados desnecessários.</p><h3>Onde ficam os dados</h3><p>No modo local, os registros ficam no navegador deste dispositivo. Com uma conta, são enviados ao Supabase e também mantidos em cache local por usuário. Sair da conta não apaga esse cache. Evite dispositivos compartilhados.</p><h3>Serviços utilizados</h3><p>O GitHub Pages hospeda o site; o Supabase oferece autenticação e banco de dados; o jsDelivr entrega a biblioteca de conexão. Esses serviços recebem dados técnicos de conexão, como endereço IP, conforme suas próprias políticas. O código desta versão não integra publicidade, Google Analytics ou rastreamento comportamental.</p><h3>Seu controle</h3><p>Em Ajustes, você pode editar seu perfil e exportar um backup. Rotinas e registros podem ser excluídos no app. Excluir uma rotina preserva o histórico. Limpar dados do navegador pode apagar registros locais sem backup, mas não exclui a conta e os dados da nuvem.</p><h3>Pedidos sobre dados</h3><p>A exclusão integral da conta ainda não está disponível na interface. Para solicitar acesso, correção ou exclusão, entre em contato diretamente com a pessoa que disponibilizou o Lume Fit para você. A identificação do responsável, o canal público de atendimento, os prazos de retenção e os detalhes de hospedagem do banco ainda precisam ser formalizados pelo mantenedor.</p>`],
 storage:['Armazenamento no dispositivo',`<p>O Lume Fit utiliza armazenamento local para manter a sessão, os registros e o modo de demonstração. O service worker armazena arquivos do aplicativo para permitir carregamento offline fora da prévia hospedada. O treino em andamento é salvo neste navegador, separado por conta, até finalizar ou descartar. Esse rascunho não é sincronizado com outros dispositivos.</p><p>Esta versão não adiciona cookies opcionais de publicidade ou analytics. Por isso, não há uma opção fictícia de aceitar ou rejeitar rastreadores inexistentes.</p><p>Você pode gerenciar e limpar os dados do site nas configurações do navegador. Exporte seu backup antes: a limpeza pode encerrar sua sessão e remover registros locais. Os dados da nuvem não são excluídos por essa operação.</p>`],
 terms:['Sobre o uso do Lume Fit',`<p>O Lume Fit é um diário de treino gratuito para organizar rotinas e acompanhar registros pessoais. Não há cobrança, assinatura ou compra nesta versão.</p><h3>Uso responsável</h3><p>Você decide quais dados registra e deve proteger suas credenciais. Não use o serviço para acessar dados de terceiros ou enviar conteúdo ilícito. Envie apenas imagens que tenha direito de utilizar.</p><h3>Estimativas e registros</h3><p>As métricas são educativas e dependem dos dados informados. Não são diagnóstico, prescrição ou garantia de resultado. A execução e a adequação de exercícios devem ser discutidas com um profissional qualificado.</p><h3>Disponibilidade e backups</h3><p>O serviço pode sofrer interrupções. Mantenha backups dos seus registros, especialmente antes de limpar o navegador ou trocar de dispositivo. Uma mesma conta em dispositivos simultâneos pode apresentar conflitos de sincronização.</p><p>Este texto descreve o uso atual e não reduz direitos previstos na legislação. Não há política de reembolso aplicável porque o app não realiza vendas. Condições comerciais, caso sejam introduzidas, precisam ser informadas antes de qualquer contratação.</p>`]
 };
 const dialog=document.getElementById('legalDialog');
 document.querySelectorAll('[data-policy]').forEach(link=>link.addEventListener('click',e=>{
  e.preventDefault();const [title,body]=policies[link.dataset.policy];
  dialog.querySelector('#legalTitle').textContent=title;dialog.querySelector('#legalBody').innerHTML=body;dialog.showModal();
 }));
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());
 document.getElementById('authForm').addEventListener('submit',()=>{
  const b=document.getElementById('authSubmit');
  if(b.disabled)b.setAttribute('aria-busy','true');
  const observer=new MutationObserver(()=>{b.setAttribute('aria-busy',String(b.disabled));});
  observer.observe(b,{attributes:true,attributeFilter:['disabled']});
 },{once:true});
})();
