/* Deterministic public release stamp. Never hash or publish configuration values. */
const fs=require('node:fs'),crypto=require('node:crypto');
const normalize=text=>text.replace(/\?v=[a-f0-9]{12}/g,'').replace(/data-release="[a-f0-9]{12}"/g,'data-release=""');
const files=fs.readdirSync('.').filter(name=>/\.(?:html|js|css|svg|png|webp|webmanifest)$/.test(name)&&name!=='config.js').sort();
const hash=crypto.createHash('sha256');for(const name of files){hash.update(name+'\0');const bytes=fs.readFileSync(name);hash.update(name==='index.html'?normalize(bytes.toString()):bytes);}
const release=hash.digest('hex').slice(0,12);let html=normalize(fs.readFileSync('index.html','utf8'));
html=html.replace(/data-release=""/,`data-release="${release}"`).replace(/(src|href)="((?:\.\/)?[\w.-]+\.(?:js|css))"/g,(_,attr,path)=>`${attr}="${path}?v=${release}"`);
const manifest=JSON.stringify({release})+'\n';
if(process.argv.includes('--check')){if(html!==fs.readFileSync('index.html','utf8')||!fs.existsSync('app-version.json')||manifest!==fs.readFileSync('app-version.json','utf8')){console.error('Release desatualizada. Rode node prepare-release.cjs antes de publicar.');process.exit(1);}}
else{fs.writeFileSync('index.html',html);fs.writeFileSync('app-version.json',manifest);}
console.log(`Release ${release}`);
