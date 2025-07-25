@group(0) @binding(0) var <storage> bitReversedIndices: array<f32>;
@group(0) @binding(1) var butterflyTexture: texture_storage_2d<rgba32float, write>;

@compute
@workgroup_size(1, 64, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let height: f32 = f32(textureDimensions(butterflyTexture).y);
  let coords: vec2f = vec2f(id.xy);
  let span: f32 = pow(2, coords.x);
  let k: f32 = (coords.y * height / (span * 2)) % height;
  let twiddleFactor: vec2f = twiddle(height, k);
  let topWing: bool = coords.y % (span * 2) < span;
  let sampleIndices: vec2f = select(
    select(
      vec2f(coords.y - span, coords.y),
      vec2f(coords.y, coords.y + span),
      topWing,
    ),
    select(
      vec2f(bitReversedIndices[id.y - 1], bitReversedIndices[id.y]),
      vec2f(bitReversedIndices[id.y], bitReversedIndices[id.y + 1]),
      topWing,
    ),
    coords.x == 0
  );

  textureStore(butterflyTexture, id.xy, vec4f(twiddleFactor, sampleIndices));
}

const PI: f32 = 3.141592653589793;
fn twiddle(N: f32, k: f32) -> vec2f {
  return complexExp(-2 * PI * k / N);
}