import { callCompute } from "@rendering/callCompute";
import { Shader } from "@rendering/Shader";
import { bufferData } from "@utils/bufferData";

class Spectrum {
  private static readonly shaders: Partial<Record<WaveSpectrum, Shader>> = {};

  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  public readonly spectrumTexture: GPUTexture;
  private constructor(
    private readonly device: GPUDevice,
    domainSize: number,
    private readonly textureSize: number,
    shader: Shader
  ) {
    const settingsBuffer = bufferData(
      device,
      "Spectrum Settings Buffer",
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      new Float32Array([domainSize])
    );

    this.spectrumTexture = device.createTexture({
      label: "Spectrum Texture",
      format: "rg32float",
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
            format: "rg32float",
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
      label: "Spectrum Pipeline Layout",
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

  private static async getShader(
    device: GPUDevice,
    spectrum: WaveSpectrum
  ): Promise<Shader> {
    if (!(spectrum in Spectrum.shaders)) {
      const shader = await Shader.create(
        device,
        [
          "compute/spectrum",
          "utils/random",
          "utils/complexNumber",
          "utils/waveVector",
          `waveSpectra/${spectrum}`,
        ],
        "Spectrum Shader Module"
      );

      Spectrum.shaders[spectrum] = shader;
    }

    return Spectrum.shaders[spectrum] as Shader;
  }

  public static async create(
    device: GPUDevice,
    domainSize: number,
    textureSize: number,
    spectrum: WaveSpectrum
  ): Promise<Spectrum> {
    const shader = await Spectrum.getShader(device, spectrum);

    return new Spectrum(device, domainSize, textureSize, shader);
  }
}

export { Spectrum };
