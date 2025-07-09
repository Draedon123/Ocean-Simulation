@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;
  var vertexPosition: vec3f = vertex.position;

  let samplePoint: vec2f = vertexPosition.xz * settings.heightMapSize / settings.meshSize + settings.heightMapSize / 2;
  let delta: vec2f = sign(vec2f(samplePoint - settings.heightMapSize / 2));
  let dy: f32 = textureLoad(heightMap, vec2u(samplePoint)).x;
  let f_1: f32 = textureLoad(heightMap, vec2u(samplePoint + delta)).x;
  let f_2: f32 = textureLoad(heightMap, vec2u(samplePoint - delta)).x;
  let derivative: f32 = (f_1 - f_2) / 2;
  let normal: vec3f = normalize(cross(
    vec3f(0.0, derivative, 1.0),
    vec3f(1.0, derivative, 0.0),
  ));

  vertexPosition.y += 5 * dy;

  output.fragmentPosition = vertexPosition;
  output.position = camera.perspectiveViewMatrix * vec4f(vertexPosition, 1.0);
  output.normal = normal;

  return output;
}
