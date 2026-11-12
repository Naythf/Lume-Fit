import * as THREE from "../../../design-tools/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../../design-tools/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "../../../design-tools/node_modules/three/examples/jsm/utils/SkeletonUtils.js";
import model from "./model-data.json";
import { safeModelKind } from "./model-kind.js";
import { muscleZone } from "./muscle-zones.js";
let base, renderer;
const cache = new Map();
const loader = new GLTFLoader();
const bytes = Uint8Array.from(atob(model.glb), (c) => c.charCodeAt(0));
const ready = loader.parseAsync(bytes.buffer, "").then((g) => {
  base = g.scene;
});
function image(kind = "body", back = false, primary = [], secondary = []) {
  const key = JSON.stringify([kind, back, primary, secondary]);
  if (cache.has(key)) return cache.get(key);
  renderer ??= new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(320, 380);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(),
    object = ["dumbbell", "kettlebell"].includes(kind)
      ? new THREE.Group()
      : clone(base);
  if (kind === "dumbbell") {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 1.5, 24),
    );
    shaft.rotation.z = Math.PI / 2;
    object.add(shaft);
    for (const side of [-1, 1])
      for (const [x, r] of [
        [0.42, 0.36],
        [0.58, 0.31],
        [0.7, 0.24],
      ]) {
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, 0.13, 40),
        );
        plate.rotation.z = Math.PI / 2;
        plate.position.x = side * x;
        object.add(plate);
      }
    object.rotation.z = -0.45;
  }
  if (kind === "kettlebell") {
    object.add(new THREE.Mesh(new THREE.SphereGeometry(0.48, 40, 24)));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 16, 40));
    handle.position.y = 0.5;
    object.add(handle);
  }
  object.traverse((o) => {
    if (!o.isMesh) return;
    const colored = kind === "body" && o.name === "SuperHero_Male";
    if (colored) {
      o.geometry = o.geometry.clone();
      const positions = o.geometry.attributes.position,
        colors = new Float32Array(positions.count * 3);
      o.geometry.computeBoundingBox();
      const bounds = o.geometry.boundingBox,
        h = bounds.max.y - bounds.min.y;
      for (let i = 0; i < positions.count; i++) {
        const zone = muscleZone(
          positions.getX(i) / h,
          (positions.getY(i) - bounds.min.y) / h,
          positions.getZ(i),
        );
        const color = new THREE.Color(
          primary.includes(zone)
            ? 0xff202b
            : secondary.includes(zone)
              ? 0xff8b7c
              : 0xa5abb4,
        );
        colors.set([color.r, color.g, color.b], i * 3);
      }
      o.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
    o.material = new THREE.MeshStandardMaterial({
      color: colored ? 0xffffff : 0xbcc1c9,
      vertexColors: colored,
      metalness: 0,
      roughness: 0.78,
    });
  });
  const box = new THREE.Box3().setFromObject(object),
    size = box.getSize(new THREE.Vector3()),
    center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
  object.rotation.y = back ? Math.PI : kind === "body" ? -0.28 : -0.6;
  scene.add(object);
  const camera = new THREE.PerspectiveCamera(31, 320 / 380, 0.01, 1000);
  const distance =
    Math.max(
      size.y / (2 * Math.tan(THREE.MathUtils.degToRad(31 / 2))),
      size.x / (2 * Math.tan(THREE.MathUtils.degToRad(31 / 2)) * camera.aspect),
    ) *
      1.17 +
    size.z;
  camera.position.set(0, size.y * 0.02, distance);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x484c59, 2.6));
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(-3, 4, 5);
  scene.add(light);
  const rim = new THREE.DirectionalLight(0xb4bfda, 2);
  rim.position.set(3, 2, -3);
  scene.add(rim);
  renderer.render(scene, camera);
  const data = renderer.domElement.toDataURL("image/png");
  cache.set(key, data);
  if (cache.size > 64) cache.delete(cache.keys().next().value);
  object.traverse((o) => {
    if (o.isMesh) {
      o.material.dispose();
      if (kind === "body" && o.name === "SuperHero_Male") o.geometry.dispose();
    }
  });
  return data;
}
function placeholder(
  kind = "body",
  back = false,
  thumb = false,
  primary = [],
  secondary = [],
) {
  kind = safeModelKind(kind);
  const allowed = (keys) =>
    (Array.isArray(keys) ? keys : [keys])
      .filter((k) => Object.hasOwn(MUSCLE_GROUPS, k))
      .join(",");
  return `<img class="lume-model ${thumb ? "thumb" : ""}" data-model-kind="${kind}" data-model-back="${back}" data-model-primary="${allowed(primary)}" data-model-secondary="${allowed(secondary)}" alt="${back ? "Vista posterior" : "Modelo corporal 3D"}" width="320" height="380">`;
}
const previousGraphic = window.trainingGraphic;
// Function declarations in classic scripts are on window. Keep custom uploaded icons upstream.
window.trainingGraphic = function (kind) {
  return placeholder(kind || "body", false, true);
};
window.muscleFigure = function (primary = [], secondary = []) {
  const labels = (keys) =>
    (Array.isArray(keys) ? keys : [keys])
      .filter((key) => Object.hasOwn(MUSCLE_GROUPS, key))
      .map((key) => MUSCLE_GROUPS[key])
      .join(", ");
  return `<div class="model-pair"><figure>${placeholder("body", false, false, primary, secondary)}<figcaption>Frente</figcaption></figure><figure>${placeholder("body", true, false, primary, secondary)}<figcaption>Costas</figcaption></figure></div><p class="model-focus-legend"><i></i><strong>${labels(primary) || "Selecione um grupo"}.</strong>${labels(secondary) ? " Auxiliares: " + labels(secondary) + "." : ""} Regiões esquemáticas; não medem ativação muscular.</p>`;
};
window.LumeModels = {
  enhance() {
    document
      .querySelectorAll("img[data-model-kind]:not([data-model-ready])")
      .forEach((img) => {
        img.dataset.modelReady = "loading";
        ready
          .then(() => {
            if (img.isConnected) {
              img.src = image(
                img.dataset.modelKind,
                img.dataset.modelBack === "true",
                (img.dataset.modelPrimary || "").split(","),
                (img.dataset.modelSecondary || "").split(","),
              );
              img.dataset.modelReady = "true";
            }
          })
          .catch(() => {
            img.replaceWith(
              Object.assign(document.createElement("p"), {
                className: "model-fallback",
                textContent:
                  "Visual 3D indisponível neste aparelho. Consulte os grupos e a descrição abaixo.",
              }),
            );
          });
      });
  },
};
void previousGraphic;
