const SUN_POSITION: vec3f = vec3f(10.0, 10.0, 10.0);
// rgb(38, 88, 237)
const WAVE_COLOUR: vec3f = vec3f(0.149, 0.345, 0.929);
const SPECULAR_COLOUR: vec3f = vec3f(1.0, 1.0, 1.0);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let sunDirection: vec3f = normalize(SUN_POSITION - input.fragmentPosition);
  let diffuse: f32 = getDiffuse(input.normal, sunDirection);
  let specular: f32 = getSpecular(input.normal, input.fragmentPosition, 256.0);

  return vec4f(diffuse * WAVE_COLOUR + specular * SPECULAR_COLOUR, 1.0);
}

fn getDiffuse(normal: vec3f, lightDirection: vec3f) -> f32 {
  return dot(normal, lightDirection);
}

fn getSpecular(normal: vec3f, fragmentPosition: vec3f, shininess: f32) -> f32 {
  let lightDirection: vec3f = normalize(SUN_POSITION - fragmentPosition);
  let cameraDirection: vec3f = normalize(camera.position - fragmentPosition);
  let halfwayVector: vec3f = normalize(lightDirection + cameraDirection);

  return pow(max(dot(normal, halfwayVector), 0.0), shininess);
}