import { BufferAttribute, BufferGeometry, Vector2, Vector3, type Texture } from "three";

/** Uniforms every hero material reads. Shared by reference: one update per frame reaches them all. */
export interface SharedUniforms {
  /** Seconds of animation; frozen under reduced motion. */
  uTime: { value: number };
  /** The baked noise atlas (see noise.ts). */
  uNoise: { value: Texture };
  /** Smoothed cursor position over the hero, -1..1 on both axes (y up). */
  uPointer: { value: Vector2 };
  /** Where the logo floats; smoke and the podium tops are lit from here. */
  uStage: { value: Vector3 };
  /** Drawing-buffer size, px. */
  uResolution: { value: Vector2 };
  /** Drawing-buffer px of canvas below the hero's bottom edge: the fog's overreach into the next section. */
  uBleed: { value: number };
}

/**
 * A hex colour as a GLSL vec3 literal. The hero's shaders work in display (sRGB) values, the space
 * the colours were picked in, and write straight to the canvas with no colour management.
 */
export function glsl(hex: string): string {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const channel = (shift: number) => (((n >> shift) & 255) / 255).toFixed(4);
  return `vec3(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

/** The same, as a uniform value. */
export function rgb(hex: string): Vector3 {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/**
 * Film grain, added by every material instead of in a separate full-screen pass (which would need an
 * offscreen buffer). Changes 24 times a second; the frame counter wraps so the hash input stays small.
 */
export const GRAIN = /* glsl */ `
  float grain(vec2 fragCoord, float time) {
    float frame = mod(floor(time * 24.0), 64.0);
    return fract(sin(dot(fragCoord + frame * vec2(17.0, 31.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  }
`;

export const GRAIN_AMOUNT = "0.045";

/** One triangle that covers the whole viewport (cheaper than a two-triangle quad: no diagonal seam). */
export function fullscreenTriangle(): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  return geometry;
}
