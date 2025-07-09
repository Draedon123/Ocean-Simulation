// https://people.computing.clemson.edu/~jtessen/reports/papers_files/coursenotes2004.pdf

struct Settings {
  domainSize: f32,
  samples: f32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var spectrumTexture: texture_storage_2d<rgba32float, write>;

const PI: f32 = 3.141592653589793;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let amplitude: vec4f = spectrum(vec2f(id.xy));

  textureStore(spectrumTexture, id.xy, amplitude);
}

fn spectrum(pixel: vec2f) -> vec4f {
  let k: vec2f = 2 * PI * (pixel - settings.samples / 2) / settings.domainSize;
  let kLength: f32 = length(k);
  // let theta: f32 = atan2(k.y, k.x);

  // var params: JonswapParameters;

  // params.g = 9.81;
  // params.F = 400000;
  // params.U = 10;

  let spectrum: f32 = phillipsSpectrum(k, kLength);
  let spectrumConjugate: f32 = phillipsSpectrum(-k, kLength);
  // let spectrum: f32 = JONSWAP(kLength, theta, params);
  // let spectrumConjugate: f32 = JONSWAP(kLength, theta + PI, params);

  let amplitude: vec2f = sqrt(0.5 * select(spectrum, 0.0, kLength == 0.0)) * vec2f(
    gaussian(pixel * 17.18032),
    gaussian(pixel * -13.468103),
  );

  let conjugateAmplitude: vec2f =  sqrt(0.5 * select(spectrumConjugate, 0.0, kLength == 0.0)) * vec2f(
    gaussian(pixel * 19.68491),
    // negative y for conjugate
    -gaussian(pixel * -23.95163),
  );

  return vec4f(amplitude, conjugateAmplitude);
}

fn phillipsSpectrum(k: vec2f, kLength: f32) -> f32 {
  let windDirection: vec2f = normalize(vec2f(-1.0, 1.0));
  let windSpeed: f32 = 20;
  let kSquared: f32 = kLength * kLength;
  let L: f32 = windSpeed * windSpeed / 9.81;
  let spectrum: f32 = exp(-1 / (kSquared * L * L)) /
    pow(kSquared, 2) *
    pow(dot(normalize(k), windDirection), 2) *
    exp(-kSquared * pow(settings.domainSize / 2000, 2));

  return spectrum;
}
