const SUN_DIRECTION: vec3f = normalize(vec3f(0.2, 0.5, 1.0));
// rgb(38, 88, 237)
const WAVE_COLOUR: vec3f = vec3f(0.149, 0.345, 0.929);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let diffuse: f32 = dot(input.normal, SUN_DIRECTION);

  return vec4f(vec3f(diffuse * WAVE_COLOUR), 1.0);
  // return vec4f(input.normal, 1.0);
}
