fn waveFunction(time: f32, position: vec2f) -> WaveFunctionOutput {
  var displacement: f32 = 0.0;
  var derivative: vec2f = vec2f(0.0, 0.0);
  var numberOfWaves: u32 = arrayLength(&waves);

  // https://thebookofshaders.com/13/
  let lacunarity: f32 = 1.2;
  let gain: f32 = 0.55;

  var frequency: f32 = settings.initialFrequency;
  var amplitude: f32 = settings.initialAmplitude;

  for(var i: u32 = 0; i < numberOfWaves; i++){
    let wave = &waves[i];

    frequency *= lacunarity;
    amplitude *= gain;

    displacement += waveFunctionSingle(time, position, wave, frequency, amplitude);
    derivative += waveFunctionDerivative(time, position, wave, frequency, amplitude);
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

fn waveFunctionSingle(
  time: f32,
  position: vec2f,
  wave: ptr<storage, Wave>,
  frequency: f32,
  amplitude: f32
) -> f32 {
  let phaseConstant = frequency * wave.speed;  
  return amplitude *
    exp(
      sin(
        dot(wave.direction, position) * frequency +
        time * phaseConstant
      ) - 1
    );
}

fn waveBinormal(derivativeX: f32) -> vec3f {
  return vec3f(1.0, derivativeX, 0.0);
}

fn waveTangent(derivativeY: f32) -> vec3f {
  return vec3f(0.0, derivativeY, 1.0);
}

fn waveFunctionDerivative(
  time: f32,
  position: vec2f,
  wave: ptr<storage, Wave>,
  frequency: f32,
  amplitude: f32
) -> vec2f {
  let phaseConstant = frequency * wave.speed;  
  let commonTerm: f32 = 
    frequency *
    waveFunctionSingle(time, position, wave, frequency, amplitude) *
    cos(dot(wave.direction, position) * frequency + time * phaseConstant);
  
  return wave.direction * commonTerm;
}
