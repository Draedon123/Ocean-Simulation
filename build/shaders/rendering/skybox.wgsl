struct Vertex {
  @builtin(vertex_index) index: u32,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) fragmentPosition: vec4f,
}

@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var texture: texture_cube<f32>;
@group(0) @binding(2) var<uniform> inversePerspectiveViewMatrix: mat4x4f;

const VERTICES: array<vec2f, 3> = array(
  vec2f(-1.0,  3.0),
  vec2f(-1.0, -1.0),
  vec2f( 3.0, -1.0),
);

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  output.position = vec4f(VERTICES[vertex.index], 1.0, 1.0);
  output.fragmentPosition = output.position;

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let transformed: vec4f = inversePerspectiveViewMatrix * input.fragmentPosition;

  return textureSample(texture, textureSampler, normalize(transformed.xyz / transformed.w) * vec3f(1.0, 1.0, -1.0));
}