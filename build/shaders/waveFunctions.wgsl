fn waveFunction(time: f32, position: vec2f) -> WaveFunctionOutput {
  var displacement: f32 = 0.0;
  var derivative: vec2f = vec2f(0.0, 0.0);
  var numberOfWaves: u32 = arrayLength(&waves);

  for(var i: u32 = 0; i < numberOfWaves; i++){
    displacement += waveFunctionSingle(time, position, waves[i]);
    derivative += waveFunctionDerivative(time, position, waves[i]);
  }

  let normal: vec3f = normalize(cross(
    waveTangent(derivative.y),
    waveBinormal(derivative.x),
  ));

  var output: WaveFunctionOutput;

  output.displacement = displacement;
  output.normal = normal;

  return output;
}

fn waveFunctionSingle(time: f32, position: vec2f, wave: Wave) -> f32 {
  return wave.amplitude * sin(dot(wave.direction, position) * wave.frequency + time * wave.phaseConstant);
}

fn waveBinormal(derivativeX: f32) -> vec3f {
  return vec3f(1.0, derivativeX, 0.0);
}

fn waveTangent(derivativeY: f32) -> vec3f {
  return vec3f(0.0, derivativeY, 1.0);
}

fn waveFunctionDerivative(time: f32, position: vec2f, wave: Wave) -> vec2f {
  let commonTerm: f32 = wave.amplitude * wave.frequency * cos(dot(wave.direction, position) * wave.frequency + time * wave.phaseConstant);
  
  return wave.direction * commonTerm;
}
