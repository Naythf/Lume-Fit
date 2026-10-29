const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require(process.env.LUME_PGLITE_MODULE||'@electric-sql/pglite');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 await db.exec(fs.readFileSync('supabase-schema.sql','utf8'));await db.exec(fs.readFileSync('migrations/20261029-profile-privacy.sql','utf8'));await db.exec(fs.readFileSync('migrations/20261029-profile-privacy.sql','utf8'));
 const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';await db.query('insert into auth.users values($1),($2)',[a,b]);
 const now=new Date(),date=now.toISOString();const sessions=[{name:'Treino A',date,entries:[{name:'Segredo',sets:[{kg:999,reps:4}]}]},{name:'Treino B',date},{name:'Invalid',date:'2026-02-30T12:00:00Z'},{name:'Future',date:'2999-01-01T12:00:00Z'}];
 await db.query('insert into public.user_data(user_id,data) values($1,$2)',[a,JSON.stringify({profile:{weight:99,height:190,sex:'secret',photo:'secret'},sessions})]);
 const asUser=async(id,fn,role='authenticated')=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id||'']);await tx.exec('set local role '+role);return fn(tx)});
 const save=(tx,name='carlos_01',audience='private',flags=false)=>tx.query('select public.lume_save_profile($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as profile',[name,'Carlos','Bio privada','data:image/png;base64,YWJj',audience,flags,flags,flags,flags,flags]);
 await asUser(a,tx=>save(tx));
 assert.equal((await asUser(b,tx=>tx.query('select * from public.lume_profiles'))).rows.length,0);
 assert.equal((await asUser(b,tx=>tx.query("select public.lume_get_profile('carlos_01') as profile"))).rows[0].profile,null);
 assert.equal((await asUser(b,tx=>tx.query('select * from public.user_data'))).rows.length,0);
 await assert.rejects(asUser(b,tx=>save(tx,'CARLOS_01')),e=>e.code==='23505');
 assert.equal((await asUser(b,tx=>tx.query("update public.lume_profiles set audience='members' where user_id=$1 returning user_id",[a]))).rows.length,0);
 await assert.rejects(asUser(b,tx=>tx.query('insert into public.lume_profiles(user_id,username,display_name) values($1,$2,$3)',[a,'intruder','X'])),e=>['42501','23505'].includes(e.code));
 await asUser(a,tx=>save(tx,'carlos_01','members',false));
 let result=(await asUser(b,tx=>tx.query("select public.lume_get_profile('carlos_01') as profile"))).rows[0].profile;
 assert.deepEqual(Object.keys(result).sort(),['displayName','username']); // Hidden photo/bio are inaccessible even though stored.
 assert.equal((await asUser(b,tx=>tx.query('select * from public.lume_profiles'))).rows.length,0);
 await asUser(a,tx=>save(tx,'carlos_01','members',true));
 result=(await asUser(b,tx=>tx.query("select public.lume_get_profile('carlos_01') as profile"))).rows[0].profile;
 assert.equal(result.weeklyDays,1);assert.equal(result.monthlyDays,1);assert.equal(result.workouts.length,2);assert.deepEqual(Object.keys(result.workouts[0]).sort(),['date','name']);assert.ok(!JSON.stringify(result).includes('999'));assert.ok(!Object.hasOwn(result,'weight'));assert.ok(!Object.hasOwn(result,'user_id'));
 await asUser(a,tx=>save(tx,'carlos_01','private',true));assert.equal((await asUser(b,tx=>tx.query("select public.lume_get_profile('carlos_01') as profile"))).rows[0].profile,null);
 for(const sql of ["select public.lume_get_profile('carlos_01')","select public.lume_my_profile()","select * from public.lume_profiles","select lume_private.profile_projection('carlos_01')"]){await assert.rejects(asUser(null,tx=>tx.query(sql),'anon'),e=>e.code==='42501');}
 await assert.rejects(asUser(a,tx=>tx.query("select lume_private.session_time('2026-01-01T00:00:00Z')")),e=>e.code==='42501');
 await assert.rejects(asUser(null,tx=>save(tx)),e=>e.code==='42501');await assert.rejects(asUser(a,tx=>save(tx,'bad-name')),e=>e.code==='23514');
 await db.close();console.log('PASS: PostgreSQL migration twice; username uniqueness; RLS owner isolation; anon denied; hidden fields, raw history and measurements never projected; flags, invalid/future dates and privacy revocation');
})().catch(error=>{console.error(error);process.exitCode=1});
