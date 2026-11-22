import { Mesh, ShaderMaterial, Vector3, type BufferGeometry } from "three";
import { glsl, GRAIN, GRAIN_AMOUNT, type SharedUniforms } from "./shared";

// The VF mark (src/assets/hero/vf-logo.glb: one chamfered slab, 1 unit wide, centred, facing +z).
// Shaded by hand rather than with a lit material: a cyan gradient drifting across the face, chamfers
// lit from the upper left, a sheen that follows the cursor and a glint that sweeps across now and then.

/** Where the logo floats, above the podium's top tier. */
export const LOGO_CENTER = new Vector3(0, 1.06, 0);
/** World width of the logo; the camera is placed so this many units span the target pixel width. */
export const LOGO_WIDTH = 2.4;

const vertexShader = /* glsl */ `
  varying vec3 vObject;
  varying vec3 vObjectNormal;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  void main() {
    vObject = position;
    vObjectNormal = normal;
    vViewNormal = normalize(normalMatrix * normal);
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = view.xyz;
    gl_Position = projectionMatrix * view;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoise;
  uniform vec2 uPointer;
  varying vec3 vObject;
  varying vec3 vObjectNormal;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  ${GRAIN}

  void main() {
    vec3 n = normalize(vViewNormal);
    vec3 v = normalize(-vViewPosition);
    float face = smoothstep(0.9, 0.99, vObjectNormal.z);
    vec2 p = vObject.xy; // about -0.5..0.5 by -0.3..0.3

    // face: light cyan at the upper left to deep teal at the lower right, slowly flowing
    float flow = texture2D(uNoise, p * 0.8 + vec2(0.012, -0.008) * uTime).b - 0.5;
    float along = dot(p, normalize(vec2(1.0, -0.85))) * 1.15 + flow * 0.35 + uPointer.x * 0.08;
    vec3 faceCol = mix(${glsl("#74d3e8")}, ${glsl("#2b97ba")}, smoothstep(-0.6, 0.6, along));

    // chamfers and sides: bright where they face the light (upper left), deep where they turn away
    vec2 dir = n.xy / max(length(n.xy), 1e-4);
    float toLight = dot(dir, normalize(vec2(-0.6, 0.8)));
    vec3 edgeCol = mix(${glsl("#4b9bb5")}, ${glsl("#c8f0f7")}, smoothstep(-0.55, 0.75, toLight));

    vec3 col = mix(edgeCol, faceCol, face);

    // grazing angles pick up the pale sky
    col = mix(col, ${glsl("#c9eef7")}, pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0) * 0.5);

    // sheen that wanders and leans toward the cursor
    vec3 light = normalize(vec3(-0.4 + 0.2 * sin(uTime * 0.27) + uPointer.x * 0.35, 0.5 + uPointer.y * 0.25, 0.9));
    col += ${glsl("#d6f6fc")} * pow(max(dot(n, normalize(light + v)), 0.0), 36.0) * 0.22;

    // a glint crossing the face every ~25 s
    float sweep = mod(uTime * 0.12, 3.0) - 1.5;
    col += ${glsl("#effcff")} * exp(-pow(p.x + 0.6 * p.y - sweep, 2.0) / 0.003) * face * 0.32;

    col += grain(gl_FragCoord.xy, uTime) * ${GRAIN_AMOUNT};
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createLogo(geometry: BufferGeometry, shared: SharedUniforms): Mesh {
  const material = new ShaderMaterial({
    uniforms: { uTime: shared.uTime, uNoise: shared.uNoise, uPointer: shared.uPointer },
    vertexShader,
    fragmentShader,
  });
  const box = geometry.boundingBox;
  const width = box ? box.max.x - box.min.x : 1;
  const mesh = new Mesh(geometry, material);
  mesh.scale.setScalar(LOGO_WIDTH / width);
  mesh.position.copy(LOGO_CENTER);
  return mesh;
}
