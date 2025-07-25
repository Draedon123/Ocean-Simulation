fn spectrumFunction(k: vec2f) -> f32 {
  let A: f32 = 1.0;
  let windDirection: vec2f = normalize(vec2f(1.0, 1.0));
  let windSpeed: f32 = 30;
  let kSquared: f32 = dot(k, k);
  let kSquaredReciprocal: f32 = 1 / kSquared;
  let L: f32 = windSpeed * windSpeed / 9.81;
  let l: f32 = 1e-3 * settings.domainSize;

  let spectrum: f32 = A *
    exp(-kSquaredReciprocal / (L * L) - kSquared * l * l) *
    kSquaredReciprocal * kSquaredReciprocal *
    pow(dot(normalize(k), windDirection), 6);

  return spectrum;
}
