// https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf

struct Settings {
  domainSize: f32,
  samples: f32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var spectrumTexture: texture_storage_2d<rg32float, write>;

const PI: f32 = 3.141592653589793;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let amplitude: vec2f = spectrum(vec2f(id.xy));

  textureStore(spectrumTexture, id.xy, vec4f(amplitude, 0.0, 0.0));
}

fn spectrum(pixel: vec2f) -> vec2f {
  let k: vec2f = 2 * PI * (pixel - settings.samples / 2) / settings.domainSize;
  let kLength: f32 = length(k);
  // let theta: f32 = atan2(k.y, k.x);

  // var params: JonswapParameters;

  // params.g = 9.81;
  // params.F = 400000;
  // params.U = 10;

  let spectrum: f32 = phillipsSpectrum(k, kLength);
  // let spectrum: f32 = JONSWAP(kLength, theta, params);

  let amplitude: vec2f = sqrt(0.5 * select(spectrum, 0.0, kLength == 0.0)) * vec2f(
    gaussian(pixel * 17.18032),
    gaussian(pixel * -13.468103),
  );

  return amplitude;
}

fn phillipsSpectrum(k: vec2f, kLength: f32) -> f32 {
  let A: f32 = 1.0;
  let windDirection: vec2f = normalize(vec2f(1.0, 0.0));
  let windSpeed: f32 = 30;
  let kSquared: f32 = kLength * kLength;
  let kSquaredReciprocal: f32 = 1 / kSquared;
  let L: f32 = windSpeed * windSpeed / 9.81;
  let l: f32 = 1e-3 * settings.domainSize;

  let spectrum: f32 = A *
    exp(-kSquaredReciprocal / (L * L) - kSquared * l * l) *
    kSquaredReciprocal * kSquaredReciprocal *
    pow(dot(normalize(k), windDirection), 6);

  return spectrum;
}
