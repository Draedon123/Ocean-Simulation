struct Vertex {
  @location(0) position: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
}

struct Settings {
  time: f32,
}

struct Wave {
  frequency: f32,
  amplitude: f32,
  phaseConstant: f32,
  @size(16) direction: vec2f,
}

@group(0) @binding(0) var <uniform> perspectiveMatrix: mat4x4<f32>;
@group(0) @binding(1) var <uniform> viewMatrix: mat4x4<f32>;
@group(0) @binding(2) var <uniform> settings: Settings;
@group(0) @binding(3) var <storage, read> waves: array<Wave>;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;
  var vertexPosition: vec3f = vertex.position;

  vertexPosition.y += waveFunction(settings.time, vertexPosition.xz);

  output.position = perspectiveMatrix * viewMatrix * vec4f(vertexPosition, 1.0);

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  // rgb(167, 38, 237)
  return vec4f(0.655, 0.149, 0.929, 1.0);
}

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
