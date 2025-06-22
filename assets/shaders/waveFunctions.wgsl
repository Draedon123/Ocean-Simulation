fn waveFunction(time: f32, position: vec2f) -> WaveFunctionOutput {
  var displacement: f32 = 0.0;
  var derivative: vec2f = vec2f(0.0, 0.0);
  var numberOfWaves: u32 = arrayLength(&waves);

  // https://thebookofshaders.com/13/
  let lacunarity: f32 = 1.25;
  let gain: f32 = 0.55;

  var frequency: f32 = waves[0].frequency;
  var amplitude: f32 = waves[0].amplitude;

  for(var i: u32 = 0; i < numberOfWaves; i++){
    var wave = waves[i];

    wave.frequency = frequency * lacunarity;
    wave.amplitude = amplitude * gain;

    frequency = wave.frequency;
    amplitude = wave.amplitude;

    displacement += waveFunctionSingle(time, position, wave);
    derivative += waveFunctionDerivative(time, position, wave);
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
  return wave.amplitude * exp(sin(dot(wave.direction, position) * wave.frequency + time * wave.phaseConstant) - 1);
}

fn waveBinormal(derivativeX: f32) -> vec3f {
  return vec3f(1.0, derivativeX, 0.0);
}

fn waveTangent(derivativeY: f32) -> vec3f {
  return vec3f(0.0, derivativeY, 1.0);
}

fn waveFunctionDerivative(time: f32, position: vec2f, wave: Wave) -> vec2f {
  let commonTerm: f32 = waveFunctionSingle(time, position, wave) * wave.frequency * cos(dot(wave.direction, position) * wave.frequency + time * wave.phaseConstant);
  
  return wave.direction * commonTerm;
}
