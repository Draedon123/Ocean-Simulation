struct Settings {
  height: f32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var <storage> bitReversedIndices: array<f32>;
@group(0) @binding(2) var butterflyTexture: texture_storage_2d<rgba32float, write>;

@compute
@workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let coords: vec2f = vec2f(id.xy);
  let span: f32 = pow(2.0, coords.x);
  let k: f32 = (coords.y * settings.height / (span * 2)) % settings.height;
  let twiddleFactor: vec2f = twiddle(settings.height, k);
  let topWing: bool = coords.y % (span * 2) < span;
  var sampleIndices: vec2f = vec2f();

  if(coords.x == 0){
    if(topWing){
      sampleIndices = vec2f(bitReversedIndices[id.y], bitReversedIndices[id.y + 1]);
    } else {
      sampleIndices = vec2f(bitReversedIndices[id.y - 1], bitReversedIndices[id.y]);
    }
  } else {
    if(topWing){
      sampleIndices = vec2f(coords.y, coords.y + span);
    } else {
      sampleIndices = vec2f(coords.y - span, coords.y);
    }
  }

  // TODO: CHECK IF TEXTURE FLIP IS NECESSARY
  textureStore(butterflyTexture, id.xy, vec4f(twiddleFactor, sampleIndices));
  // textureStore(butterflyTexture, vec2u(id.x * 2, u32(settings.height - 1)) - id.xy, vec4f(twiddleFactor, sampleIndices));
}

const PI: f32 = 3.141592653589793;
fn twiddle(N: f32, k: f32) -> vec2f {
  return complexExp(-2 * PI * k / N);
}