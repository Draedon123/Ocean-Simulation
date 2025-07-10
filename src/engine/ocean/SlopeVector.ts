import { Shader } from "@rendering/Shader";
import { ButterflyTexture } from "./ButterflyTexture";
import { IFFT } from "./IFFT";
import { callCompute } from "@rendering/callCompute";

class SlopeVector {
  private readonly settingsBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  private constructor(
    private readonly device: GPUDevice,
    shader: Shader,
    private readonly ifft: IFFT,
    heightAmplitudesTexture: GPUTexture,
    fourierComponentsTexture: GPUTexture,
    private readonly textureSize: number,
    domainSize: number
  ) {
    shader.initialise(device);

    this.settingsBuffer = device.createBuffer({
      label: "Slope Vector Settings Buffer",
      size: 1 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([domainSize])
    );

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Slope Vector Bind Group Layout",
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
      label: "Slope Vector Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.settingsBuffer },
        },
        {
          binding: 1,
          resource: heightAmplitudesTexture.createView(),
        },
        {
          binding: 2,
          resource: fourierComponentsTexture.createView(),
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Slope Vector Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = device.createComputePipeline({
      label: "Slope Vector Compute Pipeline",
      layout: pipelineLayout,
      compute: {
        module: shader.shaderModule,
        entryPoint: "main",
      },
    });
  }

  public create(): void {
    callCompute(
      this.bindGroup,
      this.pipeline,
      [this.textureSize / 8, this.textureSize / 8, 1],
      this.device
    );

    this.ifft.compute();
  }

  public get slopeVector(): GPUTexture {
    return this.ifft.activeTexture;
  }

  public static async create(
    device: GPUDevice,
    heightAmplitudesTexture: GPUTexture,
    textureSize: number,
    domainSize: number,
    butterflyTexture?: ButterflyTexture
  ): Promise<SlopeVector> {
    const shader = await Shader.from(
      ["slopeVector", "complexNumber"],
      "Slope Vector Shader Module"
    );

    const fourierComponentsTexture = device.createTexture({
      label: "Slope Vector Fourier Components Texture",
      size: [textureSize, textureSize],
      format: "rg32float",
      usage: GPUTextureUsage.STORAGE_BINDING,
    });

    const ifft = await IFFT.create(
      device,
      textureSize,
      fourierComponentsTexture,
      2,
      "Slope Vector",
      butterflyTexture
    );

    return new SlopeVector(
      device,
      shader,
      ifft,
      heightAmplitudesTexture,
      fourierComponentsTexture,
      textureSize,
      domainSize
    );
  }
}

export { SlopeVector };
