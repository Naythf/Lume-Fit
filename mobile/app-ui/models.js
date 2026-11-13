import * as THREE from "../../../design-tools/node_modules/three/build/three.module.js";
// Equipment stays three-dimensional; muscle maps are independent 2D SVGs.
let renderer;
const cache = new Map();
function gearImage(kind) {
  if (cache.has(kind)) return cache.get(kind);
  renderer ??= new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(320, 320);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene(),
    object = new THREE.Group();
  if (kind === "kettlebell") {
    object.add(new THREE.Mesh(new THREE.SphereGeometry(0.48, 40, 24)));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 16, 40));
    handle.position.y = 0.5;
    object.add(handle);
  } else {
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
  object.rotation.y = -0.6;
  object.traverse((o) => {
    if (o.isMesh)
      o.material = new THREE.MeshStandardMaterial({
        color: 0xbfbfbf,
        metalness: 0.1,
        roughness: 0.65,
      });
  });
  const box = new THREE.Box3().setFromObject(object),
    size = box.getSize(new THREE.Vector3()),
    center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
  scene.add(object);
  const camera = new THREE.PerspectiveCamera(31, 1, 0.01, 1000),
    distance =
      (Math.max(size.x, size.y) /
        (2 * Math.tan(THREE.MathUtils.degToRad(31 / 2)))) *
        1.22 +
      size.z;
  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x484848, 2.6));
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(-3, 4, 5);
  scene.add(light);
  const rim = new THREE.DirectionalLight(0xdddddd, 2);
  rim.position.set(3, 2, -3);
  scene.add(rim);
  renderer.render(scene, camera);
  const data = renderer.domElement.toDataURL("image/png");
  cache.set(kind, data);
  object.traverse((o) => {
    if (o.isMesh) {
      o.material.dispose();
      o.geometry.dispose();
    }
  });
  return data;
}
window.trainingGraphic = function (kind) {
  return `<img class="lume-model thumb" data-model-kind="${kind === "kettlebell" ? "kettlebell" : "dumbbell"}" alt="" width="320" height="320">`;
};
window.LumeModels = {
  enhance() {
    document
      .querySelectorAll("img[data-model-kind]:not([data-model-ready])")
      .forEach((img) => {
        img.dataset.modelReady = "loading";
        try {
          img.src = gearImage(
            img.dataset.modelKind === "kettlebell" ? "kettlebell" : "dumbbell",
          );
          img.dataset.modelReady = "true";
        } catch {
          img.replaceWith(
            Object.assign(document.createElement("span"), {
              className: "model-fallback",
              textContent: "Treino",
            }),
          );
        }
      });
  },
};
