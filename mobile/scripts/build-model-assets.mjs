// Offline equipment renderer only. Body diagrams are locally embedded vector paths.
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { build } from "../../../design-tools/node_modules/esbuild/lib/main.js";
const mobile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await build({
  entryPoints: [resolve(mobile, "app-ui/models.js")],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: resolve(mobile, "app-ui/models.bundle.js"),
  legalComments: "eof",
});
