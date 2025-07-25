fn gaussian(state: vec2f) -> f32 {
  var value: f32 = 0;
  var i: f32 = 0;

  while(true){
    i += 1.0;
    
    let u: f32 = uniformFloat(state + i * 13.79813);

    // don't want to divide by 0
    if(abs(u) == 0){
      continue;
    }

    let v: f32 = 1.7156 * (uniformFloat(state - i * 23.61874) - 0.5);

    let x: f32 = u - 0.449871;
    let y: f32 = abs(v) + 0.386595;
    let Q: f32 = x * x + y * (0.196 * y - 0.25472 * x);

    if(Q < 0.27597){
      value = v / u;
      break;
    } else if (Q > 0.27846 || v * v > -4 * u * u * log(u)){
      continue;
    }

    value = v / u;
    break;
  }

  return value;
}

fn uniformFloat(state: vec2f) -> f32 {
  return fract(sin(dot(state, vec2(12.9898, 78.233))) * 43758.5453123);
}
