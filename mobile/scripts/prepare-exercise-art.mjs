// Deterministic pixel processing expressly authorized by the user. No generative processing.
import fs from "node:fs";
import path from "node:path";
import sharp from "../../../design-tools/node_modules/sharp/dist/index.mjs";
const mobile = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(
  fs.readFileSync(path.resolve(mobile, "../../asset-research/repdb.json")),
).exercises;
const ids = [
  "bench-press",
  "incline-bench-press",
  "db-bench-press",
  "dumbbell-floor-press",
  "push-up",
  "knee-push-ups",
  "wall-push-ups",
  "close-grip-push-ups",
  "bodyweight-squat",
  "db-goblet-squat",
  "bodyweight-reverse-lunge",
  "glute-bridge",
  "bodyweight-calf-raise",
  "dumbbell-calf-raise",
  "dead-bug",
  "bird-dog",
  "crunches",
  "bent-over-db-row",
  "barbell-row",
  "romanian-deadlift",
  "dumbbell-romanian-deadlift",
  "pull-up",
  "chin-ups",
  "lat-pulldown",
  "leg-press",
  "leg-curl",
  "leg-extension",
  "lateral-raise",
  "arnold-press",
  "dumbbell-shoulder-press",
  "bicep-curl",
  "tricep-pushdown",
  "dumbbell-tricep-extension",
  "cable-curl",
  "chest-supported-machine-row",
  "seated-cable-row",
  "chest-press-machine",
  "plank",
  "running",
  "cycling",
  "kettlebell-deadlift",
];
const out = path.resolve(mobile, "assets/exercise-art");
fs.mkdirSync(out, { recursive: true });
function cutBackground(buffer, width, height) {
  const corners = [
    0,
    (width - 1) * 4,
    (height - 1) * width * 4,
    (width * height - 1) * 4,
  ];
  const bg = [0, 1, 2].map(
    (c) => corners.map((i) => buffer[i + c]).sort((a, b) => a - b)[2],
  );
  const seen = new Uint8Array(width * height),
    queue = new Int32Array(width * height);
  let head = 0,
    tail = 0;
  const push = (p) => {
    if (seen[p]) return;
    seen[p] = 1;
    const i = p * 4;
    const distance = Math.hypot(
      buffer[i] - bg[0],
      buffer[i + 1] - bg[1],
      buffer[i + 2] - bg[2],
    );
    if (distance < 30) {
      queue[tail++] = p;
      buffer[i + 3] = 0;
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (head < tail) {
    const p = queue[head++],
      x = p % width,
      y = Math.floor(p / width);
    if (x) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (y) push(p - width);
    if (y < height - 1) push(p + width);
  }
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    if (
      Math.hypot(
        buffer[i] - bg[0],
        buffer[i + 1] - bg[1],
        buffer[i + 2] - bg[2],
      ) < 15
    )
      buffer[i + 3] = 0;
  }
  return buffer;
}
const manifest = {};
for (const id of ids) {
  const e = data.find((e) => e.id === id);
  if (!e) {
    console.log("Sem correspondência: " + id);
    continue;
  }
  const frames = [];
  for (const [pose, relative] of Object.entries(e.images.flat)) {
    // These source pairs are inconsistent or duplicate positions; ship only the verified reference.
    if (pose === "peak" && ["incline-bench-press", "leg-press"].includes(id))
      continue;
    const response = await fetch(
      "https://raw.githubusercontent.com/RepDB/exercise-dataset/main/" +
        relative,
    );
    if (!response.ok) throw Error(id + " " + response.status);
    const { data: rgba, info } = await sharp(
      Buffer.from(await response.arrayBuffer()),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const file = id + "-" + pose + ".webp";
    await sharp(cutBackground(rgba, info.width, info.height), {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim({ background: "#00000000", threshold: 3 })
      .resize(384, 384, { fit: "contain", background: "#00000000" })
      .webp({ quality: 85, alphaQuality: 100 })
      .toFile(path.join(out, file));
    frames.push(file);
  }
  manifest[id] = {
    name: e.name_en,
    frames,
    primary: e.primary_muscles,
    equipment: e.equipment || "bodyweight",
  };
  console.log(id + " " + frames.length);
}
fs.writeFileSync(
  path.join(out, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);
for (const file of ["LICENSE-DATA.md", "ATTRIBUTION.md"]) {
  const r = await fetch(
    "https://raw.githubusercontent.com/RepDB/exercise-dataset/main/" + file,
  );
  fs.writeFileSync(path.join(out, file), await r.text());
}
