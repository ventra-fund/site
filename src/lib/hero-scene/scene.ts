import { PerspectiveCamera, Scene, Vector2, WebGLRenderer } from "three";
import { createAtmosphere } from "./atmosphere";
import { parseGlb } from "./glb";
import { createLogo, LOGO_CENTER, LOGO_WIDTH } from "./logo";
import { bakeNoise } from "./noise";
import { createPodium } from "./podium";
import { createSky } from "./sky";
import type { SharedUniforms } from "./shared";

// The home page hero's 3D scene. Loaded on demand by src/components/HeroScene.astro, after the page
// has finished loading, so none of this (or three.js) is on the critical path.

export interface HeroSceneOptions {
  /** The backdrop element; the canvas goes in as its first child, under the legibility washes. */
  root: HTMLElement;
  /** The hero copy, measured so the stage sits in the space it leaves free. */
  copy: HTMLElement | null;
  /** The logo GLB, already being downloaded in parallel with this module. */
  logo: Promise<ArrayBuffer>;
  reducedMotion: boolean;
}

/** Retina sharpness costs 4x the pixels of 1x; the scene is mostly soft light and fog, so 1.5 is plenty. */
const MAX_PIXEL_RATIO = 1.5;
const FOV = 24;
/** Camera elevation: a little above the logo, looking slightly down onto the podium. */
const ELEVATION = 0.09;
/** How far the camera swings with the cursor (radians). */
const PARALLAX = { azimuth: 0.14, elevation: 0.07 };
/** Same breakpoint as the CSS: below it the copy moves under the stage. */
const STACKED = "(max-aspect-ratio: 9/10)";
const INTRO_SECONDS = 1.6;
/** After this long without input the scene drops to 30 fps. */
const IDLE_AFTER_MS = 4000;

export async function mountHeroScene({ root, copy, logo, reducedMotion }: HeroSceneOptions): Promise<void> {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: "default" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  const canvas = renderer.domElement;

  const camera = new PerspectiveCamera(FOV, 1, 0.5, 80);
  const pointer = new Vector2(); // where the cursor is now
  const shared: SharedUniforms = {
    uTime: { value: reducedMotion ? 24 : 0 },
    uNoise: { value: bakeNoise(renderer, camera) },
    uPointer: { value: new Vector2() }, // eased toward `pointer`
    uStage: { value: LOGO_CENTER.clone() },
  };

  const scene = new Scene();
  const sky = createSky(shared);
  scene.add(sky.mesh, createAtmosphere(shared), createPodium(shared));
  const logoMesh = createLogo(parseGlb(await logo), shared);
  scene.add(logoMesh);

  // ---- layout: size the canvas and frame the stage in the space the copy leaves ----

  const stacked = window.matchMedia(STACKED);
  const frame = { x: 0, y: 0, logoPx: 1 };
  let width = 0;
  let height = 0;

  function layout() {
    width = Math.max(root.clientWidth, 1);
    height = Math.max(root.clientHeight, 1);
    renderer.setSize(width, height, false);
    renderer.getDrawingBufferSize(sky.resolution);
    camera.aspect = width / height;

    const box = root.getBoundingClientRect();
    const text = copy?.getBoundingClientRect();
    if (!stacked.matches) {
      // landscape: a little left of centre in the space right of the copy
      const left = text ? text.right - box.left + 24 : width * 0.5;
      const free = Math.max(width - left, width * 0.3);
      frame.x = left + free * 0.45;
      frame.y = height * 0.44;
      frame.logoPx = Math.min(height * 0.36, free * 0.46);
    } else {
      // portrait: centred in the space above the copy, the podium allowed to bleed past the sides.
      // The stage runs from 0.3 logo widths above the logo's centre to ~0.84 below it (podium and fog),
      // so the logo sits 0.27 widths above the middle of that space.
      const free = Math.max((text ? text.top - box.top : height * 0.55) - 24, height * 0.3);
      frame.x = width / 2;
      frame.logoPx = Math.min(width * 0.6, free * 0.62);
      frame.y = 12 + free / 2 - 0.27 * frame.logoPx;
    }
  }

  function placeCamera() {
    const distance = (LOGO_WIDTH * height) / (2 * Math.tan((FOV * Math.PI) / 360) * frame.logoPx);
    const azimuth = shared.uPointer.value.x * PARALLAX.azimuth;
    const elevation = ELEVATION + shared.uPointer.value.y * PARALLAX.elevation;
    camera.position.set(
      LOGO_CENTER.x + distance * Math.sin(azimuth) * Math.cos(elevation),
      LOGO_CENTER.y + distance * Math.sin(elevation),
      LOGO_CENTER.z + distance * Math.cos(azimuth) * Math.cos(elevation),
    );
    camera.lookAt(LOGO_CENTER);
    // shift the projection so the logo lands on frame.x/frame.y instead of the canvas centre
    camera.setViewOffset(width, height, width / 2 - frame.x, height / 2 - frame.y, width, height);
  }

  // ---- animation ----

  let intro = reducedMotion ? 1 : 0;
  function update(dt: number) {
    if (!reducedMotion) shared.uTime.value += dt;
    const t = shared.uTime.value;
    intro = Math.min(intro + dt / INTRO_SECONDS, 1);
    const rise = 1 - (1 - intro) ** 3;

    const ease = 1 - Math.exp(-dt * 2.2);
    shared.uPointer.value.lerp(pointer, ease);
    const { x, y } = shared.uPointer.value;

    logoMesh.position.y = LOGO_CENTER.y + Math.sin(t * 0.8) * 0.04 - (1 - rise) * 0.3;
    logoMesh.rotation.set(-y * 0.12, Math.sin(t * 0.35) * 0.12 + x * 0.25, 0);
    placeCamera();
  }

  function render() {
    renderer.render(scene, camera);
  }

  // ---- input: only a real mouse steers the scene; touch devices get the idle motion ----

  let lastInput = performance.now();
  if (!reducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener(
      "pointermove",
      (event) => {
        const box = root.getBoundingClientRect();
        pointer.set(
          Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1)),
          Math.max(-1, Math.min(1, 1 - ((event.clientY - box.top) / box.height) * 2)),
        );
        lastInput = performance.now();
      },
      { passive: true },
    );
    document.documentElement.addEventListener("pointerleave", () => pointer.set(0, 0));
  }

  // ---- loop: 60 fps while something is happening, 30 when idle, nothing when off-screen ----

  let lastFrame = 0;
  function tick(now: number) {
    const idle = intro >= 1 && now - lastInput > IDLE_AFTER_MS;
    if (now - lastFrame < (idle ? 1000 / 30 : 1000 / 60) - 2) return;
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 1 / 60;
    lastFrame = now;
    update(dt);
    render();
  }

  let onScreen = true;
  let alive = true;
  function setRunning() {
    const run = alive && onScreen && !reducedMotion;
    if (!run) lastFrame = 0;
    renderer.setAnimationLoop(run ? tick : null);
  }

  canvas.addEventListener("webglcontextlost", () => {
    // Rare (GPU reset, too many contexts). Fall back to the CSS backdrop rather than rebuild.
    alive = false;
    setRunning();
    delete root.dataset.ready;
  });

  // ---- first frame, then hand over to the observers ----

  root.prepend(canvas); // transparent until data-ready (see HeroScene.astro)
  layout();
  update(0);
  // Compile the shaders without blocking the page where the browser can (three warns where it can't,
  // and the first render compiles them anyway).
  if (renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene, camera);
  render();
  requestAnimationFrame(() => (root.dataset.ready = ""));

  // the copy reflows when the web font arrives, which moves the stage; the root resizes with the window
  const resize = new ResizeObserver(() => {
    layout();
    update(0);
    render();
  });
  resize.observe(root);
  if (copy) resize.observe(copy);
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    setRunning();
  }).observe(root);
}
