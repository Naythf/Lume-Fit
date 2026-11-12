import * as THREE from "../../../design-tools/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../../design-tools/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "../../../design-tools/node_modules/three/examples/jsm/utils/SkeletonUtils.js";
import model from "./model-data.json";
let base, renderer;
const cache = new Map();
const loader = new GLTFLoader();
const bytes = Uint8Array.from(atob(model.glb), (c) => c.charCodeAt(0));
const ready = loader.parseAsync(bytes.buffer, "").then((g) => {
  base = g.scene;
});
function image(kind = "body", back = false) {
  const key = kind + back;
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
    if (o.isMesh)
      o.material = new THREE.MeshStandardMaterial({
        color: 0xbcc1c9,
        metalness: 0.35,
        roughness: 0.48,
      });
  });
  // Poses are illustrative family thumbnails, never a substitute for an execution video.
  const bone = (name, x = 0, y = 0, z = 0) => {
    const b = object.getObjectByName(name);
    if (b) {
      b.rotation.x += x;
      b.rotation.y += y;
      b.rotation.z += z;
    }
  };
  for (const side of ["l", "r"]) {
    const sign = side === "l" ? 1 : -1;
    if (kind !== "body" && kind !== "raise")
      bone("upperarm_" + side, 0, 0, sign * 0.9);
    if (["curl", "triceps", "press", "pull", "row"].includes(kind))
      bone("lowerarm_" + side, 0, 0, sign * 0.85);
    if (["squat", "legpress", "legs", "bike"].includes(kind)) {
      bone("thigh_" + side, -0.55);
      bone("calf_" + side, 0.8);
    }
    if (["deadlift", "row", "bridge"].includes(kind)) bone("spine_01", 0.35);
    if (["run", "calf"].includes(kind)) bone("thigh_" + side, sign * 0.4);
  }
  const box = new THREE.Box3().setFromObject(object),
    size = box.getSize(new THREE.Vector3()),
    center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
  object.rotation.y = back ? Math.PI : kind === "body" ? -0.28 : -0.6;
  scene.add(object);
  const camera = new THREE.PerspectiveCamera(31, 320 / 380, 0.01, 1000);
  camera.position.set(0, size.y * 0.02, size.y * 2);
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
  object.traverse((o) => {
    if (o.isMesh) o.material.dispose();
  });
  return data;
}
function placeholder(kind = "body", back = false, thumb = false) {
  return `<img class="lume-model ${thumb ? "thumb" : ""}" data-model-kind="${kind}" data-model-back="${back}" alt="${back ? "Vista posterior" : "Modelo corporal 3D"}" width="320" height="380">`;
}
const previousGraphic = window.trainingGraphic;
// Function declarations in classic scripts are on window. Keep custom uploaded icons upstream.
window.trainingGraphic = function (kind) {
  return placeholder(kind || "body", false, true);
};
window.muscleFigure = function (primary = [], secondary = []) {
  return `<div class="model-pair"><figure>${placeholder()}<figcaption>Frente</figcaption></figure><figure>${placeholder("body", true)}<figcaption>Costas</figcaption></figure></div><p class="hint">Modelo 3D ilustrativo. Os grupos principais e auxiliares estão indicados em texto; não representa ativação muscular.</p>`;
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
