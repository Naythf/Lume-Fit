import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {safeModelKind} from '../app-ui/model-kind.js';
test('imported icon values cannot introduce attributes into model markup',()=>{
  assert.equal(safeModelKind('squat'),'squat');
  for(const value of ['\" onerror=alert(1) x=\"','<script>alert(1)</script>',null,{},'unknown'])assert.equal(safeModelKind(value),'body');
});
const source = readFileSync(
  new URL("../app-ui/experience.js", import.meta.url),
  "utf8",
);
const context = vm.createContext({ URL });
vm.runInContext(
  source.slice(0, source.indexOf("function lumeGuide(")),
  context,
);
const valid = (url) =>
  vm.runInContext(`lumeVideo(${JSON.stringify(url)})`, context);
test("video references accept real provider paths and reject deceptive origins or scripts", () => {
  for (const url of [
    "https://youtu.be/M7lc1UVf-VE",
    "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    "https://www.tiktok.com/@example/video/1234567890123",
    "https://www.instagram.com/reel/Example_123/",
  ])
    assert.ok(valid(url));
  for (const url of [
    "javascript:alert(1)",
    "http://youtu.be/M7lc1UVf-VE",
    "https://youtube.com.evil.test/watch?v=M7lc1UVf-VE",
    "https://youtube.com@evil.test/watch?v=M7lc1UVf-VE",
    "https://user:secret@www.youtube.com/watch?v=M7lc1UVf-VE",
    "https://www.youtube.com/channel/example",
    "https://www.instagram.com/direct/inbox/",
    "https://evil.test",
  ])
    assert.equal(valid(url), "");
});
test("packaged visual sources stay exclusive to the app and retain full upstream web assets", () => {
  const { html, sources } = JSON.parse(
    readFileSync(
      new URL("../src/generated/packaged-web.json", import.meta.url),
    ),
  );
  assert.ok(
    html.includes('data-lume-app="glass"') &&
      html.includes("Seu progresso em números") &&
      html.includes("Foco muscular e aparência"),
  );
  assert.ok(
    sources.includes("guided-workout.js") && sources.includes("food-diary.js"),
  );
  assert.ok(
    !readFileSync(
      new URL("../../index.html", import.meta.url),
      "utf8",
    ).includes("app-ui/"),
  );
});
