const SUN_DIRECTION: vec3f = normalize(-vec3f(3.3, -1.0, -3.0));
// rgb(40, 80, 201)
const WAVE_COLOUR: vec3f = vec3f(0.157, 0.314, 0.788);
// rgb(255, 255, 255)
const SPECULAR_COLOUR: vec3f = vec3f(1.0, 1.0, 1.0);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {  
  let diffuse: f32 = getDiffuse(input.normal, SUN_DIRECTION);
  let specular: f32 = getSpecular(input.normal, input.fragmentPosition, 32.0);
  let fresnel = getFresnel(input.fragmentPosition, input.normal);

  let diffuseColour: vec3f = diffuse * WAVE_COLOUR;
  let specularColour: vec3f = fresnel * specular * SPECULAR_COLOUR;
  let skyboxColour: vec3f = fresnel * textureSample(skybox, textureSampler, input.normal).xyz;

  return vec4f(diffuseColour + specularColour + skyboxColour, 1.0);
  // return vec4f(input.normal, 1.0);
}

fn getDiffuse(normal: vec3f, lightDirection: vec3f) -> f32 {
  return dot(normal, lightDirection);
}

fn getSpecular(normal: vec3f, fragmentPosition: vec3f, shininess: f32) -> f32 {
  let cameraDirection: vec3f = normalize(camera.position - fragmentPosition);
  let halfwayVector: vec3f = normalize(SUN_DIRECTION + cameraDirection);

  let fresnel = getFresnel(fragmentPosition, normal);

  return fresnel * pow(max(dot(normal, halfwayVector), 0.0), shininess);
}

const WATER_REFRACTIVE_INDEX: f32 = 1.33;
const AIR_REFRACTIVE_INDEX: f32 = 1.0;

// Schlick's Approximation
fn getFresnel(fragmentPosition: vec3f, normal: vec3f) -> f32 {
  let cameraDirection: vec3f = normalize(camera.position - fragmentPosition);
  let cosTheta: f32 = dot(cameraDirection, normal);

  let r0: f32 = 
    (WATER_REFRACTIVE_INDEX - AIR_REFRACTIVE_INDEX) *
    (WATER_REFRACTIVE_INDEX - AIR_REFRACTIVE_INDEX) /
    ((WATER_REFRACTIVE_INDEX + AIR_REFRACTIVE_INDEX) *
    (WATER_REFRACTIVE_INDEX + AIR_REFRACTIVE_INDEX));
  let fresnel: f32 = r0 + (1.0 - r0) * pow(1.0 - cosTheta, 5);

  return fresnel;
}