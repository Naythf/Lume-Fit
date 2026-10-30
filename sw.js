const CACHE = 'lume-fit-static-v32-exercise-progress';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './experience.css',
  './experience.js',
  './routines.js',
  './personalization.js',
  './personalization.css',
  './exercise-catalog.js',
  './automatic-routines.js',
  './automatic-routines.css',
  './frequency.js',
  './exercise-progress.js',
  './exercise-progress.css',
  './frequency.css',
  './controls.js',
  './controls.css',
  './friends.js',
  './friends.css',
  './social-profile.js',
  './social-profile.css',
  './guided-workout.js',
  './guided-workout.css',
  './updates.js',
  './motion.js',
  './motion.css',
  './motion-preference.js',
  './motion-preference.css',
  './auth.js',
  './config.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './lume-symbol.png',
  './weights-bg.webp'
];
const IS_PREVIEW=new URL(self.location.href).hostname.endsWith('.chatgpt.site');
const APP_ROOT=new URL('./',self.location.href);
const APP_ASSETS=new Set(ASSETS.map(path=>new URL(path,APP_ROOT).href));
function lumeAssetKey(value){const url=new URL(value);url.search='';url.hash='';return APP_ASSETS.has(url.href)?url.href:null;}
async function lumeCacheable(response,key){
 if(!response.ok||response.redirected)return false;
 const path=new URL(key).pathname,type=response.headers.get('content-type')||'';
 if(/\.js$/.test(path))return /(?:javascript|ecmascript)/i.test(type);
 if(/\.css$/.test(path))return /text\/css/i.test(type);
 if(/\.(?:png|webp|svg)$/.test(path))return /^image\//i.test(type);
 if(/\.webmanifest$/.test(path))return /(?:json|manifest)/i.test(type);
 return /text\/html/i.test(type)&&(await response.clone().text()).includes('id="mainContent"');
}
async function lumeNetworkFirst(request,key){
 try{
  const response=await fetch(new Request(request,{cache:'no-cache'}));
  if(response.status===401||response.status===403)return response;
  if(!response.ok)throw new Error('Asset unavailable');
  if(await lumeCacheable(response,key)){const cache=await caches.open(CACHE);try{await cache.put(key,response.clone());}catch{}}
  return response;
 }catch{
  const cache=await caches.open(CACHE),saved=await cache.match(key);
  if(saved&&await lumeCacheable(saved,key))return saved;
  return new Response('Sem conexão. Reabra o aplicativo quando a conexão voltar.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
 }
}
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  if(IS_PREVIEW){await self.skipWaiting();return;}
  const cache=await caches.open(CACHE);
  await Promise.all([...APP_ASSETS].map(async key=>{const response=await fetch(new Request(key,{cache:'reload'}));if(!await lumeCacheable(response,key))throw new Error('Invalid app asset');await cache.put(key,response);}));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('lume-fit-static-')&&(IS_PREVIEW||key!==CACHE)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()).then(()=>IS_PREVIEW?self.registration.unregister():undefined));
});
self.addEventListener('fetch',event=>{
 if(IS_PREVIEW||event.request.method!=='GET')return;
 const key=lumeAssetKey(event.request.url);if(!key)return;
 event.respondWith(lumeNetworkFirst(event.request,key));
});
