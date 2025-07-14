struct Settings {
  domainSize: f32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var heightAmplitudes: texture_storage_2d<rg32float, read>;
@group(0) @binding(2) var fourierComponents: texture_storage_2d<rg32float, write>;

const PI: f32 = 3.141592653589793;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let samples: f32 = f32(textureDimensions(heightAmplitudes).x);
  let k: vec2f = 2 * PI * (vec2f(id.xy) - samples / 2) / settings.domainSize;
  let kLength: f32 = length(k);
  let unitK: vec2f = select(normalize(k), vec2f(0.0), kLength == 0);
  let hTilde: vec2f = textureLoad(heightAmplitudes, id.xy).rg;
  let ikOverKNegative: vec2f = vec2f(unitK.y, -unitK.x);
  let value: vec2f = complexMultiply(ikOverKNegative, hTilde);

  textureStore(fourierComponents, id.xy, vec4f(value, 0.0, 0.0));
}
