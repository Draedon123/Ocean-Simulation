const SUN_POSITION: vec3f = vec3f(-10.0, 20.0, 10.0);
// rgb(30, 61, 153)
const WAVE_COLOUR: vec3f = vec3f(0.118, 0.240, 0.6);
const SPECULAR_COLOUR: vec3f = vec3f(1.0, 1.0, 1.0);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let sunDirection: vec3f = normalize(SUN_POSITION - input.fragmentPosition);
  let diffuse: f32 = getDiffuse(input.normal, sunDirection);
  let specular: f32 = getSpecular(input.normal, input.fragmentPosition, 256.0);
  let fresnel = getFresnel(input.fragmentPosition, input.normal);

  let diffuseColour: vec3f = diffuse * WAVE_COLOUR;
  let specularColour: vec3f = specular * SPECULAR_COLOUR;
  let skyboxColour: vec3f = fresnel * textureSample(skybox, textureSampler, input.normal).xyz;

  return vec4f(diffuseColour + specularColour + skyboxColour, 1.0);
}

fn getDiffuse(normal: vec3f, lightDirection: vec3f) -> f32 {
  return dot(normal, lightDirection);
}

fn getSpecular(normal: vec3f, fragmentPosition: vec3f, shininess: f32) -> f32 {
  let lightDirection: vec3f = normalize(SUN_POSITION - fragmentPosition);
  let cameraDirection: vec3f = normalize(camera.position - fragmentPosition);
  let halfwayVector: vec3f = normalize(lightDirection + cameraDirection);

  let fresnel = getFresnel(fragmentPosition, normal);

  return fresnel * pow(max(dot(normal, halfwayVector), 0.0), shininess);
}

fn getFresnel(fragmentPosition: vec3f, normal: vec3f) -> f32 {
  let cameraDirection: vec3f = normalize(camera.position - fragmentPosition);
  let cosTheta: f32 = dot(cameraDirection, normal);
  let r0: f32 = (1.33 - 1.0) * (1.33 - 1.0) / ((1.33 + 1.0) * (1.33 + 1.0));
  let fresnel: f32 = r0 + (1.0 - r0) * pow(1.0 - cosTheta, 5);

  return fresnel;
}