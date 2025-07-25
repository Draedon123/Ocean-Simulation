import { Shader } from "@rendering/Shader";
import { ButterflyTexture } from "./ButterflyTexture";
import { IFFT } from "./IFFT";
import { callCompute } from "@rendering/callCompute";
import { bufferData } from "@utils/bufferData";

class SlopeAndDisplacement {
  private readonly settingsBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  private constructor(
    private readonly device: GPUDevice,
    shader: Shader,
    private readonly slopeIFFT: IFFT,
    private readonly displacementIFFT: IFFT,
    heightAmplitudesTexture: GPUTexture,
    private readonly textureSize: number,
    domainSize: number
  ) {
    this.settingsBuffer = bufferData(
      device,
      "Slope and Displacement Settings Buffer",
      GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      new Float32Array([domainSize])
    );

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Slope and Displacement Bind Group Layout",
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
        {
          binding: 3,
          storageTexture: {
            access: "write-only",
            format: "rg32float",
          },
          visibility: GPUShaderStage.COMPUTE,
        },
      ],
    });

    this.bindGroup = device.createBindGroup({
      label: "Slope and Displacement Bind Group",
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
          resource: slopeIFFT.texture_1.createView(),
        },
        {
          binding: 3,
          resource: displacementIFFT.texture_1.createView(),
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Slope and Displacement Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = device.createComputePipeline({
      label: "Slope and Displacement Compute Pipeline",
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

    this.slopeIFFT.compute();
    this.displacementIFFT.compute();
  }

  public get slopeVector(): GPUTexture {
    return this.slopeIFFT.activeTexture;
  }

  public get displacementField(): GPUTexture {
    return this.displacementIFFT.activeTexture;
  }

  public static async create(
    device: GPUDevice,
    heightAmplitudesTexture: GPUTexture,
    textureSize: number,
    domainSize: number,
    butterflyTexture?: ButterflyTexture
  ): Promise<SlopeAndDisplacement> {
    const shader = await Shader.create(
      device,
      [
        "compute/slopeAndDisplacement",
        "utils/complexNumber",
        "utils/waveVector",
      ],
      "Slope and Displacement Shader Module"
    );

    const slopeFourierComponentsTexture = device.createTexture({
      label: "Slope Vector Fourier Components Texture",
      size: [textureSize, textureSize],
      format: "rg32float",
      usage: GPUTextureUsage.STORAGE_BINDING,
    });

    const displacementFourierComponentsTexture = device.createTexture({
      label: "Displacement Field Fourier Components Texture",
      size: [textureSize, textureSize],
      format: "rg32float",
      usage: GPUTextureUsage.STORAGE_BINDING,
    });

    const slopeIFFT = await IFFT.create(
      device,
      textureSize,
      slopeFourierComponentsTexture,
      2,
      "Slope Vector",
      butterflyTexture
    );

    const displacementIFFT = await IFFT.create(
      device,
      textureSize,
      displacementFourierComponentsTexture,
      2,
      "Displacement Field",
      butterflyTexture
    );

    return new SlopeAndDisplacement(
      device,
      shader,
      slopeIFFT,
      displacementIFFT,
      heightAmplitudesTexture,
      textureSize,
      domainSize
    );
  }
}

export { SlopeAndDisplacement };
