struct Settings {
  stage: u32,
}

@group(0) @binding(0) var <uniform> settings: Settings;
@group(0) @binding(1) var butterflyTexture: texture_storage_2d<rgba32float, read>;
@group(0) @binding(2) var textureIn: texture_storage_2d<rg32float, read>;
@group(0) @binding(3) var textureOut: texture_storage_2d<rg32float, write>;

@compute
@workgroup_size(8, 8, 1)
fn horizontal(@builtin(global_invocation_id) id: vec3u) {
  let data: vec4f = textureLoad(butterflyTexture, vec2u(settings.stage, id.x));
  let p: vec2f = textureLoad(textureIn, vec2u(u32(data.z), id.y)).rg;
  let q: vec2f = textureLoad(textureIn, vec2u(u32(data.w), id.y)).rg;
  let twiddleFactor: vec2f = data.rg;

  let value: vec2f = p + complexMultiply(q, twiddleFactor);
  textureStore(textureOut, id.xy, vec4(value, 0.0, 0.0));
}

@compute
@workgroup_size(8, 8, 1)
fn vertical(@builtin(global_invocation_id) id: vec3u) {
  let data: vec4f = textureLoad(butterflyTexture, vec2u(settings.stage, id.y));
  let p: vec2f = textureLoad(textureIn, vec2u(id.x, u32(data.z))).rg;
  let q: vec2f = textureLoad(textureIn, vec2u(id.x, u32(data.w))).rg;
  let twiddleFactor: vec2f = data.rg;

  let value: vec2f = p + complexMultiply(q, twiddleFactor);
  textureStore(textureOut, id.xy, vec4(value, 0.0, 0.0));
}
