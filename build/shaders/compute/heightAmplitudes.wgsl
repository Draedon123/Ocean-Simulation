struct Settings {
  time: f32,
  domainSize: f32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var spectrumTexture: texture_storage_2d<rg32float, read>;
@group(0) @binding(2) var heightAmplitudesTexture: texture_storage_2d<rg32float, write>;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let heightAmplitude: vec2f = heightAmplitude(id.xy);

  textureStore(heightAmplitudesTexture, id.xy, vec4f(heightAmplitude, 0.0, 0.0));
}

const GRAVITY: f32 = 9.81;

fn heightAmplitude(pixel: vec2u) -> vec2f {
  let samples: f32 = f32(textureDimensions(spectrumTexture).x);
  
  let h0_k: vec2f = textureLoad(spectrumTexture, pixel).rg;
  let h0_negativeK: vec2f = textureLoad(spectrumTexture, u32(samples) - pixel).rg;
  let h0_negativeK_conjugate: vec2f = complexConjugate(h0_negativeK);

  let k: vec2f = calculateWaveVector(vec2f(pixel), samples, settings.domainSize);
  let kLength: f32 = length(k);

  let dispersion: f32 = dispersionRelation(kLength);

  let amplitude: vec2f = 
    complexMultiply(h0_k, complexExp(dispersion * settings.time)) + 
    complexMultiply(h0_negativeK_conjugate, complexExp(-dispersion * settings.time));

  return amplitude;
}

fn dispersionRelation(kLength: f32) -> f32 {
  return sqrt(GRAVITY * kLength);
}
