import { callCompute } from "@rendering/callCompute";
import { Shader } from "@rendering/Shader";
import { IFFT } from "./IFFT";

class Permute {
  private readonly bindGroup_1: GPUBindGroup;
  private readonly bindGroup_2: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  public readonly permuted: GPUTexture;
  private constructor(
    private readonly device: GPUDevice,
    shader: Shader,
    private readonly textureSize: number,
    private readonly ifft: IFFT,
    dimensions: 1 | 2,
    label: string
  ) {
    shader.initialise(device);

    const textureFormat: GPUTextureFormat =
      dimensions === 1 ? "r32float" : "rg32float";
    const settingsBuffer = device.createBuffer({
      label: "Permute Settings Buffer",
      size: 1 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    device.queue.writeBuffer(
      settingsBuffer,
      0,
      new Float32Array([textureSize])
    );

    this.permuted = device.createTexture({
      label,
      size: [textureSize, textureSize],
      format: textureFormat,
      usage: GPUTextureUsage.STORAGE_BINDING,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Permute Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: {},
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 1,
          storageTexture: {
            access: "read-only",
            format: "rg32float",
          },
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 2,
          storageTexture: {
            access: "write-only",
            format: textureFormat,
          },
          visibility: GPUShaderStage.COMPUTE,
        },
      ],
    });

    this.bindGroup_1 = device.createBindGroup({
      label: "Permute Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: settingsBuffer },
        },
        {
          binding: 1,
          resource: ifft.texture_1.createView(),
        },
        {
          binding: 2,
          resource: this.permuted.createView(),
        },
      ],
    });

    this.bindGroup_2 = device.createBindGroup({
      label: "Permute Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: settingsBuffer },
        },
        {
          binding: 1,
          resource: ifft.texture_2.createView(),
        },
        {
          binding: 2,
          resource: this.permuted.createView(),
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Permute Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = device.createComputePipeline({
      label: "Permute Pipeline",
      layout: pipelineLayout,
      compute: {
        module: shader.shaderModule,
        entryPoint: "main",
      },
    });
  }

  public call(): void {
    const bindGroup =
      this.ifft.pingPong === 0 ? this.bindGroup_1 : this.bindGroup_2;

    callCompute(
      bindGroup,
      this.pipeline,
      [this.textureSize / 8, this.textureSize / 8, 1],
      this.device
    );
  }

  public static async create(
    device: GPUDevice,
    textureSize: number,
    ifft: IFFT,
    dimensions: 1 | 2,
    label: string
  ): Promise<Permute> {
    const shader = await Shader.from("permute", "Permute Shader Module");

    const textureFormat = dimensions === 1 ? "r" : "rg";
    const dataType = dimensions === 1 ? "f32" : "vec2f";
    const transform =
      dimensions === 1
        ? "vec4f(transformed, 0.0, 0.0, 0.0)"
        : "vec4f(transformed, 0.0, 0.0)";

    shader.code = shader.code
      .replaceAll("__FORMAT__", textureFormat)
      .replaceAll("__DATA_TYPE__", dataType)
      .replaceAll("__TRANSFORM__", transform);

    return new Permute(device, shader, textureSize, ifft, dimensions, label);
  }
}

export { Permute };
