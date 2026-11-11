import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const { html, sources } = JSON.parse(readFileSync(new URL('../src/generated/packaged-web.json', import.meta.url), 'utf8'));
test('first render has no external scripts, styles or images', () => {
  assert.ok(html.includes('LUME_PACKAGED_OFFLINE_V1'));
  const markup = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  assert.doesNotMatch(markup, /<link[^>]+(?:stylesheet|manifest)/i);
  assert.doesNotMatch(html, /<script\b[^>]*\ssrc=/i);
  assert.doesNotMatch(markup, /<img[^>]+src="(?!data:)/i);
  assert.ok(sources.includes('food-diary.js') && sources.includes('motion.js') && sources.includes('guided-workout.js'));
  assert.ok(html.includes('data:image/webp;base64,'));
});
test('packaged scripts parse, SDK is present without CDN, hosted updater/SW are disabled', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  assert.ok(scripts.length > 15);
  for (const code of scripts) assert.doesNotThrow(() => new vm.Script(code));
  assert.ok(sources.includes('vendor/supabase-2.76.1.min.js'));
  assert.ok(html.includes('Permission is hereby granted, free of charge'));
  assert.doesNotMatch(html, /navigator\.serviceWorker\.register/); // no background hosted update path
  assert.ok(html.includes('Atualizações desta versão são instaladas por um novo APK.'));
});
test('native startup uses included HTML while retaining the previous storage base URL', () => {
  const source = readFileSync(new URL('../src/screens/web-app.tsx', import.meta.url), 'utf8');
  assert.match(source, /source=\{\{ html: packaged\.html, baseUrl: WEB_URL \}\}/);
  assert.doesNotMatch(source, /source=\{\{ uri: WEB_URL/);
});
