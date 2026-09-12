<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const props = defineProps({
  // URL of the element's .glb model. Null for elements that don't have one (e.g. Ununennium).
  modelUrl: { type: String, default: null },
  // Element name, used for the canvas's accessible label.
  label: { type: String, default: '' }
});

const containerRef = ref(null);
const canvasRef = ref(null);

/** @type {import('vue').Ref<'loading' | 'ready' | 'error'>} */
const status = ref('loading');
/** @type {import('vue').Ref<number | null>} */
const progress = ref(null);

let renderer, scene, camera, controls, mixer, resizeObserver;

// Set on unmount so a download that finishes after the dialog closes is thrown away.
let disposed = false;

const resize = () =>
{
  const { clientWidth: width, clientHeight: height } = containerRef.value;
  if (!width || !height) return;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

// The models aren't all the same size or centred on the origin, so frame each one
// from its bounds instead of using a fixed camera position. The orbits lie flat, so
// fit their width; a bounding sphere would leave half the canvas empty.
const fitCameraToObject = object =>
{
  const box = new THREE.Box3().setFromObject(object);
  object.position.sub(box.getCenter(new THREE.Vector3()));

  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.z) / 2;
  const distance = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.25;

  camera.position.set(0, 0.35, 1).normalize().multiplyScalar(distance);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.minDistance = radius;
  controls.maxDistance = distance * 3;
  controls.update();
};

const disposeObject = object =>
{
  object.traverse(child =>
  {
    if (!child.isMesh) return;

    child.geometry.dispose();
    child.skeleton?.dispose();

    for (const material of [child.material].flat())
    {
      Object.values(material).forEach(value => value?.isTexture && value.dispose());
      material.dispose();
    }
  });
};

onMounted(() =>
{
  if (!props.modelUrl) return;

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(containerRef.value);
  resize();

  let lastTime = null;
  renderer.setAnimationLoop(time =>
  {
    const delta = lastTime === null ? 0 : (time - lastTime) / 1000;
    lastTime = time;

    mixer?.update(delta);
    controls.update();
    renderer.render(scene, camera);
  });

  new GLTFLoader().load(
    props.modelUrl,
    gltf =>
    {
      if (disposed)
      {
        disposeObject(gltf.scene);
        return;
      }

      scene.add(gltf.scene);

      // Each model ships with a looping animation of its electrons orbiting.
      mixer = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach(clip => mixer.clipAction(clip).play());

      fitCameraToObject(gltf.scene);
      status.value = 'ready';
    },
    event =>
    {
      if (event.lengthComputable) progress.value = Math.round(event.loaded / event.total * 100);
    },
    error =>
    {
      if (disposed) return;

      console.error(`Failed to load Bohr model from ${props.modelUrl}`, error);
      status.value = 'error';
    }
  );
});

onUnmounted(() =>
{
  disposed = true;
  if (!renderer) return;

  renderer.setAnimationLoop(null);
  resizeObserver.disconnect();
  controls.dispose();
  mixer?.stopAllAction();
  disposeObject(scene);
  renderer.dispose();

  // Browsers cap live WebGL contexts, so release this one now rather than on GC.
  renderer.forceContextLoss();
});
</script>

<template>
  <div ref="containerRef" class="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
    <template v-if="modelUrl">
      <canvas
        ref="canvasRef"
        class="block h-full w-full cursor-grab active:cursor-grabbing"
        role="img"
        :aria-label="label ? `3D Bohr model of ${label}` : '3D Bohr model'"
      ></canvas>

      <p
        v-if="status === 'loading'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-300"
      >
        Loading model{{ progress === null ? '…' : ` ${progress}%` }}
      </p>
      <p
        v-else-if="status === 'error'"
        class="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-slate-300"
      >
        Couldn't load the 3D model.
      </p>
    </template>

    <p
      v-else
      class="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-slate-300"
    >
      No 3D model is available for this element.
    </p>
  </div>
</template>
