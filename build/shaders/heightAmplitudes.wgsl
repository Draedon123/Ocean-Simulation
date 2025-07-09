// https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf

struct Settings {
  time: f32,
  domainSize: f32,
  samples: f32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var spectrumTexture: texture_storage_2d<rg32float, read>;
@group(0) @binding(2) var heightAmplitudesTexture: texture_storage_2d<rg32float, write>;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  for(var x: u32 = 0; x < 8; x++){
    for(var y: u32 = 0; y < 8; y++){
      let pixel: vec2u = vec2u(id.x * 8 + x, id.y * 8 + y);
      let heightAmplitude: vec2f = heightAmplitude(pixel);

      textureStore(heightAmplitudesTexture, pixel, vec4f(heightAmplitude, 0.0, 0.0));
    }
  }
}

const PI: f32 = 3.141592653589793;
const GRAVITY: f32 = 9.81;

fn heightAmplitude(pixel: vec2u) -> vec2f {
  let h0: vec2f = textureLoad(spectrumTexture, pixel).rg;
  let h0_conjugate: vec2f = textureLoad(spectrumTexture, u32(settings.samples) - pixel).rg *
    // conjugate
    vec2f(1.0, -1.0);

  let k: vec2f = 2 * PI * (vec2f(pixel) - settings.samples / 2) / settings.domainSize;
  let kLength: f32 = length(k);

  let dispersion: f32 = dispersionRelation(kLength);

  let amplitude: vec2f = 
    complexMultiply(h0, complexExp(dispersion * settings.time)) + 
    complexMultiply(h0_conjugate, complexExp(-dispersion * settings.time));

  return amplitude;
}

fn dispersionRelation(kLength: f32) -> f32 {
  return sqrt(GRAVITY * kLength);
}
