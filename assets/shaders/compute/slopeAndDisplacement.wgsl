struct Settings {
  domainSize: f32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var heightAmplitudes: texture_storage_2d<rg32float, read>;
@group(0) @binding(2) var slopeComponents: texture_storage_2d<rg32float, write>;
@group(0) @binding(3) var displacementComponents: texture_storage_2d<rg32float, write>;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let samples: f32 = f32(textureDimensions(heightAmplitudes).x);

  let k: vec2f = calculateWaveVector(vec2f(id.xy), samples, settings.domainSize);
  let kLength: f32 = length(k);
  let unitK: vec2f = select(normalize(k), vec2f(0.0), kLength == 0);

  let hTilde: vec2f = textureLoad(heightAmplitudes, id.xy).rg;

  let ik: vec2f = vec2f(-k.y, k.x);
  let ikOverNegativeK: vec2f = vec2f(unitK.y, -unitK.x);

  let slopeComponent: vec2f = complexMultiply(ik, hTilde);
  let displacementComponent: vec2f = complexMultiply(ikOverNegativeK, hTilde);

  textureStore(slopeComponents, id.xy, vec4f(slopeComponent, 0.0, 0.0));
  textureStore(displacementComponents, id.xy, vec4f(displacementComponent, 0.0, 0.0));
}
