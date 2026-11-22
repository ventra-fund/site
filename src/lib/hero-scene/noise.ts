import {
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  type Camera,
  type Texture,
  type WebGLRenderer,
} from "three";
import { fullscreenTriangle } from "./shared";

// Clouds and smoke sample a small tiling noise texture instead of computing noise per pixel, which
// would cost several octaves of math for every pixel of every sheet, every frame. It is baked once on
// the GPU when the scene starts (one draw call).
//   r, g: smooth noise, used to warp the other channels
//   b:    cloud density
//   a:    billowy detail

const SIZE = 256;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;

  float hash(vec2 cell, float seed) {
    return fract(sin(dot(cell + seed, vec2(41.31, 289.17))) * 45758.5453);
  }

  // Gradient noise whose lattice repeats every 'period' cells, so the texture tiles seamlessly.
  float tilingNoise(vec2 p, float period, float seed) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = hash(mod(cell, period), seed) * 6.2831853;
    float b = hash(mod(cell + vec2(1.0, 0.0), period), seed) * 6.2831853;
    float c = hash(mod(cell + vec2(0.0, 1.0), period), seed) * 6.2831853;
    float d = hash(mod(cell + vec2(1.0, 1.0), period), seed) * 6.2831853;
    float va = dot(vec2(cos(a), sin(a)), f);
    float vb = dot(vec2(cos(b), sin(b)), f - vec2(1.0, 0.0));
    float vc = dot(vec2(cos(c), sin(c)), f - vec2(0.0, 1.0));
    float vd = dot(vec2(cos(d), sin(d)), f - vec2(1.0, 1.0));
    return mix(mix(va, vb, w.x), mix(vc, vd, w.x), w.y);
  }

  float fbm(vec2 uv, float period, float seed, bool billow) {
    float sum = 0.0;
    float amplitude = 0.55;
    for (int octave = 0; octave < 5; octave++) {
      float n = tilingNoise(uv * period, period, seed);
      sum += amplitude * (billow ? abs(n) : n);
      period *= 2.0;
      amplitude *= 0.5;
    }
    return sum;
  }

  void main() {
    gl_FragColor = vec4(
      0.5 + fbm(vUv, 4.0, 3.1, false),
      0.5 + fbm(vUv, 4.0, 17.9, false),
      0.5 + 1.2 * fbm(vUv, 5.0, 29.3, false),
      clamp(1.8 * fbm(vUv, 6.0, 51.7, true), 0.0, 1.0)
    );
  }
`;

export function bakeNoise(renderer: WebGLRenderer, camera: Camera): Texture {
  const target = new WebGLRenderTarget(SIZE, SIZE, {
    wrapS: RepeatWrapping,
    wrapT: RepeatWrapping,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    generateMipmaps: true,
    depthBuffer: false,
  });
  const material = new ShaderMaterial({ vertexShader, fragmentShader, depthTest: false, depthWrite: false });
  const quad = new Mesh(fullscreenTriangle(), material);
  quad.frustumCulled = false;
  const scene = new Scene();
  scene.add(quad);

  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.setRenderTarget(previous);

  quad.geometry.dispose();
  material.dispose();
  return target.texture;
}
