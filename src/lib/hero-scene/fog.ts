import { Mesh, ShaderMaterial } from "three";
import { fullscreenTriangle, glsl, GRAIN, GRAIN_AMOUNT, type SharedUniforms } from "./shared";

// The cloud bank in front of everything: three rows of white cloud along the bottom of the hero, each
// nearer row bigger, paler, faster and swinging further with the cursor. The canvas runs past the
// bottom of the hero (--hero-bleed in HeroScene.astro), and there the nearest row turns into the page:
// its texture thins out to the page's exact white along a ragged front. So the scene never stops at an
// edge; the white below reads as the inside of the same cloud.
//
// The bank's resting top comes from the podium (scene.ts: a little below its base, so the lowest tier
// stands in the scene's own cyan fog first). It rises into place with the logo and climbs as the hero
// scrolls away.
//
// Drawn last, as one full-screen triangle blended over the scene; pixels above the bank leave at once.
//
// Units in the shader are hero heights, measured from the hero's bottom edge (negative in the
// overreach), so the bank looks the same at any resolution.

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoise;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform float uBleed;
  uniform float uLine;
  uniform float uRise;
  uniform float uStageX;
  ${GRAIN}

  // One row of cloud: rounded heads along its skyline, solid below. 'acc' and the result are
  // premultiplied. 'size' is hero heights per noise tile (bigger heads), 'depth' 0..1 how near it is.
  vec4 bank(vec4 acc, vec2 p, float top, float size, float depth, float seed, vec3 shade, vec3 lit, float opacity, float glow) {
    // nearer rows swing further as the camera orbits with the cursor, and drift faster
    vec2 q = p + uPointer * vec2(0.24, 0.1) * depth + vec2(uTime * 0.014 * depth, 0.0);

    // the skyline: billowy noise (round tops, creases between) read along a slowly turning line, so
    // the heads swell and subside
    float heads = texture2D(uNoise, vec2(q.x / size, seed + uTime * 0.0018)).a - 0.335;

    // body texture, warped like the smoke sheets, lit from the upper left like them
    vec2 b = q / (size * 0.35) + seed;
    b += (texture2D(uNoise, b * 0.5 + vec2(seed, uTime * 0.002)).rg - 0.5) * 0.35;
    float d = texture2D(uNoise, b).b;
    float slope = d - texture2D(uNoise, b + vec2(-0.012, 0.022)).b;

    float inside = top + heads * size * 0.06 + (d - 0.5) * 0.04 - q.y; // hero heights under the skyline
    float alpha = opacity * smoothstep(0.0, 0.03, inside);

    // bright tops, shading into the underside; tall heads catch more light than the creases
    float under = smoothstep(0.0, 0.16, inside);
    vec3 col = mix(shade, lit, clamp(0.8 - under * 0.6 + slope * 3.5 + heads * 1.2, 0.0, 1.0));
    // the logo's light catches the tops nearest the stage
    float off = (p.x - uStageX) * 1.4;
    col = mix(col, ${glsl("#c6f1fb")}, glow * exp(-off * off) * (1.0 - under));

    return vec4(col * alpha + acc.rgb * (1.0 - alpha), alpha + acc.a * (1.0 - alpha));
  }

  void main() {
    float hero = uResolution.y - uBleed;
    vec2 p = (gl_FragCoord.xy - vec2(0.0, uBleed)) / hero;
    float line = uLine + uRise;
    if (p.y > line + 0.3) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // the scene is pale on the left and cyan on the right; the far rows pick that up
    float right = smoothstep(0.2, 1.0, gl_FragCoord.x / uResolution.x);
    vec4 acc = vec4(0.0);
    acc = bank(acc, p, line + 0.05, 2.0, 0.8, 0.13, mix(${glsl("#b4e1f0")}, ${glsl("#7fcde8")}, right), ${glsl("#ecf9fd")}, 0.8, 0.55);
    acc = bank(acc, p, line, 2.9, 0.9, 0.47, mix(${glsl("#d0ecf5")}, ${glsl("#addff0")}, right), ${glsl("#f8fdff")}, 0.92, 0.35);
    acc = bank(acc, p, line - 0.06, 4.3, 1.0, 0.81, ${glsl("#e6f4f9")}, ${glsl("#ffffff")}, 1.0, 0.2);

    // Below the hero the nearest row becomes the page: plain white by three quarters of the way down
    // the overreach, along a ragged front that climbs into the hero as it scrolls away. The noise term
    // stays under a quarter of the overreach, so the canvas's last pixels are always pure white.
    float bleed = uBleed / hero;
    float edge = max(uRise, 0.0) * 0.6;
    float n = texture2D(uNoise, p * 0.8 + vec2(uTime * 0.002, 0.31)).b - 0.5;
    float page = smoothstep(edge + 0.04, edge - bleed * 0.75, p.y + n * bleed * 0.35);
    acc = mix(acc, vec4(1.0), page); // the page's background (--background), premultiplied

    vec3 col = acc.rgb / max(acc.a, 1e-4);
    col += grain(gl_FragCoord.xy, uTime) * ${GRAIN_AMOUNT} * (1.0 - page);
    gl_FragColor = vec4(col * acc.a, acc.a);
  }
`;

export function createFog(shared: SharedUniforms) {
  const uniforms = {
    ...shared,
    /** The bank's resting top, hero heights above the hero's bottom edge (set by scene.ts's layout). */
    uLine: { value: 0.1 },
    /** How far the bank has risen above its resting top, hero heights: scroll, and the intro. */
    uRise: { value: 0 },
    /** The logo's x, hero heights from the left. */
    uStageX: { value: 1 },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(fullscreenTriangle(), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1; // after the atmosphere's sheets: over everything
  return { mesh, line: uniforms.uLine, rise: uniforms.uRise, stageX: uniforms.uStageX };
}
