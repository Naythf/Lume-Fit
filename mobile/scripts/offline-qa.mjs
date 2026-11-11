import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const path = fileURLToPath(new URL('../src/generated/packaged-web.json', import.meta.url));
createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') { res.writeHead(404).end(); return; }
  const { html } = JSON.parse(readFileSync(path, 'utf8'));
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    // Blocks ALL API/websocket/remote render access, not merely navigator.onLine.
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'",
  });
  res.end(html);
}).listen(8084, '127.0.0.1', () => console.log('QA sem rede: http://127.0.0.1:8084 · connect-src none'));
