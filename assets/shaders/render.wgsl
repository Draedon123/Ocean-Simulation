struct Vertex {
  @location(0) position: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
}

@group(0) @binding(0) var <uniform> perspectiveMatrix: mat4x4<f32>;
@group(0) @binding(1) var <uniform> viewMatrix: mat4x4<f32>;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  output.position = perspectiveMatrix * viewMatrix * vec4f(vertex.position, 1.0);

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  // rgb(167, 38, 237)
  return vec4f(0.655, 0.149, 0.929, 1.0);
}