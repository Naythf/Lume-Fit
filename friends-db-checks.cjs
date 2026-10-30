const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require(process.env.LUME_PGLITE_MODULE||'@electric-sql/pglite');
(async()=>{
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 await db.exec(fs.readFileSync('supabase-schema.sql','utf8'));await db.exec(fs.readFileSync('migrations/20261029-profile-privacy.sql','utf8'));
 const migration=fs.readFileSync('supabase/migrations/20261030000800_friends_and_private_sharing.sql','utf8');await db.exec(migration);await db.exec(migration);
 const settingsMigration=fs.readFileSync('supabase/migrations/20261030011358_profile_request_preferences.sql','utf8');await db.exec(settingsMigration);await db.exec(settingsMigration);
 const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002',c='00000000-0000-0000-0000-000000000003',d='00000000-0000-0000-0000-000000000004';
 await db.query('insert into auth.users values($1),($2),($3),($4)',[a,b,c,d]);
 const asUser=(id,fn,role='authenticated')=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id||'']);await tx.exec('set local role '+role);return fn(tx)});
 const call=(id,action,handle='')=>asUser(id,async tx=>(await tx.query('select public.lume_friends($1,$2) as result',[action,handle])).rows[0].result);
 const save=(id,handle,audience='private')=>asUser(id,tx=>tx.query('select public.lume_save_profile($1,$2,$3,$4,$5,false,true,true,true,true)',[handle,'Name '+handle,'Bio','',audience]));
 const view=(id,handle)=>asUser(id,async tx=>(await tx.query('select public.lume_get_profile($1) as profile',[handle])).rows[0].profile);
 const reject=(id,act,handle,message)=>assert.rejects(call(id,act,handle),e=>e.message.includes(message));
 await reject(d,'state','','PROFILE_REQUIRED');
 await save(a,'alpha','friends');await save(b,'bravo','friends');await save(c,'charlie','members');
 await db.query('insert into public.user_data(user_id,data) values($1,$2)',[b,JSON.stringify({profile:{weight:999},sessions:[{date:new Date().toISOString(),name:'Rotina privada',entries:[{kg:900}]}]})]);
 assert.equal((await call(b,'state')).allowRequests,false);assert.equal(await call(a,'search','bravo'),null);assert.equal(await view(a,'bravo'),null);
 await reject(a,'request','bravo','UNAVAILABLE');await call(b,'requests_on');assert.equal((await call(a,'search','bravo')).canRequest,true);
 await call(a,'request','bravo');await reject(a,'request','bravo','ALREADY_CONNECTED');await reject(b,'request','alpha','UNAVAILABLE'); // Alpha opted out.
 await call(a,'requests_on');await reject(b,'request','alpha','ALREADY_CONNECTED');
 assert.equal((await call(a,'state')).people[0].relationship,'outgoing');assert.equal((await call(b,'state')).people[0].relationship,'incoming');assert.equal((await call(c,'state')).people.length,0);
 await reject(a,'accept','bravo','INVALID_TRANSITION');await reject(c,'accept','bravo','INVALID_TRANSITION');await reject(b,'cancel','alpha','INVALID_TRANSITION');assert.equal(await view(a,'bravo'),null);
 await call(b,'accept','alpha');assert.equal((await call(a,'state')).people[0].relationship,'friend');let p=await view(a,'bravo');assert.equal(p.weeklyDays,1);assert.equal(p.workouts[0].name,'Rotina privada');assert.ok(!JSON.stringify(p).includes('999'));assert.ok(!JSON.stringify(p).includes('900'));assert.equal(await view(c,'bravo'),null);
 await call(a,'remove','bravo');assert.equal(await view(a,'bravo'),null);await reject(a,'request','bravo','COOLDOWN');
 await db.exec("update lume_private.friendships set updated_at=now()-interval '25 hours'");await call(a,'request','bravo');await call(b,'decline','alpha');await reject(a,'request','bravo','COOLDOWN');
 await db.exec("update lume_private.friendships set updated_at=now()-interval '25 hours'");await call(a,'request','bravo');await call(a,'cancel','bravo');assert.equal((await call(b,'state')).people.length,0);
 await db.exec("update lume_private.friendships set updated_at=now()-interval '25 hours'");await call(a,'request','bravo');await call(b,'accept','alpha');
 await call(b,'block','alpha');assert.equal(await view(a,'bravo'),null);assert.equal(await view(b,'alpha'),null);assert.equal(await call(a,'search','bravo'),null);assert.equal((await call(a,'state')).people.length,0);assert.equal((await call(b,'state')).blocked[0].username,'alpha');await reject(a,'request','bravo','UNAVAILABLE');await reject(a,'accept','bravo','UNAVAILABLE');
 await call(a,'unblock','bravo');assert.equal(await call(a,'search','bravo'),null); // Can't remove someone else's block.
 await call(b,'unblock','alpha');assert.equal(await view(a,'bravo'),null);assert.equal((await call(a,'state')).people.length,0);
 await call(c,'block','alpha');assert.equal(await view(a,'charlie'),null); // Even members visibility respects blocks.
 await call(c,'unblock','alpha');assert.ok(await view(a,'charlie'));
 await save(b,'bravo','private');await db.exec("update lume_private.friendships set updated_at=now()-interval '25 hours'");await call(a,'request','bravo');await call(b,'accept','alpha');assert.equal(await view(a,'bravo'),null); // Friendship never overrides private.
 await call(b,'requests_off');assert.equal((await call(b,'state')).allowRequests,false);
 await save(c,'charlie','friends');await call(c,'requests_on');
 await db.query('insert into lume_private.request_limits(owner_id,attempts) values($1,20) on conflict(owner_id) do update set attempts=20,window_start=now()',[a]);await reject(a,'request','charlie','RATE_LIMIT');
 for(const table of ['lume_private.friendships','lume_private.blocks','lume_private.request_limits'])await assert.rejects(asUser(a,tx=>tx.query('select * from '+table)),e=>e.code==='42501');
 assert.equal((await asUser(a,tx=>tx.query('select * from public.user_data'))).rows.length,0);
 assert.equal((await asUser(a,tx=>tx.query('select * from public.lume_profiles'))).rows.length,1);
 await assert.rejects(asUser(null,tx=>tx.query("select public.lume_friends('state','')"),'anon'),e=>e.code==='42501');await reject(null,'state','','AUTH_REQUIRED');await reject(a,'request','alpha','UNAVAILABLE');
 const saveSettings=(id,handle,audience,allow)=>asUser(id,tx=>tx.query('select public.lume_save_profile_settings($1,$2,$3,$4,$5,false,false,false,false,false,$6) as profile',[handle,'Settings name','','',audience,allow]));
 await saveSettings(c,'charlie','private',true);assert.equal((await call(c,'state')).allowRequests,true);assert.equal((await call(a,'search','charlie')).username,'charlie');assert.equal(await view(a,'charlie'),null);
 await save(c,'charlie','private');assert.equal((await call(c,'state')).allowRequests,true); // Legacy RPC preserves the preference.
 await saveSettings(c,'charlie','private',false);assert.equal((await call(c,'state')).allowRequests,false);assert.equal(await call(a,'search','charlie'),null);
 await assert.rejects(saveSettings(c,'alpha','members',true),e=>e.code==='23505');assert.equal((await call(c,'state')).allowRequests,false);assert.equal(await view(a,'charlie'),null); // A failed profile update cannot partially enable discovery.
 await saveSettings(c,'charlie','friends',true);assert.equal((await call(c,'state')).allowRequests,true);assert.equal(await view(a,'charlie'),null);
 await assert.rejects(saveSettings(d,'new_profile','private',null),e=>e.code==='23514');assert.equal((await db.query('select count(*) as n from public.lume_profiles where user_id=$1',[d])).rows[0].n,0);
 await assert.rejects(asUser(null,tx=>tx.query("select public.lume_save_profile_settings('test_name','Name','','','private',false,false,false,false,false,true)"),'anon'),e=>e.code==='42501');
 assert.equal((await call(a,'state')).people.length,1);await db.close();console.log('PASS: friends migration twice; three-account isolation; opt-in; exact discovery; recipient-only acceptance; duplicates/crossed requests; removal/decline/cancel; cooldown/rate limit; bilateral block/revocation; private profiles; no raw data or graph table access; anon denied');
})().catch(e=>{console.error(e);process.exitCode=1});
