import { Mesh, ShaderMaterial } from "three";
import { fullscreenTriangle, glsl, GRAIN, GRAIN_AMOUNT, type SharedUniforms } from "./shared";

// The backdrop: a screen-space gradient (pale on the left behind the copy, cyan on the right) with
// slow clouds drifting through the upper right. Drawn first, as one full-screen triangle, so it needs
// no depth and everything else paints over it. Laid out in the hero's box: below it, in the canvas's
// overreach, the fog bank (fog.ts) covers the sky.

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoise;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform float uBleed;
  ${GRAIN}

  void main() {
    vec2 size = vec2(uResolution.x, uResolution.y - uBleed);
    vec2 uv = (gl_FragCoord.xy - vec2(0.0, uBleed)) / size;
    vec3 col = mix(${glsl("#d0e8f1")}, ${glsl("#a1d5e8")}, smoothstep(0.0, 0.4, uv.x));
    col = mix(col, ${glsl("#7ccbe6")}, smoothstep(0.5, 1.0, uv.x) * smoothstep(0.1, 0.75, uv.y));
    col = mix(col, ${glsl("#d1eaf3")}, smoothstep(0.42, 0.0, uv.y) * (1.0 - 0.6 * smoothstep(0.45, 0.95, uv.x)));

    // clouds: domain-warped density, a touch of parallax with the cursor
    vec2 p = vec2(uv.x * size.x / size.y, uv.y) * 0.45 + uPointer * vec2(0.02, -0.015);
    float t = uTime * 0.004;
    vec2 warp = texture2D(uNoise, p * 0.5 + vec2(t, 0.0)).rg - 0.5;
    float density = texture2D(uNoise, p + warp * 0.8 + vec2(1.4 * t, 0.3 * t)).b;
    float detail = texture2D(uNoise, p * 2.3 + warp).a;
    float cloud = smoothstep(0.42, 0.7, density * 0.8 + detail * 0.2);
    float region = smoothstep(0.25, 0.9, uv.x) * smoothstep(0.0, 0.55, uv.y);
    col = mix(col, ${glsl("#44b9dd")}, cloud * region * 0.8);
    col = mix(col, ${glsl("#bbe3f2")}, (1.0 - cloud) * smoothstep(0.45, 0.7, detail) * 0.3);

    col += grain(gl_FragCoord.xy, uTime) * ${GRAIN_AMOUNT};
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createSky(shared: SharedUniforms): Mesh {
  const material = new ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(fullscreenTriangle(), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}
