struct Settings {
  domainSize: f32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var spectrumTexture: texture_storage_2d<rg32float, write>;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let amplitude: vec2f = calculateSpectrum(vec2f(id.xy));

  textureStore(spectrumTexture, id.xy, vec4f(amplitude, 0.0, 0.0));
}

fn calculateSpectrum(pixel: vec2f) -> vec2f {
  let samples: f32 = f32(textureDimensions(spectrumTexture).x);

  let k: vec2f = calculateWaveVector(pixel, samples, settings.domainSize);
  let kLength: f32 = length(k);

  let spectrum: f32 = spectrumFunction(k);

  let amplitude: vec2f = sqrt(0.5 * select(spectrum, 0.0, kLength == 0.0)) * vec2f(
    gaussian(pixel * 17.18032),
    gaussian(pixel * -13.468103),
  );

  return amplitude;
}
