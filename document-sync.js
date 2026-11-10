/* Each tab keeps its own pending document. Only the server decides which revision wins. */
function createLumeDocumentSync({owner,record,initial,storage,tabId,resumeId,onKey,rpc,active,changed}){
 const prefix=`lume_fit_pending:${owner}:`;let key=prefix+tabId,base=record?.updated_at||null,db=initial,revision=0,saved=0,write=null,conflict=false,error='',inFlight=null;
 const clone=value=>JSON.parse(JSON.stringify(value));
 try{const pending=JSON.parse(storage.getItem(prefix+(resumeId||tabId))||'null');if(pending?.owner===owner&&pending.db&&Number.isInteger(pending.revision)&&pending.revision>0){db=pending.db;base=pending.base;revision=pending.revision;saved=pending.saved||0;write=pending.write||null;conflict=base!==(record?.updated_at||null);}}catch{error='Não foi possível ler o rascunho local.';}
 function persist(){try{storage.setItem(key,JSON.stringify({owner,base,db,revision,saved,write,savedAt:Date.now()}));return true;}catch{error='Não foi possível guardar o rascunho neste dispositivo. Exporte um backup.';return false;}}
 function update(value){const previous=db,previousRevision=revision;db=clone(value);revision++;const ok=persist();if(!ok){db=previous;revision=previousRevision;}changed();return ok;}
 function drafts(){const result=[];try{for(let i=0;i<storage.length;i++){const candidate=storage.key(i);if(candidate?.startsWith(prefix)&&candidate!==key){const pending=JSON.parse(storage.getItem(candidate)||'null');if(pending?.owner===owner&&pending.db)result.push({key:candidate,savedAt:pending.savedAt});}}}catch{}return result.sort((a,b)=>b.savedAt-a.savedAt);}
 async function sync(){
  if(!active()||conflict)return;if(inFlight)return inFlight;if(revision<=saved)return;
  inFlight=(async()=>{
   while(active()&&!conflict&&revision>saved){
    if(!write){write={id:crypto.randomUUID(),payload:clone(db),revision};if(!persist())break;}
    const request=write;
    try{
     const {data,error:failure}=await rpc({p_expected:base,p_data:request.payload,p_mutation:request.id});
     if(!active())return;if(failure)throw failure;
     if(data?.conflict){conflict=true;error='Há alterações de outra sessão. Seu rascunho foi preservado.';persist();break;}
     if(!data?.updated_at)throw Error('Resposta de sincronização inválida.');
     base=data.updated_at;saved=request.revision;write=null;error='';
     if(revision>saved){if(!persist())break;}else{try{storage.removeItem(key);}catch{}}
    }catch(e){if(active()){error=e?.code==='PGRST202'?'A proteção de sincronização ainda precisa ser ativada no servidor. Seu rascunho está neste dispositivo.':'Não foi possível confirmar o salvamento. Seu rascunho foi preservado; tente sincronizar novamente.';persist();}break;}
   }
  })();
  try{await inFlight;}finally{inFlight=null;if(active())changed();}
 }
 function useCloud(row){if(inFlight)throw Error('Aguarde a sincronização.');if(revision>saved&&!persist())return false;key=prefix+crypto.randomUUID();onKey?.(key.slice(prefix.length));base=row?.updated_at||null;db=clone(row?.data||initial);revision=0;saved=0;write=null;conflict=false;error='';changed();return clone(db);}
 function restore(candidate){if(inFlight)return false;try{const p=JSON.parse(storage.getItem(candidate)||'null');if(!candidate.startsWith(prefix)||p?.owner!==owner||!p.db)return false;if(revision>saved&&!persist())return false;key=prefix+crypto.randomUUID();onKey?.(key.slice(prefix.length));db=clone(p.db);revision=1;saved=0;write=null;conflict=true;error='Rascunho recuperado. Compare e exporte antes de escolher a versão da nuvem.';if(!persist())return false;changed();return clone(db);}catch{return false;}}
 if(revision>saved&&resumeId&&resumeId!==tabId)persist();onKey?.(key.slice(prefix.length));
 return {update,sync,useCloud,restore,drafts,get db(){return clone(db);},get pending(){return revision>saved;},get busy(){return !!inFlight;},get conflict(){return conflict;},get error(){return error;},get key(){return key;}};
}
