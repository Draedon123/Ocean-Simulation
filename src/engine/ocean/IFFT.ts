import { Shader } from "@rendering/Shader";
import { ButterflyTexture } from "./ButterflyTexture";
import { callCompute } from "@rendering/callCompute";

class IFFT {
  private readonly settingsBuffer: GPUBuffer;
  private readonly bindGroup_1: GPUBindGroup;
  private readonly bindGroup_2: GPUBindGroup;
  private readonly pipelineHorizontal: GPUComputePipeline;
  private readonly pipelineVertical: GPUComputePipeline;
  public readonly texture_1: GPUTexture;
  public readonly texture_2: GPUTexture;

  public pingPong: number;
  private constructor(
    private readonly device: GPUDevice,
    butterflyTexture: GPUTexture,
    shader: Shader,
    initialTexture: GPUTexture,
    private readonly textureSize: number
  ) {
    this.pingPong = 0;
    shader.initialise(device);

    this.settingsBuffer = device.createBuffer({
      label: "IFFT Settings Buffer",
      size: 1 * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    this.texture_1 = initialTexture;
    this.texture_2 = device.createTexture({
      label: "IFFT Ping Pong Texture",
      format: "rg32float",
      size: [textureSize, textureSize],
      usage: GPUTextureUsage.STORAGE_BINDING,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: "IFFT Bind Group Layout",
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
            format: "rgba32float",
          },
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 2,
          storageTexture: {
            access: "read-only",
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

    this.bindGroup_1 = device.createBindGroup({
      label: "IFFT Bind Group 1",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.settingsBuffer },
        },
        {
          binding: 1,
          resource: butterflyTexture.createView(),
        },
        {
          binding: 2,
          resource: this.texture_1.createView(),
        },
        {
          binding: 3,
          resource: this.texture_2.createView(),
        },
      ],
    });

    this.bindGroup_2 = device.createBindGroup({
      label: "IFFT Bind Group 2",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.settingsBuffer },
        },
        {
          binding: 1,
          resource: butterflyTexture.createView(),
        },
        {
          binding: 2,
          resource: this.texture_2.createView(),
        },
        {
          binding: 3,
          resource: this.texture_1.createView(),
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "IFFT Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipelineHorizontal = device.createComputePipeline({
      label: "IFFT Pipeline Horizontal",
      layout: pipelineLayout,
      compute: {
        module: shader.shaderModule,
        entryPoint: "horizontal",
      },
    });

    this.pipelineVertical = device.createComputePipeline({
      label: "IFFT Pipeline Vertical",
      layout: pipelineLayout,
      compute: {
        module: shader.shaderModule,
        entryPoint: "vertical",
      },
    });
  }

  public call(): void {
    this.pingPong = 0;
    const stages = Math.log2(this.textureSize);

    for (let stage = 0; stage < stages; stage++) {
      this.setStage(stage);
      this.horizontal();
      this.pingPong = (this.pingPong + 1) % 2;
    }

    for (let stage = 0; stage < stages; stage++) {
      this.setStage(stage);
      this.vertical();
      this.pingPong = (this.pingPong + 1) % 2;
    }
  }

  private horizontal(): void {
    callCompute(
      this.pingPong === 0 ? this.bindGroup_1 : this.bindGroup_2,
      this.pipelineHorizontal,
      [this.textureSize, this.textureSize, 1],
      this.device
    );
  }

  private vertical(): void {
    callCompute(
      this.pingPong === 0 ? this.bindGroup_1 : this.bindGroup_2,
      this.pipelineVertical,
      [this.textureSize, this.textureSize, 1],
      this.device
    );
  }

  private setStage(stage: number): void {
    this.device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Uint32Array([stage])
    );
  }

  public static async create(
    device: GPUDevice,
    textureSize: number,
    initialTexture: GPUTexture,
    _butterflyTexture?: ButterflyTexture
  ): Promise<IFFT> {
    const shader = await Shader.from(
      ["butterfly", "complexNumber"],
      "IFFT Shader Module"
    );

    const butterflyTexture = _butterflyTexture
      ? _butterflyTexture
      : await ButterflyTexture.create(device, textureSize);
    if (_butterflyTexture === undefined) {
      butterflyTexture.createTexture();
    }

    return new IFFT(
      device,
      butterflyTexture.butterflyTexture,
      shader,
      initialTexture,
      textureSize
    );
  }
}

export { IFFT };
