fn waveFunction(time: f32, position: vec2f) -> f32 {
  var output: f32;
  var numberOfWaves:u32 = arrayLength(&waves);

  for(var i: u32 = 0; i < numberOfWaves; i++){
    output += waveFunctionSingle(time, position, waves[i]);
  }

  return output;
}

fn waveFunctionSingle(time: f32, position: vec2f, wave: Wave) -> f32 {
  return wave.amplitude * sin(dot(wave.direction, position) * wave.frequency + time * wave.phaseConstant);
}
