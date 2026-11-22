import { BufferAttribute, BufferGeometry } from "three";

// A minimal GLB reader for the hero logo: the first primitive of the first mesh, as positions, normals
// and indices. three's GLTFLoader would cost far more bytes than the model itself, and the model needs
// none of what it handles (materials, textures, node transforms, animation, compression).

const MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

const ARRAY_TYPES = {
  5121: Uint8Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
} as const;
const ITEM_SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 } as const;

interface Accessor {
  bufferView: number;
  byteOffset?: number;
  componentType: keyof typeof ARRAY_TYPES;
  count: number;
  type: keyof typeof ITEM_SIZES;
}
interface BufferView {
  byteOffset?: number;
  byteStride?: number;
}
interface Gltf {
  accessors: Accessor[];
  bufferViews: BufferView[];
  meshes: { primitives: { attributes: Record<string, number>; indices?: number }[] }[];
}

export function parseGlb(buffer: ArrayBuffer): BufferGeometry {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== MAGIC) throw new Error("Hero logo: not a GLB file");

  let json: Gltf | undefined;
  let binStart = -1;
  for (let offset = 12; offset + 8 <= buffer.byteLength; ) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    if (type === CHUNK_JSON) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, offset + 8, length)));
    else if (type === CHUNK_BIN) binStart = offset + 8;
    offset += 8 + length;
  }
  if (!json || binStart < 0) throw new Error("Hero logo: GLB is missing its JSON or binary chunk");

  const read = (index: number) => {
    const accessor = json.accessors[index];
    const bufferView = json.bufferViews[accessor.bufferView];
    const ArrayType = ARRAY_TYPES[accessor.componentType];
    const itemSize = ITEM_SIZES[accessor.type];
    if (bufferView.byteStride && bufferView.byteStride !== itemSize * ArrayType.BYTES_PER_ELEMENT) {
      throw new Error("Hero logo: interleaved vertex data is not supported");
    }
    // glTF aligns every accessor to its component size, so the typed array can view the file directly.
    const start = binStart + (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    return new BufferAttribute(new ArrayType(buffer, start, accessor.count * itemSize), itemSize);
  };

  const primitive = json.meshes[0]?.primitives[0];
  if (!primitive || primitive.attributes.POSITION === undefined) throw new Error("Hero logo: GLB has no mesh");

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", read(primitive.attributes.POSITION));
  if (primitive.attributes.NORMAL !== undefined) geometry.setAttribute("normal", read(primitive.attributes.NORMAL));
  if (primitive.indices !== undefined) geometry.setIndex(read(primitive.indices));
  if (primitive.attributes.NORMAL === undefined) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
