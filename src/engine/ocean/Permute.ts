import { callCompute } from "@rendering/callCompute";
import { Shader } from "@rendering/Shader";
import { IFFT } from "./IFFT";

class Permute {
  private static shaders: Record<number, Shader> = {};

  private initialised: boolean;
  private bindGroup_1!: GPUBindGroup;
  private bindGroup_2!: GPUBindGroup;
  private pipeline!: GPUComputePipeline;
  private ifft!: IFFT;
  public readonly permuted: GPUTexture;
  private constructor(
    private readonly device: GPUDevice,
    private readonly shader: Shader,
    private readonly textureSize: number,
    private readonly dimensions: 1 | 2,
    label: string
  ) {
    this.initialised = false;

    this.permuted = device.createTexture({
      label,
      size: [textureSize, textureSize],
      format: this.textureFormat,
      usage: GPUTextureUsage.STORAGE_BINDING,
    });
  }

  private get textureFormat(): GPUTextureFormat {
    return this.dimensions === 1 ? "r32float" : "rg32float";
  }

  public initialise(ifft: IFFT): void {
    if (this.initialised) {
      return;
    }

    this.ifft = ifft;

    const bindGroupLayout = this.device.createBindGroupLayout({
      label: "Permute Bind Group Layout",
      entries: [
        {
          binding: 0,
          storageTexture: {
            access: "read-only",
            format: "rg32float",
          },
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 1,
          storageTexture: {
            access: "write-only",
            format: this.textureFormat,
          },
          visibility: GPUShaderStage.COMPUTE,
        },
      ],
    });

    this.bindGroup_1 = this.device.createBindGroup({
      label: "Permute Bind Group 1",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: ifft.texture_1.createView(),
        },
        {
          binding: 1,
          resource: this.permuted.createView(),
        },
      ],
    });

    this.bindGroup_2 = this.device.createBindGroup({
      label: "Permute Bind Group 2",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: ifft.texture_2.createView(),
        },
        {
          binding: 1,
          resource: this.permuted.createView(),
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      label: "Permute Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createComputePipeline({
      label: "Permute Compute Pipeline",
      layout: pipelineLayout,
      compute: {
        module: this.shader.shaderModule,
        entryPoint: "main",
      },
    });
  }

  public compute(): void {
    const bindGroup =
      this.ifft.pingPong === 0 ? this.bindGroup_1 : this.bindGroup_2;

    callCompute(
      bindGroup,
      this.pipeline,
      [this.textureSize / 8, this.textureSize / 8, 1],
      this.device
    );
  }

  private static async getShader(
    device: GPUDevice,
    dimensions: 1 | 2
  ): Promise<Shader> {
    if (!(dimensions in this.shaders)) {
      const textureFormat = dimensions === 1 ? "r" : "rg";
      const dataType = dimensions === 1 ? "f32" : "vec2f";
      const transform =
        dimensions === 1
          ? "vec4f(transformed, 0.0, 0.0, 0.0)"
          : "vec4f(transformed, 0.0, 0.0)";

      const shader = await Shader.create(
        device,
        "compute/ifft/permute",
        `${dimensions}d Permute Shader Module`,
        (code) =>
          code
            .replaceAll("__FORMAT__", textureFormat)
            .replaceAll("__DATA_TYPE__", dataType)
            .replaceAll("__TRANSFORM__", transform)
      );

      this.shaders[dimensions] = shader;
    }

    return this.shaders[dimensions];
  }

  public static async create(
    device: GPUDevice,
    textureSize: number,
    dimensions: 1 | 2,
    label: string
  ): Promise<Permute> {
    const shader = await this.getShader(device, dimensions);

    return new Permute(device, shader, textureSize, dimensions, label);
  }
}

export { Permute };
