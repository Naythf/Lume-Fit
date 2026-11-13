import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const path = fileURLToPath(
  new URL("../src/generated/packaged-web.json", import.meta.url),
);
const port = Number(process.env.LUME_QA_PORT || 8084);
createServer((req, res) => {
  if (req.url !== "/" && req.url !== "/index.html") {
    res.writeHead(404).end();
    return;
  }
  const { html } = JSON.parse(readFileSync(path, "utf8"));
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    // Blocks ALL API/websocket/remote render access, not merely navigator.onLine.
    "Content-Security-Policy":
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'",
  });
  // QA-only legacy WebView fallback: exercise the same portal without Popover API.
  res.end(
    process.env.LUME_QA_LEGACY_SELECTS === "1"
      ? html.replace("typeof record.popup.showPopover==='function'", "false")
      : html,
  );
}).listen(port, "127.0.0.1", () =>
  console.log(`Prévia sem rede: http://127.0.0.1:${port} · connect-src none`),
);
