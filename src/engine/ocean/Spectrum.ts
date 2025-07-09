import { callCompute } from "@rendering/callCompute";
import { Shader } from "@rendering/Shader";

class Spectrum {
  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  public readonly spectrumTexture: GPUTexture;
  private constructor(
    private readonly device: GPUDevice,
    domainSize: number,
    private readonly textureSize: number,
    shader: Shader
  ) {
    shader.initialise(device);

    const settingsBuffer = device.createBuffer({
      label: "Spectrum Settings Buffer",
      size: 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      settingsBuffer,
      0,
      new Float32Array([domainSize, textureSize])
    );

    this.spectrumTexture = device.createTexture({
      label: "Spectrum Texture",
      format: "rgba32float",
      size: [textureSize, textureSize],
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Spectrum Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: {},
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 1,
          storageTexture: {
            access: "write-only",
            format: "rgba32float",
          },
          visibility: GPUShaderStage.COMPUTE,
        },
      ],
    });

    this.bindGroup = device.createBindGroup({
      label: "Spectrum Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: settingsBuffer },
        },
        {
          binding: 1,
          resource: this.spectrumTexture.createView(),
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Spectrum Compute Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = device.createComputePipeline({
      label: "Spectrum Compute Pipeline",
      layout: pipelineLayout,
      compute: {
        module: shader.shaderModule,
        entryPoint: "main",
      },
    });
  }

  public createSpectrum(): void {
    callCompute(
      this.bindGroup,
      this.pipeline,
      [this.textureSize / 8, this.textureSize / 8, 1],
      this.device
    );
  }

  public static async create(
    device: GPUDevice,
    domainSize: number,
    textureSize: number
  ): Promise<Spectrum> {
    const shader = await Shader.from(
      ["spectrum", "random", "complexNumber"],
      "Height Field Shader Module"
    );

    return new Spectrum(device, domainSize, textureSize, shader);
  }
}

export { Spectrum };
