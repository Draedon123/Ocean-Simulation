const TWO_PI: f32 = 6.283185307179586;

fn calculateWaveVector(pixel: vec2f, samples: f32, domainSize: f32) -> vec2f {
  return TWO_PI * (pixel - samples / 2) / settings.domainSize;
}
