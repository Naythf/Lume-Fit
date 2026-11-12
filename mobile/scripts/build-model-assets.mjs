// Rebuild with: node scripts/build-model-assets.mjs (esbuild + three in work/design-tools).
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { build } from "../../../design-tools/node_modules/esbuild/lib/main.js";
const mobile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const folder = resolve(mobile, "assets/models");
const g = JSON.parse(
  fs.readFileSync(resolve(folder, "Superhero_Male_FullBody.gltf")),
);
// Neutral studio material, no remote textures or image decoder dependency.
delete g.images;
delete g.textures;
delete g.samplers;
delete g.materials;
for (const mesh of g.meshes) for (const p of mesh.primitives) delete p.material;
const bin = fs.readFileSync(resolve(folder, g.buffers[0].uri));
delete g.buffers[0].uri;
let json = Buffer.from(JSON.stringify(g));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)]);
const binary = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + binary.length, 8);
const chunk = (buffer, type) => {
  const h = Buffer.alloc(8);
  h.writeUInt32LE(buffer.length, 0);
  h.writeUInt32LE(type, 4);
  return Buffer.concat([h, buffer]);
};
fs.writeFileSync(
  resolve(mobile, "app-ui/model-data.json"),
  JSON.stringify({
    glb: Buffer.concat([
      header,
      chunk(json, 0x4e4f534a),
      chunk(binary, 0x004e4942),
    ]).toString("base64"),
  }),
);
await build({
  entryPoints: [resolve(mobile, "app-ui/models.js")],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: resolve(mobile, "app-ui/models.bundle.js"),
  legalComments: "eof",
});
