const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('updates.js','utf8');
function harness({host='example.test',search='',active=false,modal=false,visible=true,fields=[],dirty=false,reply='bbbbbbbbbbbb',mime='application/json',offline=false}={}){
 const events={},redirects=[],deleted=[],unregistered=[],requests=[];let banner=null;
 const button={addEventListener(type,fn){this[type]=fn}},notice={setAttribute(){},querySelector(){return button}};
 const document={documentElement:{dataset:{release:'aaaaaaaaaaaa'}},visibilityState:visible?'visible':'hidden',activeElement:null,querySelector:()=>modal?{}:null,querySelectorAll:()=>fields,addEventListener(name,fn){events[name]=fn},getElementById:()=>banner,createElement:()=>notice,body:{append(el){banner=el}}};
 const location={hostname:host,href:`https://${host}/app/${search}`,replace:url=>redirects.push(url)};
 const registrations=[{active:{scriptURL:`https://${host}/app/sw.js`},unregister:async()=>unregistered.push('own')},{active:{scriptURL:`https://${host}/other/sw.js`},unregister:async()=>unregistered.push('other')}];
 const caches={keys:async()=>['lume-fit-static-v22','user-data','other-app-cache'],delete:async key=>deleted.push(key)};
 const context={window:{addEventListener(){},caches},navigator:{serviceWorker:{getRegistrations:async()=>registrations}},document,location,URL,Date,state:{activeWorkout:active?{}:null},setInterval(){},caches,lumeConfirm:async()=>false,fetch:async(url,options)=>{requests.push({url:String(url),options});if(offline)throw Error('offline');return {ok:true,headers:{get:()=>mime},json:async()=>({release:reply})}}};
 vm.createContext(context);vm.runInContext(code,context);if(dirty)events.input({target:{matches:()=>true}});
 return {context,document,events,redirects,deleted,unregistered,requests,get banner(){return banner},button,policy:context.window.LumeUpdates};
}
(async()=>{
 // Allow the module's asynchronous initial check and cleanup to finish.
 const settle=()=>new Promise(setImmediate);
 let h=harness();await settle();assert.equal(h.redirects.length,1);assert.equal(new URL(h.redirects[0]).searchParams.get('lume_release'),'bbbbbbbbbbbb');assert.equal(h.requests[0].options.cache,'no-store');assert.ok(h.requests[0].url.startsWith('https://example.test/app/app-version.json?check='));
 h=harness({reply:'aaaaaaaaaaaa'});await settle();assert.equal(h.redirects.length,0);assert.equal(h.banner,null);
 for(const options of [{active:true},{modal:true},{fields:[{tagName:'INPUT',value:'unsaved',getClientRects:()=>[{}]}]},{dirty:true},{search:'?lume_release=bbbbbbbbbbbb'}]){h=harness(options);await settle();assert.equal(h.redirects.length,0);assert.ok(h.banner);await h.button.click();assert.equal(h.redirects.length,options.search?1:0);}
 for(const options of [{visible:false},{offline:true},{mime:'text/html'},{reply:'invalid'}]){h=harness(options);await settle();assert.equal(h.redirects.length,0);assert.equal(h.banner,null);}
 h=harness({host:'preview.chatgpt.site',reply:'aaaaaaaaaaaa'});await settle();assert.deepEqual(h.deleted,['lume-fit-static-v22']);assert.deepEqual(h.unregistered,['own']);
 h=harness({reply:'aaaaaaaaaaaa'});await settle();assert.deepEqual(h.deleted,[]);assert.deepEqual(h.unregistered,[]);
 for(const busy of [true,false])for(const dirty of [true,false])assert.equal(h.context.lumeCanRefresh({visible:true,busy,dirty,attempted:false}),!busy&&!dirty);
 console.log('PASS: release checks, versioned reload, loop guard, draft/workout/dialog safeguards, offline/auth errors and scoped preview cache retirement');
})().catch(error=>{console.error(error);process.exitCode=1});
