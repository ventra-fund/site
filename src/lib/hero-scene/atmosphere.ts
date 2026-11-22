import { Group, Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from "three";
import { glsl, GRAIN, GRAIN_AMOUNT, rgb, type SharedUniforms } from "./shared";

// Soft layers around the stage: cloud banks and fog (noise-broken "smoke" sheets) and pure light
// (glow sheets: the column above the logo, the halo behind it, a band along the horizon).
//
// Every sheet sits either well behind the podium (z < -2.2) or well in front of it (z > 2.4), never
// through it. That keeps edges soft without a depth pre-pass: the podium hides the sheets behind it,
// and the ones in front simply paint over its base.

interface Sheet {
  /** Centre, world units. The podium stands at the origin and the logo floats above it. */
  x: number;
  y: number;
  z: number;
  /** Size, world units. */
  w: number;
  h: number;
  opacity: number;
}
interface Smoke extends Sheet {
  kind: "smoke";
  shade: string;
  lit: string;
  /** Noise scale: higher reads as smaller puffs. */
  freq?: number;
  /** 0 = an even haze, 1 = broken into separate puffs. */
  breakup?: number;
  /** How strongly the logo's light tints it. */
  glow?: number;
  speed?: number;
}
interface Glow extends Sheet {
  kind: "glow";
  shape: "blob" | "column" | "belt";
  color: string;
  /** Second colour, for the belt's right end. */
  color2?: string;
}

const SHEETS: (Smoke | Glow)[] = [
  // far cloud banks
  { kind: "smoke", x: 4.2, y: 3.6, z: -12, w: 13, h: 9, shade: "#3eb9de", lit: "#a3dbef", opacity: 0.8, breakup: 0.6, freq: 0.07 },
  { kind: "smoke", x: -3.5, y: 3.4, z: -12, w: 12, h: 8, shade: "#81cce6", lit: "#bae3f2", opacity: 0.55, breakup: 0.65, freq: 0.09 },
  { kind: "smoke", x: -10, y: -0.5, z: -11, w: 9, h: 16, shade: "#c9e5ef", lit: "#dceef5", opacity: 0.7, breakup: 0.3, freq: 0.08 },
  // mid clouds beside the stage
  { kind: "smoke", x: 4.0, y: 0.6, z: -6, w: 6, h: 6.2, shade: "#1bbae2", lit: "#a3ddf2", opacity: 0.8, glow: 0.55, freq: 0.14 },
  { kind: "smoke", x: -2.4, y: 2.3, z: -6, w: 5, h: 4, shade: "#8bd3ec", lit: "#c7eaf6", opacity: 0.45, glow: 0.3, freq: 0.14 },
  // light: the column rising out of the logo, the halo behind it, the horizon band, a cyan lobe on the right
  { kind: "glow", shape: "column", x: 0, y: 3.3, z: -3.2, w: 3.4, h: 7.5, color: "#eaf9fe", opacity: 0.95 },
  { kind: "glow", shape: "blob", x: 0, y: 0.9, z: -2.4, w: 5.4, h: 4.8, color: "#ecfaff", opacity: 0.75 },
  { kind: "glow", shape: "belt", x: -1.6, y: 0.1, z: -2.9, w: 7.2, h: 3, color: "#d1eef7", color2: "#83e0f7", opacity: 1 },
  { kind: "glow", shape: "blob", x: 2.6, y: 0.2, z: -2.6, w: 3.2, h: 3.2, color: "#1ac8eb", opacity: 0.9 },
  // cloud sea behind the podium's base
  { kind: "smoke", x: 0.6, y: -1.2, z: -2.3, w: 9.5, h: 2.6, shade: "#14b2d9", lit: "#99ddf3", opacity: 0.9, glow: 0.8, freq: 0.2 },
  // fog in front, swallowing the base
  { kind: "smoke", x: -2.8, y: -0.9, z: 2.6, w: 3.6, h: 2.6, shade: "#bde8f6", lit: "#f1fcff", opacity: 0.75, glow: 0.6, freq: 0.22 },
  { kind: "smoke", x: 3.4, y: -0.8, z: 2.6, w: 3.4, h: 2.6, shade: "#0db7e0", lit: "#a4dff3", opacity: 0.75, glow: 0.4, freq: 0.22 },
  { kind: "smoke", x: 0, y: -1.05, z: 2.8, w: 6.2, h: 1.1, shade: "#08bee7", lit: "#98ddf4", opacity: 0.75, breakup: 0.4, freq: 0.24 },
  { kind: "smoke", x: 0.3, y: -1.9, z: 3.4, w: 9, h: 3, shade: "#03a9d0", lit: "#66cff0", opacity: 1, breakup: 0.25, freq: 0.14 },
  { kind: "smoke", x: 0, y: -3.4, z: 5.5, w: 16, h: 3.6, shade: "#20c2eb", lit: "#a2e0f5", opacity: 0.85, breakup: 0.4, freq: 0.1, speed: 1.4 },
];

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Fades a sheet out before its rectangle's edges so no border ever shows.
const EDGE = /* glsl */ `
  float edgeFade(vec2 q) {
    return smoothstep(1.0, 0.78, abs(q.x)) * smoothstep(1.0, 0.78, abs(q.y));
  }
`;

const smokeFragment = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoise;
  uniform vec3 uStage;
  uniform vec3 uShade;
  uniform vec3 uLit;
  uniform vec2 uScale;
  uniform vec2 uSeed;
  uniform float uOpacity;
  uniform float uBreakup;
  uniform float uGlow;
  uniform float uSpeed;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${GRAIN}
  ${EDGE}

  float density(vec2 p) {
    return 0.88 * texture2D(uNoise, p).b + 0.12 * texture2D(uNoise, p * 2.5 + 0.37).a;
  }

  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float body = smoothstep(1.05, 0.15, length(q)) * edgeFade(q);

    float t = uTime * 0.012 * uSpeed;
    vec2 p = vUv * uScale + uSeed;
    p += (texture2D(uNoise, p * 0.3 + vec2(t, -0.5 * t)).rg - 0.5) * 0.45 + vec2(1.5 * t, 0.4 * t);
    float d = density(p);
    float puff = smoothstep(0.36, 0.72, d);
    float alpha = body * mix(1.0, puff, uBreakup) * uOpacity;

    // fake light from the upper left: density falling off toward the light reads as a lit edge
    float slope = d - density(p + vec2(-0.02, 0.027));
    vec3 col = mix(uShade, uLit, clamp(0.55 + slope * 3.0, 0.0, 1.0));
    col = mix(col, uLit, (1.0 - puff) * 0.35);

    // the logo lights whatever drifts close to it
    vec3 rel = vWorld - uStage;
    float near = uGlow * exp(-dot(rel.xy * vec2(0.42, 0.6), rel.xy * vec2(0.42, 0.6))) * exp(-abs(rel.z) * 0.1);
    col = mix(col, mix(${glsl("#c4f0fb")}, ${glsl("#33d2f5")}, smoothstep(-1.8, 1.8, rel.x)), clamp(near, 0.0, 1.0));

    col += grain(gl_FragCoord.xy, uTime) * ${GRAIN_AMOUNT};
    gl_FragColor = vec4(col, alpha);
  }
`;

const glowFragment = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoise;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uOpacity;
  uniform int uShape;
  varying vec2 vUv;
  ${GRAIN}
  ${EDGE}

  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float shimmer = texture2D(uNoise, vUv * vec2(1.5, 1.0) + vec2(0.004, 0.002) * uTime).b - 0.5;
    vec3 col = uColor;
    float alpha;
    if (uShape == 1) {
      // column: narrow where it leaves the logo, widening and fading as it rises
      float width = mix(0.38, 0.8, vUv.y);
      alpha = exp(-pow(q.x / width, 2.0)) * smoothstep(0.0, 0.22, vUv.y) * (1.0 - smoothstep(0.3, 0.95, vUv.y));
      alpha *= 0.85 + shimmer * 0.5;
    } else if (uShape == 2) {
      // belt: a long soft band, pale on the left and cyan on the right
      alpha = exp(-(q.x * q.x * 1.3 + q.y * q.y * 2.8)) * (0.8 + shimmer);
      col = mix(uColor, uColor2, smoothstep(-0.8, 0.5, q.x));
    } else {
      alpha = exp(-dot(q, q) * 2.3) * (0.8 + shimmer);
    }
    alpha = clamp(alpha * edgeFade(q) * uOpacity, 0.0, 1.0);
    col += grain(gl_FragCoord.xy, uTime) * ${GRAIN_AMOUNT};
    gl_FragColor = vec4(col, alpha);
  }
`;

const SHAPES = { blob: 0, column: 1, belt: 2 } as const;

export function createAtmosphere(shared: SharedUniforms): Group {
  const group = new Group();
  const plane = new PlaneGeometry(1, 1);
  SHEETS.forEach((sheet, index) => {
    const material =
      sheet.kind === "smoke"
        ? new ShaderMaterial({
            uniforms: {
              ...shared,
              uShade: { value: rgb(sheet.shade) },
              uLit: { value: rgb(sheet.lit) },
              uScale: { value: new Vector2(sheet.w, sheet.h).multiplyScalar(sheet.freq ?? 0.1) },
              // fixed per sheet (not random) so every visit looks the same
              uSeed: { value: new Vector2(index * 3.7, index * 1.9) },
              uOpacity: { value: sheet.opacity },
              uBreakup: { value: sheet.breakup ?? 0.6 },
              uGlow: { value: sheet.glow ?? 0 },
              uSpeed: { value: sheet.speed ?? 1 },
            },
            vertexShader,
            fragmentShader: smokeFragment,
          })
        : new ShaderMaterial({
            uniforms: {
              uTime: shared.uTime,
              uNoise: shared.uNoise,
              uColor: { value: rgb(sheet.color) },
              uColor2: { value: rgb(sheet.color2 ?? sheet.color) },
              uOpacity: { value: sheet.opacity },
              uShape: { value: SHAPES[sheet.shape] },
            },
            vertexShader,
            fragmentShader: glowFragment,
          });
    material.transparent = true;
    material.depthWrite = false;
    const mesh = new Mesh(plane, material);
    mesh.position.set(sheet.x, sheet.y, sheet.z);
    mesh.scale.set(sheet.w, sheet.h, 1);
    group.add(mesh);
  });
  return group;
}
