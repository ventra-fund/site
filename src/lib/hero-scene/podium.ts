import { Group, LatheGeometry, Mesh, ShaderMaterial, Vector2 } from "three";
import { glsl, GRAIN, GRAIN_AMOUNT, type SharedUniforms } from "./shared";

// The stepped podium under the logo: three rounded discs, each wider and lower than the one above,
// topped by a thin glowing pad right under the logo. The lowest disc sinks into the fog.

interface Tier {
  radius: number;
  height: number;
  /** y of the flat top. */
  top: number;
  bevel: number;
  /** The glowing pad: white top, pale sides. */
  pad?: boolean;
}

const TIERS: Tier[] = [
  { radius: 1.08, height: 0.07, top: 0.0, bevel: 0.025, pad: true },
  { radius: 1.56, height: 0.26, top: -0.06, bevel: 0.06 },
  { radius: 1.8, height: 0.3, top: -0.34, bevel: 0.065 },
  { radius: 2.08, height: 0.3, top: -0.66, bevel: 0.065 },
];

/** Lathe segments: enough that the widest rim stays round at full-screen size. */
const SEGMENTS = 128;
const BEVEL_STEPS = 6;

/** A disc with rounded top and bottom edges, as a lathe profile (bottom to top keeps normals outward). */
function roundedDisc({ radius, height, bevel }: Tier): LatheGeometry {
  const half = height / 2;
  const profile = [new Vector2(0, -half)];
  const arc = (centerY: number, from: number, to: number) => {
    for (let i = 0; i <= BEVEL_STEPS; i++) {
      const a = from + ((to - from) * i) / BEVEL_STEPS;
      profile.push(new Vector2(radius - bevel + bevel * Math.cos(a), centerY + bevel * Math.sin(a)));
    }
  };
  arc(-half + bevel, -Math.PI / 2, 0);
  arc(half - bevel, 0, Math.PI / 2);
  profile.push(new Vector2(0, half));
  return new LatheGeometry(profile, SEGMENTS);
}

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uTop;
  uniform float uBottom;
  uniform float uRadius;
  uniform float uPad;
  varying vec3 vWorld;
  varying vec3 vNormal;
  ${GRAIN}

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(cameraPosition - vWorld);
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float top = smoothstep(0.82, 0.97, n.y);
    float upperEdge = smoothstep(0.2, 0.65, n.y) * (1.0 - top);
    float lowerEdge = smoothstep(-0.2, -0.75, n.y);
    float h = clamp((vWorld.y - uBottom) / (uTop - uBottom), 0.0, 1.0);
    float across = clamp(vWorld.x / uRadius, -1.0, 1.0); // -1 at the left rim, 1 at the right

    // sides: hazy white on the left, cyan on the right, a shade deeper just under the top edge
    vec3 side = mix(${glsl("#dcf0f6")}, ${glsl("#58b9da")}, smoothstep(-0.7, 1.0, across));
    side = mix(side, side * 0.86, smoothstep(0.45, 1.0, h) * 0.7);

    // tops: cyan, brighter toward the middle where the logo's light lands; the pad glows white
    float r = length(vWorld.xz);
    vec3 topCol = mix(${glsl("#3fb0d6")}, ${glsl("#9ee0f3")}, exp(-pow(max(r - 1.0, 0.0), 2.0) * 2.5) * 0.7);
    topCol = mix(topCol, ${glsl("#effbff")}, uPad);
    side = mix(side, ${glsl("#d4f1fa")}, uPad);

    vec3 col = mix(side, topCol, top);
    col = mix(col, ${glsl("#ffffff")}, upperEdge * 0.85);
    col = mix(col, side * 0.72, lowerEdge * 0.55);

    // silhouette haze: white on the left flank, cyan on the right
    float rim = pow(1.0 - facing, 2.4) * (1.0 - top);
    col = mix(col, mix(${glsl("#e3f7fd")}, ${glsl("#63d4f4")}, smoothstep(-0.6, 0.6, across)), rim * 0.8);

    // the base disappears into the fog
    col = mix(col, ${glsl("#4cc4ea")}, smoothstep(-0.6, -1.05, vWorld.y) * 0.85);

    col += grain(gl_FragCoord.xy, uTime) * ${GRAIN_AMOUNT};
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createPodium(shared: SharedUniforms): Group {
  const group = new Group();
  for (const tier of TIERS) {
    const material = new ShaderMaterial({
      uniforms: {
        uTime: shared.uTime,
        uTop: { value: tier.top },
        uBottom: { value: tier.top - tier.height },
        uRadius: { value: tier.radius },
        uPad: { value: tier.pad ? 1 : 0 },
      },
      vertexShader,
      fragmentShader,
    });
    const mesh = new Mesh(roundedDisc(tier), material);
    mesh.position.y = tier.top - tier.height / 2;
    group.add(mesh);
  }
  return group;
}
