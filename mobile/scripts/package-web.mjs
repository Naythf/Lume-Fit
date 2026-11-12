import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(mobile, '..');
const sdk = readFileSync(resolve(mobile, 'vendor/supabase-2.76.1.min.js'), 'utf8');
if (createHash('sha256').update(sdk).digest('hex') !== 'e245f69a1dec7cc7dd0e9391faace7cd72927611ad424d9f2a8f09a985980ec7') throw Error('SDK vendorizado diferente da versão conferida.');
const read = path => readFileSync(resolve(root, path), 'utf8');
const images = ['lume-symbol.png', 'weights-bg.webp', 'icon.svg', 'icon-192.png', 'icon-512.png'];
const inlineImages = value => images.reduce((text, name) => text.replaceAll(name, `data:${name.endsWith('.svg') ? 'image/svg+xml' : name.endsWith('.webp') ? 'image/webp' : 'image/png'};base64,${readFileSync(resolve(root, name)).toString('base64')}`), value);
const sources = [];
let html = read('index.html');
html = html.replace(/<link\b[^>]*rel="manifest"[^>]*>/g, '');
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"?]+)(?:\?[^" ]*)?"[^>]*>/g, (_, path) => {
  if (!/^[\w.-]+\.css$/.test(path)) throw Error('Stylesheet inesperada: ' + path);
  sources.push(path);
  return `<style data-lume-source="${path}">${inlineImages(read(path))}</style>`;
});
html = html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, source) => {
  const path = source.split('?')[0];
  let code;
  if (path === 'updates.js') {
    // Packaged releases update through APK installation, never by navigating to hosted HTML.
    code = `window.LumeUpdates={release:document.documentElement.dataset.release,isPreview:false,check:function(){toast('Atualizações desta versão são instaladas por um novo APK.');}};`;
  } else if (source === 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.76.1/dist/umd/supabase.min.js') {
    code = sdk.replace(/\/\/# sourceMappingURL=.*$/gm, '');
    sources.push('vendor/supabase-2.76.1.min.js');
  } else {
    if (!/^[\w.-]+\.js$/.test(path)) throw Error('Script remoto/inesperado: ' + source);
    code = read(path); sources.push(path);
    if (path === 'app.js') {
      const before = "if ('serviceWorker' in navigator && !location.hostname.endsWith('.chatgpt.site'))";
      if (!code.includes(before)) throw Error('Rever adaptação do service worker.');
      code = code.replace(before, 'if (false)').replace("navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})", 'Promise.resolve({update:function(){}})');
    }
    if (path === 'auth.js') {
      // An expired online session must not delay offline local mode or replace a mode the user already chose.
      const session = 'const {data,error}=await client.auth.getSession();';
      const failure = 'catch(e){showLogin();notify(printError(e));}';
      if (!code.includes(session) || !code.includes(failure)) throw Error('Rever adaptação da inicialização offline.');
      code = code.replace(session, 'const {data,error}=navigator.onLine ? await client.auth.getSession() : {data:{session:null},error:null}; if(demo)return;');
      code = code.replace(failure, 'catch(e){if(!demo){showLogin();notify(printError(e));}}');
    }
  }
  return `<script data-lume-source="${path.startsWith('https:') ? 'supabase-sdk' : path}">${inlineImages(code).replace(/<\/script/gi, '<\\/script')}</script>`;
});
html = inlineImages(html);
const appCss = inlineImages(['glass.css','polish.css'].map(file=>readFileSync(resolve(mobile, 'app-ui',file), 'utf8')).join('\n'));
const appExperience = readFileSync(resolve(mobile, 'app-ui/experience.js'), 'utf8');
const appModels = readFileSync(resolve(mobile, 'app-ui/models.bundle.js'), 'utf8');
html = html.replace('</head>', () => `<style data-lume-app="glass">${appCss}</style></head>`);
html = html.replace('</body>', () => `<script>${appModels.replace(/<\/script/gi,'<\\/script')}</script><script>${appExperience.replace(/<\/script/gi,'<\\/script')}</script></body>`);
const sdkLicense = readFileSync(resolve(mobile, 'vendor/supabase-LICENSE'), 'utf8').replaceAll('--', '- -');
const visualLicenses = ['vendor/three-LICENSE','assets/models/License_Standard.txt'].map(file=>readFileSync(resolve(mobile,file),'utf8').replaceAll('--','- -')).join('\n');
html = html.replace('<head>', () => '<head><!-- Visual assets and renderer licenses:\n'+visualLicenses+' -->');
html = html.replace('<head>', '<head><!-- Supabase JS 2.76.1: ' + sdkLicense + ' --><meta name="lume-packaged" content="LUME_PACKAGED_OFFLINE_V1"><script>window.LUME_PACKAGED=true;</script>');
// No external render assets may escape this build. API calls are still allowed when the user uses online features.
const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
if (/<script\b[^>]*\bsrc=|<link\b[^>]*rel="stylesheet"|<img\b[^>]*src="(?!data:)/i.test(markup)) throw Error('Recurso de apresentação não incorporado.');
if (/url\(\s*["']?(?!data:|#)[^\s"')]+/i.test(markup.match(/<style[\s\S]*?<\/style>/gi)?.join('\n') ?? '')) throw Error('URL CSS não incorporada.');
const result = JSON.stringify({ html, release: JSON.parse(read('app-version.json')).release, sources }, null, 2) + '\n';
const target = resolve(mobile, 'src/generated/packaged-web.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, result);
// Standalone HTML supports offline QA with all connections blocked by a response CSP.
if (process.argv.includes('--qa')) writeFileSync(resolve(mobile, 'src/generated/offline-qa.html'), html);
console.log(`Interface incorporada: ${sources.length} arquivos + imagens; ${Buffer.byteLength(result)} bytes. Nenhum download em runtime para a interface.`);
