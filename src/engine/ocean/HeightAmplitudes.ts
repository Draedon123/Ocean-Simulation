import { callCompute } from "@rendering/callCompute";
import { Shader } from "@rendering/Shader";
import { Spectrum } from "./Spectrum";

class HeightAmplitudes {
  private readonly settingsBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  public readonly texture: GPUTexture;
  private constructor(
    private readonly device: GPUDevice,
    private readonly spectrum: Spectrum,
    private readonly domainSize: number,
    public readonly textureSize: number,
    shader: Shader
  ) {
    shader.initialise(device);
    this.spectrum.createSpectrum();

    this.settingsBuffer = device.createBuffer({
      label: "Height Amplitudes Settings Buffer",
      size: 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    this.writeSettings(0, domainSize);

    this.texture = device.createTexture({
      label: "Height Amplitudes Texture",
      format: "rg32float",
      size: [textureSize, textureSize],
      usage: GPUTextureUsage.STORAGE_BINDING,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Height Amplitudes Bind Group Layout",
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
            format: "rg32float",
          },
          visibility: GPUShaderStage.COMPUTE,
        },
      ],
    });

    this.bindGroup = device.createBindGroup({
      label: "Height Amplitudes Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.settingsBuffer },
        },
        {
          binding: 1,
          resource: this.spectrum.spectrumTexture.createView(),
        },
        {
          binding: 2,
          resource: this.texture.createView(),
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Height Amplitudes Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = device.createComputePipeline({
      label: "Height Amplitudes Compute Pipeline",
      layout: pipelineLayout,
      compute: {
        module: shader.shaderModule,
        entryPoint: "main",
      },
    });
  }

  public createSpectrum(time: number): void {
    this.writeSettings(time, this.domainSize);

    callCompute(
      this.bindGroup,
      this.pipeline,
      [this.textureSize / 8, this.textureSize / 8, 1],
      this.device
    );
  }

  public writeSettings(time: number, domainSize: number): void {
    this.device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([time, domainSize])
    );
  }

  public get spectrumTexture(): GPUTexture {
    return this.spectrum.spectrumTexture;
  }

  public static async create(
    device: GPUDevice,
    domainSize: number,
    textureSize: number
  ): Promise<HeightAmplitudes> {
    const shader = await Shader.from(
      ["heightAmplitudes", "complexNumber"],
      "Height Amplitudes Shader Module"
    );

    const spectrum = await Spectrum.create(device, domainSize, textureSize);

    return new HeightAmplitudes(
      device,
      spectrum,
      domainSize,
      textureSize,
      shader
    );
  }
}

export { HeightAmplitudes };
