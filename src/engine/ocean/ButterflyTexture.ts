import { callCompute } from "@rendering/callCompute";
import { Shader } from "@rendering/Shader";

class ButterflyTexture {
  public readonly butterflyTexture: GPUTexture;
  private readonly settingsBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  private constructor(
    private readonly device: GPUDevice,
    private readonly height: number,
    shader: Shader
  ) {
    shader.initialise(device);

    this.settingsBuffer = device.createBuffer({
      label: "Butterfly Texture Settings Buffer",
      size: 1 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([height])
    );

    const bitReversedIndicesBuffer = device.createBuffer({
      label: "Butterfly Texture Bit Reversed Indices",
      size: height * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });

    device.queue.writeBuffer(
      bitReversedIndicesBuffer,
      0,
      this.bitReverseIndices(height)
    );

    this.butterflyTexture = device.createTexture({
      label: "Butterfly Texture",
      format: "rgba32float",
      size: [Math.log2(height), height],
      usage: GPUTextureUsage.STORAGE_BINDING,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Butterfly Texture Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: {},
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 1,
          buffer: { type: "read-only-storage" },
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

    this.bindGroup = device.createBindGroup({
      label: "Butterfly Texture Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.settingsBuffer },
        },
        {
          binding: 1,
          resource: { buffer: bitReversedIndicesBuffer },
        },
        {
          binding: 2,
          resource: this.butterflyTexture.createView(),
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Butterfly Texture Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = device.createComputePipeline({
      label: "Butterfly Texture Pipeline Layout",
      layout: pipelineLayout,
      compute: {
        module: shader.shaderModule,
        entryPoint: "main",
      },
    });
  }

  public createTexture(): void {
    callCompute(
      this.bindGroup,
      this.pipeline,
      [Math.log2(this.height), this.height, 1],
      this.device
    );
  }

  private bitReverseIndices(numIndices: number) {
    const result = new Float32Array(numIndices);
    const numBits = Math.log2(numIndices);

    for (let i = 0; i < numIndices; i++) {
      let bitReversed = 0;

      for (let bitIndex = 0; bitIndex < numBits; bitIndex++) {
        if (i & (1 << bitIndex)) {
          bitReversed |= 1 << (numBits - 1 - bitIndex);
        }
      }

      result[i] = bitReversed;
    }

    return result;
  }

  public static async create(
    device: GPUDevice,
    textureHeight: number
  ): Promise<ButterflyTexture> {
    const shader = await Shader.from(
      ["butterflyTexture", "complexNumber"],
      "Butterfly Texture Shader Module"
    );

    return new ButterflyTexture(device, textureHeight, shader);
  }
}

export { ButterflyTexture };
