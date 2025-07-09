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
  meshSize: f32,
  heightMapSize: f32,
  domainSize: f32,
}

struct Camera {
  perspectiveViewMatrix: mat4x4f,
  @align(16) position: vec3f,
  @align(16) direction: vec3f,
}

@group(0) @binding(0) var <uniform> camera: Camera;
@group(0) @binding(1) var <uniform> settings: Settings;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var skybox: texture_cube<f32>;
@group(0) @binding(4) var heightMap: texture_storage_2d<rgba32float, read>;
