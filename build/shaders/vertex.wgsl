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
@group(0) @binding(4) var heightMap: texture_storage_2d<r32float, read>;
@group(0) @binding(5) var slopeVector: texture_storage_2d<rg32float, read>;
@group(0) @binding(6) var displacementField: texture_storage_2d<rg32float, read>;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  let heightMapSize: f32 = f32(textureDimensions(heightMap).x);
  let samplePoint: vec2u = vec2u(vertex.position.xz * heightMapSize / settings.meshSize + heightMapSize / 2);
  let displacementData: vec2f = textureLoad(displacementField, samplePoint).rg;
  let dy: f32 = textureLoad(heightMap, samplePoint).x;
  // ??? * 20? idk, the slopes were too small so...
  // TODO: FIX
  let slopeData: vec2f = textureLoad(slopeVector, samplePoint).rg * 20;
  let normal: vec3f = normalize(vec3f(-slopeData.x, 1, -slopeData.y));

  let vertexPosition: vec3f = vertex.position + vec3f(
    displacementData.x,
    dy,
    displacementData.y,
  );

  output.fragmentPosition = vertexPosition;
  output.position = camera.perspectiveViewMatrix * vec4f(vertexPosition, 1.0);
  output.normal = normal;

  return output;
}
