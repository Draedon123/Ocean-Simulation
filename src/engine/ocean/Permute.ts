import { callCompute } from "@rendering/callCompute";
import { Shader } from "@rendering/Shader";
import { IFFT } from "./IFFT";

class Permute {
  private readonly bindGroup_1: GPUBindGroup;
  private readonly bindGroup_2: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  public readonly heightMap: GPUTexture;
  private constructor(
    private readonly device: GPUDevice,
    shader: Shader,
    private readonly textureSize: number,
    private readonly ifft: IFFT
  ) {
    shader.initialise(device);

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

    this.heightMap = device.createTexture({
      label: "Wave Height Map",
      size: [textureSize, textureSize],
      format: "rgba32float",
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
            format: "rgba32float",
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
          resource: this.heightMap.createView(),
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
          resource: this.heightMap.createView(),
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

  public createHeightMap(): void {
    this.ifft.call();

    const bindGroup =
      this.ifft.pingPong === 0 ? this.bindGroup_1 : this.bindGroup_2;
    callCompute(
      bindGroup,
      this.pipeline,
      [this.textureSize, this.textureSize, 1],
      this.device
    );
  }

  public static async create(
    device: GPUDevice,
    textureSize: number,
    ifft: IFFT
  ): Promise<Permute> {
    const shader = await Shader.from("permute", "Permute Shader Module");

    return new Permute(device, shader, textureSize, ifft);
  }
}

export { Permute };
