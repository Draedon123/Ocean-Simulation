struct Vertex {
  @location(0) position: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) fragmentPosition: vec3f,
  @location(1) normal: vec3f,
}

struct Settings {
  time: f32,
  initialFrequency: f32,
  initialAmplitude: f32,
}

struct Camera {
  perspectiveViewMatrix: mat4x4f,
  @align(16) position: vec3f,
  @align(16) direction: vec3f,
}

struct Wave {
  direction: vec2f,
  speed: f32,
}

struct WaveFunctionOutput {
  displacement: f32,
  normal: vec3f,
}

@group(0) @binding(0) var <uniform> camera: Camera;
@group(0) @binding(1) var <uniform> settings: Settings;
@group(0) @binding(2) var <storage, read> waves: array<Wave>;
