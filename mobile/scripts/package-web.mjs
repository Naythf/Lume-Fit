import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(mobile, "..");
const sdk = readFileSync(
  resolve(mobile, "vendor/supabase-2.76.1.min.js"),
  "utf8",
);
if (
  createHash("sha256").update(sdk).digest("hex") !==
  "e245f69a1dec7cc7dd0e9391faace7cd72927611ad424d9f2a8f09a985980ec7"
)
  throw Error("SDK vendorizado diferente da versão conferida.");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const images = [
  "lume-symbol.png",
  "weights-bg.webp",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
];
const inlineImages = (value) =>
  images.reduce(
    (text, name) =>
      text.replaceAll(
        name,
        `data:${name.endsWith(".svg") ? "image/svg+xml" : name.endsWith(".webp") ? "image/webp" : "image/png"};base64,${readFileSync(resolve(root, name)).toString("base64")}`,
      ),
    value,
  );
const sources = [];
let html = read("index.html");
html = html.replace(/<link\b[^>]*rel="manifest"[^>]*>/g, "");
html = html.replace(
  /<link\b[^>]*rel="stylesheet"[^>]*href="([^"?]+)(?:\?[^" ]*)?"[^>]*>/g,
  (_, path) => {
    if (!/^[\w.-]+\.css$/.test(path))
      throw Error("Stylesheet inesperada: " + path);
    sources.push(path);
    return `<style data-lume-source="${path}">${inlineImages(read(path))}</style>`;
  },
);
html = html.replace(
  /<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_, source) => {
    const path = source.split("?")[0];
    let code;
    if (path === "updates.js") {
      // Packaged releases update through APK installation, never by navigating to hosted HTML.
      code = `window.LumeUpdates={release:document.documentElement.dataset.release,isPreview:false,check:function(){toast('Atualizações desta versão são instaladas por um novo APK.');}};`;
    } else if (
      source ===
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.76.1/dist/umd/supabase.min.js"
    ) {
      code = sdk.replace(/\/\/# sourceMappingURL=.*$/gm, "");
      sources.push("vendor/supabase-2.76.1.min.js");
    } else {
      if (!/^[\w.-]+\.js$/.test(path))
        throw Error("Script remoto/inesperado: " + source);
      code = read(path);
      sources.push(path);
      if (path === "exercise-catalog.js")
        code +=
          "\n" + readFileSync(resolve(mobile, "app-ui/planner.js"), "utf8");
      if (path === "app.js") {
        const anchor =
          "out.profile.social=normalizeSocialProfile(out.profile.social);";
        if (!code.includes(anchor))
          throw Error("Rever normalização privada do Meu guia.");
        code =
          readFileSync(resolve(mobile, "app-ui/guide-core.js"), "utf8") +
          "\n" +
          code.replace(
            anchor,
            "out.profile.meuGuia=LumeGuideCore.normalize(out.profile.meuGuia);\n" +
              anchor,
          );
      }
      if (path === "controls.js") {
        const openAnchor =
          "record.popup.hidden=false;attr(record.button,'aria-expanded',true);";
        const hideAnchor = "record.popup.hidden=true;";
        if (!code.includes(openAnchor) || !code.includes(hideAnchor))
          throw Error("Rever portal dos seletores no app.");
        code = code
          .replace(
            openAnchor,
            "(record.button.closest('dialog[open],.sheet.active')||document.body).append(record.popup);" +
              openAnchor,
          )
          .replace(
            hideAnchor,
            hideAnchor +
              "if(record.button.isConnected)record.button.closest('.lume-select').append(record.popup);else record.popup.remove();",
          );
      }
      if (path === "routines.js") {
        code = code
          .replace(
            "ctx.fillStyle='#141414';ctx.fillRect(0,0,128,128);const scale=Math.min(128/bitmap.width,128/bitmap.height)",
            "ctx.clearRect(0,0,128,128);const scale=Math.min(112/bitmap.width,112/bitmap.height)",
          )
          .replace(
            "canvas.toDataURL('image/jpeg',.8)",
            "canvas.toDataURL('image/webp',.85)",
          )
          .replace(
            "trainingVisual({icon:trainingDraft.icon===",
            "trainingVisual({name:trainingDraft.studioName,icon:trainingDraft.icon===",
          )
          .replace(
            "trainingVisual({icon,iconImage:trainingDraft.image})",
            "trainingVisual({name:form.elements.name.value,icon,iconImage:trainingDraft.image})",
          );
      }
      if (path === "automatic-routines.js") {
        const exerciseHead =
          '<div><h3>${esc(c.name)}</h3>${muscleBadges(m)}<small>${esc(equipmentLabel(c))}</small></div></div><p class="auto-reason">';
        if (!code.includes(exerciseHead))
          throw Error("Rever composição do cartão de exercício.");
        code = code
          .replace(
            exerciseHead,
            '<div><h3>${esc(c.name)}</h3></div></div><div class="auto-exercise-meta">${muscleBadges(m)}<small>${esc(equipmentLabel(c))}</small></div><p class="auto-reason">',
          )
          .replace(
            "${prefs.goal==='strength'?90:60} s de intervalo",
            "${LumePlanner.restSeconds(prefs.goal)} s de intervalo",
          )
          .replace(
            "O catálogo é limitado: confira abaixo o que foi incluído.",
            "A escolha considera nível e apoios, evita variantes repetidas e usa o tempo como limite. Confira e ajuste o que foi incluído.",
          );
        code = code
          .replaceAll(
            "O mapa destaca sua escolha.",
            "O mapa acompanha sua seleção.",
          )
          .replaceAll(
            "O mapa mostra os grupos principais incluídos no rascunho, sem medir ativação ou evolução.",
            "O mapa mostra os grupos do rascunho, sem medir ativação ou evolução.",
          );
      }
      if (path === "app.js") {
        const before =
          "if ('serviceWorker' in navigator && !location.hostname.endsWith('.chatgpt.site'))";
        if (!code.includes(before))
          throw Error("Rever adaptação do service worker.");
        code = code
          .replace("<h2>Saber</h2>", "<h2>Guias e ferramentas</h2>")
          .replace(
            "SABER · ENTENDER PARA EVOLUIR",
            "GUIAS · ENTENDER PARA EVOLUIR",
          )
          .replace(before, "if (false)")
          .replace(
            "navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})",
            "Promise.resolve({update:function(){}})",
          );
      }
      if (path === "auth.js") {
        // An expired online session must not delay offline local mode or replace a mode the user already chose.
        const session = "const {data,error}=await client.auth.getSession();";
        const failure = "catch(e){showLogin();notify(printError(e));}";
        if (!code.includes(session) || !code.includes(failure))
          throw Error("Rever adaptação da inicialização offline.");
        code = code.replace(
          session,
          "const {data,error}=navigator.onLine ? await client.auth.getSession() : {data:{session:null},error:null}; if(demo)return;",
        );
        code = code.replace(
          failure,
          "catch(e){if(!demo){showLogin();notify(printError(e));}}",
        );
      }
    }
    return `<script data-lume-source="${path.startsWith("https:") ? "supabase-sdk" : path}">${inlineImages(code).replace(/<\/script/gi, "<\\/script")}</script>`;
  },
);
html = inlineImages(html);
const font =
  "data:font/ttf;base64," +
  readFileSync(resolve(mobile, "assets/fonts/Manrope.ttf")).toString("base64");
const appCss = inlineImages(
  [
    "glass.css",
    "polish.css",
    "studio.css",
    "anatomy-panels.css",
    "responsive.css",
    "guide.css",
    "nutrition.css",
  ]
    .map((file) => readFileSync(resolve(mobile, "app-ui", file), "utf8"))
    .join("\n"),
).replaceAll("__MANROPE_FONT__", font);
const appExperience = readFileSync(
  resolve(mobile, "app-ui/experience.js"),
  "utf8",
);
const appModels = readFileSync(
  resolve(mobile, "app-ui/models.bundle.js"),
  "utf8",
);
const art = JSON.parse(
  readFileSync(resolve(mobile, "assets/exercise-art/manifest.json"), "utf8"),
);
for (const entry of Object.values(art))
  entry.frames = entry.frames.map(
    (file) =>
      "data:image/webp;base64," +
      readFileSync(resolve(mobile, "assets/exercise-art", file)).toString(
        "base64",
      ),
  );
const heroPhoto = (file) =>
  "data:image/webp;base64," +
  readFileSync(resolve(mobile, "assets/hero", file)).toString("base64");
const studioScripts = [
  "studio-context.js",
  "hero-carousel.js",
  "exercise-art.js",
  "studio.js",
  "panels.js",
  "responsive.js",
  "food-restrictions.js",
  "nutrition.js",
  "nutrition-views.js",
  "guide.js",
  "food-routines.js",
  "food-composer.js",
].map((file) =>
  inlineImages(readFileSync(resolve(mobile, "app-ui", file), "utf8"))
    .replaceAll("__HERO_RACK__", heroPhoto("dumbbell-rack.webp"))
    .replaceAll("__HERO_BARBELL__", heroPhoto("barbell-floor.webp"))
    .replaceAll("__HERO_FOOD__", heroPhoto("food-bowl.webp"))
    .replaceAll(
      "__NUTRITION_PLATE__",
      "data:image/webp;base64," +
        readFileSync(
          resolve(mobile, "assets/nutrition/meal-illustration.webp"),
        ).toString("base64"),
    )
    .replaceAll("__HERO_GYM__", heroPhoto("gym-interior.webp")),
);
const anatomy = JSON.parse(
  readFileSync(resolve(mobile, "assets/anatomy/body-map.json"), "utf8"),
);
for (const view of ["front", "back"])
  for (const region of anatomy[view]) {
    if (
      !/^[a-z-]+$/.test(region.muscle) ||
      !region.paths.length ||
      region.paths.some((d) => !/^M[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]+$/.test(d))
    )
      throw Error("Região anatômica inválida.");
  }
const appScripts = [
  appModels,
  "const LUME_ANATOMY_DATA=" + JSON.stringify(anatomy) + ";",
  readFileSync(resolve(mobile, "app-ui/anatomy-map.js"), "utf8"),
  appExperience,
  "const LUME_EXERCISE_ART=" + JSON.stringify(art) + ";",
  ...studioScripts,
];
html = html.replace(
  "</head>",
  () => `<style data-lume-app="glass">${appCss}</style></head>`,
);
html = html.replace(
  "</body>",
  () =>
    appScripts
      .map(
        (code) =>
          `<script>${code.replace(/<\/script/gi, "<\\/script")}</script>`,
      )
      .join("") + "</body>",
);
const sdkLicense = readFileSync(
  resolve(mobile, "vendor/supabase-LICENSE"),
  "utf8",
).replaceAll("--", "- -");
const visualLicenses = [
  "vendor/three-LICENSE",
  "assets/models/License_Standard.txt",
  "assets/exercise-art/LICENSE-DATA.md",
  "assets/exercise-art/ATTRIBUTION.md",
  "assets/fonts/OFL.txt",
  "assets/hero/LICENSE.md",
  "assets/anatomy/LICENSE-Hicham.txt",
  "assets/nutrition/ATTRIBUTION.md",
]
  .map((file) =>
    readFileSync(resolve(mobile, file), "utf8").replaceAll("--", "- -"),
  )
  .join("\n");
html = html.replace(
  "<head>",
  () =>
    "<head><!-- Visual assets and renderer licenses:\n" +
    visualLicenses +
    " -->",
);
html = html.replace(
  "<head>",
  "<head><!-- Supabase JS 2.76.1: " +
    sdkLicense +
    ' --><meta name="lume-packaged" content="LUME_PACKAGED_OFFLINE_V1"><script>window.LUME_PACKAGED=true;</script>',
);
// No external render assets may escape this build. API calls are still allowed when the user uses online features.
const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
if (
  /<script\b[^>]*\bsrc=|<link\b[^>]*rel="stylesheet"|<img\b[^>]*src="(?!data:)/i.test(
    markup,
  )
)
  throw Error("Recurso de apresentação não incorporado.");
if (
  /url\(\s*["']?(?!data:|#)[^\s"')]+/i.test(
    markup.match(/<style[\s\S]*?<\/style>/gi)?.join("\n") ?? "",
  )
)
  throw Error("URL CSS não incorporada.");
const result =
  JSON.stringify(
    { html, release: JSON.parse(read("app-version.json")).release, sources },
    null,
    2,
  ) + "\n";
const target = resolve(mobile, "src/generated/packaged-web.json");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, result);
// Standalone HTML supports offline QA with all connections blocked by a response CSP.
if (process.argv.includes("--qa"))
  writeFileSync(resolve(mobile, "src/generated/offline-qa.html"), html);
console.log(
  `Interface incorporada: ${sources.length} arquivos + imagens; ${Buffer.byteLength(result)} bytes. Nenhum download em runtime para a interface.`,
);
