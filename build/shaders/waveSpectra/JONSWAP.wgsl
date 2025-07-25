struct JonswapParameters {
  g: f32,
  F: f32,
  U: f32,
}

const GAMMA: f32 = 3.3;

// TODO: FIX
fn spectrumFunction(k: vec2f) -> f32 {
  var parameters: JonswapParameters;

  parameters.g = 9.81;
  parameters.F = 400000;
  parameters.U = 100;

  let w: f32 = length(k);  
  let theta: f32 = atan2(k.y, k.x);
  
  let w_p: f32 = 22 * pow(parameters.U * parameters.F / (parameters.g * parameters.g), -0.33);
  let sigma: f32 = select(0.09, 0.07, w <= w_p);
  let alpha: f32 = 0.076 * pow(parameters.g * parameters.F / (parameters.U * parameters.U), -0.22);
  let r: f32 = exp(-((w - w_p) * (w - w_p)) / (2 * sigma * sigma * w_p * w_p));
  let D: f32 = cosine_2s(w, w_p, theta);

  return alpha * parameters.g * parameters.g * D *
    pow(w, -5) *
    exp(-1.25 * pow(w_p / w, 4)) *
    pow(GAMMA, r);
}

fn cosine_2s(w: f32, w_p: f32, theta: f32) -> f32 {
  let s: f32 = select(
    6.97  * pow(w / w_p, 5),
    9.77 * pow(w / w_p, -2.5),
    w >= w_p
  );

  return normalisationFactor(s) * pow(abs(cos((theta - 1) / 2)), 2 * s);
}

fn normalisationFactor(s: f32) -> f32 {
  let s2: f32 = s * s;
  let s3: f32 = s2 * s;
  let s4: f32 = s3 * s;

  return select(
    -2.31889e-7 * s4 + 3.26925e-5 * s3 - 1.8431e-3 * s2 + 7.28556e-2 * s + 3.27148e-1,
    -5.78426e-4 * s4 + 8.11763e-3 * s3 - 4.60819e-2 * s2 + 1.97254e-1 * s + 1.59248e-1,
    s < 5
  );
}
