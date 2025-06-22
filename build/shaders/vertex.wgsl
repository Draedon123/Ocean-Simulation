@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;
  var vertexPosition: vec3f = vertex.position;

  let waveFunctionOutput = waveFunction(settings.time, vertexPosition.xz);
  vertexPosition.y += waveFunctionOutput.displacement;

  // TODO: check if matrix multiplication should be done on cpu once instead of
  // on gpu for every vertex
  output.position = perspectiveViewMatrix * vec4f(vertexPosition, 1.0);
  output.normal = waveFunctionOutput.normal;

  return output;
}
