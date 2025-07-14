import { Shader } from "@rendering/Shader";
import { IFFT } from "./IFFT";
import { ButterflyTexture } from "./ButterflyTexture";
import { callCompute } from "@rendering/callCompute";

class DisplacementField {
  private readonly settingsBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  private constructor(
    private readonly device: GPUDevice,
    shader: Shader,
    heightAmplitudesTexture: GPUTexture,
    fourierComponentsTexture: GPUTexture,
    domainSize: number,
    private readonly textureSize: number,
    private readonly ifft: IFFT
  ) {
    shader.initialise(device);

    this.settingsBuffer = device.createBuffer({
      label: "Displacement Field Settings Buffer",
      size: 1 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([domainSize])
    );

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Displacement Field Bind Group Layout",
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
      label: "Displacement Field Bind Group",
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
      label: "Displacement Field Compute Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = device.createComputePipeline({
      label: "Displacement Field Compute Pipeline",
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

  public get displacementField(): GPUTexture {
    return this.ifft.activeTexture;
  }

  public static async create(
    device: GPUDevice,
    heightAmplitudesTexture: GPUTexture,
    domainSize: number,
    textureSize: number,
    butterflyTexture?: ButterflyTexture
  ): Promise<DisplacementField> {
    const shader = await Shader.from(
      ["displacementField", "complexNumber"],
      "Displacement Field Shader Module"
    );

    const fourierComponentsTexture = device.createTexture({
      label: "Displacement Field Fourier Components Texture",
      size: [textureSize, textureSize],
      format: "rg32float",
      usage: GPUTextureUsage.STORAGE_BINDING,
    });

    const ifft = await IFFT.create(
      device,
      textureSize,
      fourierComponentsTexture,
      2,
      "Displacement Field",
      butterflyTexture
    );

    return new DisplacementField(
      device,
      shader,
      heightAmplitudesTexture,
      fourierComponentsTexture,
      domainSize,
      textureSize,
      ifft
    );
  }
}

export { DisplacementField };
