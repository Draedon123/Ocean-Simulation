// computes e^(i*theta)
fn complexExp(theta: f32) -> vec2f {
  let x: f32 = cos(theta);
  let y: f32 = sin(theta);

  return vec2f(x, y);
}

fn complexMultiply(a: vec2f, b: vec2f) -> vec2f {
  let real: f32 = a.x * b.x - a.y * b.y;
  let imaginary: f32 = a.x * b.y + a.y * b.x;
  
  return vec2f(real, imaginary);
}

fn complexConjugate(a: vec2f) -> vec2f {
  return a * vec2f(1.0, -1.0);
}