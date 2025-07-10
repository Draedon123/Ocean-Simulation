@group(0) @binding(0) var input: texture_storage_2d<rg32float, read>;
@group(0) @binding(1) var output: texture_storage_2d<__FORMAT__32float, write>;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let textureSize: f32 = f32(textureDimensions(input).x);
  let permutation: f32 = f32((id.x + id.y) % 2) * -2 + 1;
  let value: __DATA_TYPE__ = textureLoad(input, id.xy).__FORMAT__;
  let transformed: __DATA_TYPE__ = permutation * value / (textureSize * textureSize);

  textureStore(output, id.xy, __TRANSFORM__);
}
