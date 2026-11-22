import { PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { createAtmosphere } from "./atmosphere";
import { createFog } from "./fog";
import { parseGlb } from "./glb";
import { createLogo, LOGO_CENTER, LOGO_WIDTH } from "./logo";
import { bakeNoise } from "./noise";
import { createPodium, PODIUM_BASE } from "./podium";
import { createSky } from "./sky";
import type { SharedUniforms } from "./shared";

// The home page hero's 3D scene. Loaded on demand by src/components/HeroScene.astro, after the page
// has finished loading, so none of this (or three.js) is on the critical path.

export interface HeroSceneOptions {
  /**
   * The backdrop element; the canvas goes in as its first child, under the legibility washes. Its parent
   * is the hero, which it may run past at the bottom (the fog's overreach into the next section).
   */
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
/** The fog bank in front of the scene (fog.ts). Lengths in hero heights unless noted. */
const FOG = {
  /** Its resting top, in logo widths below the front of the podium's base. */
  gap: 0.25,
  /** In the stacked layout, at least this far above the copy, which then sits in the bank. */
  aboveCopy: 0.08,
  /** How far it climbs while the hero scrolls away. */
  scrollRise: 0.35,
  /** How far below its resting top it starts, to rise into place with the logo. */
  introDrop: 0.08,
};
const REST = new Vector2();

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
    uResolution: { value: new Vector2(1, 1) },
    uBleed: { value: 0 },
  };

  const scene = new Scene();
  const fog = createFog(shared);
  scene.add(createSky(shared), createAtmosphere(shared), createPodium(shared), fog.mesh);
  const logoMesh = createLogo(parseGlb(await logo), shared);
  scene.add(logoMesh);

  // ---- layout: size the canvas and frame the stage in the space the copy leaves ----
  // The canvas covers the hero plus the overreach below it; the stage is framed in the hero alone.

  const hero = root.parentElement ?? root;
  const stacked = window.matchMedia(STACKED);
  const frame = { x: 0, y: 0, logoPx: 1 };
  const podiumBase = new Vector3();
  let width = 0;
  let height = 0;
  /** The hero's height, CSS px: the canvas's, less the overreach. */
  let stageHeight = 1;
  /** Focal length, CSS px, that gives the hero itself a FOV-degree view. */
  let focal = 1;
  /** The hero's top in page coordinates, for the scroll position. */
  let heroTop = 0;

  function layout() {
    // the canvas's CSS box (a little taller than the root, see HeroScene.astro)
    width = Math.max(canvas.clientWidth, 1);
    height = Math.max(canvas.clientHeight, 1);
    stageHeight = Math.min(Math.max(hero.clientHeight, 1), height);
    renderer.setSize(width, height, false);
    const buffer = renderer.getDrawingBufferSize(shared.uResolution.value);
    shared.uBleed.value = ((height - stageHeight) * buffer.y) / height;
    camera.aspect = width / height;
    // the hero keeps its FOV; the overreach only shows more of the scene below it
    focal = stageHeight / (2 * Math.tan((FOV * Math.PI) / 360));
    camera.fov = (2 * Math.atan(height / (2 * focal)) * 180) / Math.PI;

    const box = root.getBoundingClientRect();
    heroTop = box.top + window.scrollY;
    const text = copy?.getBoundingClientRect();
    if (!stacked.matches) {
      // landscape: a little left of centre in the space right of the copy
      const left = text ? text.right - box.left + 24 : width * 0.5;
      const free = Math.max(width - left, width * 0.3);
      frame.x = left + free * 0.45;
      frame.y = stageHeight * 0.44;
      frame.logoPx = Math.min(stageHeight * 0.36, free * 0.46);
    } else {
      // portrait: centred in the space above the copy, the podium allowed to bleed past the sides.
      // The stage runs from 0.3 logo widths above the logo's centre to ~0.84 below it (podium and fog),
      // so the logo sits 0.27 widths above the middle of that space.
      const free = Math.max((text ? text.top - box.top : stageHeight * 0.55) - 24, stageHeight * 0.3);
      frame.x = width / 2;
      frame.logoPx = Math.min(width * 0.6, free * 0.62);
      frame.y = 12 + free / 2 - 0.27 * frame.logoPx;
    }

    // The fog bank's resting top: a little below where the podium's base lands with the camera at
    // rest; stacked, also clear above the copy.
    placeCamera(REST);
    camera.updateMatrixWorld();
    let line = ((1 - podiumBase.copy(PODIUM_BASE).project(camera).y) / 2) * height + FOG.gap * frame.logoPx;
    if (stacked.matches && text) line = Math.min(line, text.top - box.top - FOG.aboveCopy * stageHeight);
    line = Math.min(Math.max(line, stageHeight * 0.3), stageHeight * 0.95);
    fog.line.value = 1 - line / stageHeight;
    fog.stageX.value = frame.x / stageHeight;
    readScroll();
  }

  function placeCamera({ x, y }: Vector2) {
    const distance = (LOGO_WIDTH * focal) / frame.logoPx;
    const azimuth = x * PARALLAX.azimuth;
    const elevation = ELEVATION + y * PARALLAX.elevation;
    camera.position.set(
      LOGO_CENTER.x + distance * Math.sin(azimuth) * Math.cos(elevation),
      LOGO_CENTER.y + distance * Math.sin(elevation),
      LOGO_CENTER.z + distance * Math.cos(azimuth) * Math.cos(elevation),
    );
    camera.lookAt(LOGO_CENTER);
    // shift the projection so the logo lands on frame.x/frame.y instead of the canvas centre
    camera.setViewOffset(width, height, width / 2 - frame.x, height / 2 - frame.y, width, height);
  }

  // ---- scroll: 0 with the hero's top at the top of the viewport, 1 once it has scrolled out ----

  let scrollTarget = 0;
  let scrolled = 0; // eased toward scrollTarget
  function readScroll() {
    if (reducedMotion) return;
    scrollTarget = Math.min(Math.max((window.scrollY - heroTop) / stageHeight, 0), 1);
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

    // the fog bank rises into place with the logo, then climbs while the hero scrolls away
    scrolled += (scrollTarget - scrolled) * (1 - Math.exp(-dt * 6));
    fog.rise.value = scrolled * FOG.scrollRise - (1 - rise) * FOG.introDrop;
    placeCamera(shared.uPointer.value);
  }

  function render() {
    renderer.render(scene, camera);
  }

  // ---- input: only a real mouse steers the scene (touch devices get the idle motion); scrolling raises the fog ----

  let lastInput = performance.now();
  if (!reducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener(
      "pointermove",
      (event) => {
        const box = root.getBoundingClientRect();
        pointer.set(
          Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1)),
          Math.max(-1, Math.min(1, 1 - ((event.clientY - box.top) / stageHeight) * 2)),
        );
        lastInput = performance.now();
      },
      { passive: true },
    );
    document.documentElement.addEventListener("pointerleave", () => pointer.set(0, 0));
  }
  if (!reducedMotion) {
    window.addEventListener(
      "scroll",
      () => {
        readScroll();
        lastInput = performance.now();
      },
      { passive: true },
    );
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
  scrolled = scrollTarget; // a page opened part-way down starts with the bank already risen
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
