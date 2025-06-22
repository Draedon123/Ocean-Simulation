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

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4<f32>;
@group(0) @binding(1) var <uniform> settings: Settings;
@group(0) @binding(2) var <storage, read> waves: array<Wave>;
