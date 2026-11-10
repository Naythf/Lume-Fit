import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { internalUrl, backupBridge, WEB_URL } from './web-host.ts';
test('only the exact HTTPS Lume origin/path stays inside the app', () => {
  assert.equal(internalUrl(WEB_URL), true);
  assert.equal(internalUrl(WEB_URL + '?type=recovery#token'), true);
  for (const url of ['http://naythf.github.io/Lume-Fit/', 'https://naythf.github.io.evil.test/Lume-Fit/', 'https://naythf.github.io/other/', 'file:///data/private', 'javascript:alert(1)', 'https://naythf.github.io/Lume-Fit/../other']) assert.equal(internalUrl(url), false);
});
test('backup bridge preserves the full document without copying it until export is requested', () => {
  const messages: string[] = [];
  const data = { profile: { name: 'Teste isolado' }, routines: [], sessions: [], nutrition: { meals: [{ photo: 'data:image/png;base64,test' }] } };
  const context = { window: { exportData: () => {}, ReactNativeWebView: { postMessage: (s: string) => messages.push(s) } }, state: { db: data } };
  vm.runInNewContext(backupBridge, context);
  assert.equal(messages.length, 0);
  context.window.exportData();
  assert.deepEqual(JSON.parse(JSON.parse(messages[0]).data), data);
  assert.equal(JSON.parse(messages[0]).type, 'lume-backup');
});
