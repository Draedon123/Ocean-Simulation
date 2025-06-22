@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;
  var vertexPosition: vec3f = vertex.position;

  vertexPosition.y += waveFunction(settings.time, vertexPosition.xz);

  // TODO: check if matrix multiplication should be done on cpu once instead of
  // on gpu for every vertex
  output.position = perspectiveViewMatrix * vec4f(vertexPosition, 1.0);

  return output;
}
