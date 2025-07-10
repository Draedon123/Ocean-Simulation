import { callCompute } from "@rendering/callCompute";
import { Shader } from "@rendering/Shader";

class ButterflyTexture {
  private static shader: Shader | null = null;

  public readonly butterflyTexture: GPUTexture;
  private readonly bindGroup: GPUBindGroup;
  private readonly pipeline: GPUComputePipeline;
  private constructor(
    private readonly device: GPUDevice,
    private readonly height: number,
    shader: Shader
  ) {
    const bitReversedIndicesBuffer = device.createBuffer({
      label: "Butterfly Texture Bit Reversed Indices Buffer",
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
          buffer: { type: "read-only-storage" },
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
      label: "Butterfly Texture Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: bitReversedIndicesBuffer },
        },
        {
          binding: 1,
          resource: this.butterflyTexture.createView(),
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Butterfly Texture Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = device.createComputePipeline({
      label: "Butterfly Texture Compute Pipeline",
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
      [Math.log2(this.height), this.height / 64, 1],
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

  private static async getShader(device: GPUDevice): Promise<Shader> {
    if (this.shader === null) {
      const shader = await Shader.from(
        ["butterflyTexture", "complexNumber"],
        "Butterfly Texture Shader Module"
      );

      shader.initialise(device);
      this.shader = shader;
    }

    return this.shader;
  }

  public static async create(
    device: GPUDevice,
    textureHeight: number
  ): Promise<ButterflyTexture> {
    const shader = await this.getShader(device);

    return new ButterflyTexture(device, textureHeight, shader);
  }
}

export { ButterflyTexture };
