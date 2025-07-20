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
  let hTilde: vec2f = textureLoad(heightAmplitudes, id.xy).rg;
  let ik: vec2f = vec2f(-k.y, k.x);
  let value: vec2f = complexMultiply(ik, hTilde);

  textureStore(fourierComponents, id.xy, vec4f(value, 0.0, 0.0));
}
