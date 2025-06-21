struct Vertex {
  @location(0) position: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
}

struct Settings {
  time: f32,
}

@group(0) @binding(0) var <uniform> perspectiveMatrix: mat4x4<f32>;
@group(0) @binding(1) var <uniform> viewMatrix: mat4x4<f32>;
@group(0) @binding(2) var <uniform> settings: Settings;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;
  var vertexPosition: vec3f = vertex.position;

  vertexPosition.y = waveFunction(vertexPosition.xz, settings.time);

  output.position = perspectiveMatrix * viewMatrix * vec4f(vertexPosition, 1.0);

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  // rgb(167, 38, 237)
  return vec4f(0.655, 0.149, 0.929, 1.0);
}

const WAVELENGTH: f32 = 1.0;
const FREQUENCY: f32 = 6.28318530718 / WAVELENGTH;
const AMPLITUDE: f32 = 0.1;
const PHASE_CONSTANT: f32 = 3.0;
const DIRECTION: vec2f = vec2f(1.0, 0.0);
const WAVES: u32 = 3;

fn waveFunction(position: vec2f, t: f32) -> f32 {
  var output: f32;

  for(var i: u32 = 0; i < WAVES; i++){
    output += AMPLITUDE * sin(dot(DIRECTION, position) * FREQUENCY + t * PHASE_CONSTANT);
  }

  return output;
}