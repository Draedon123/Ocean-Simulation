import { Mesh } from "./Mesh";
import { Shader } from "./Shader";

const vertexBufferLayout: GPUVertexBufferLayout = {
  arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
  attributes: [
    {
      format: "float32x3",
      offset: 0,
      shaderLocation: 0,
    },
  ],
};

class Renderer {
  private readonly ctx: GPUCanvasContext;
  private readonly canvasFormat: GPUTextureFormat;

  private renderShaderModule!: Shader;
  private renderBindGroup!: GPUBindGroup;
  private renderPipeline!: GPURenderPipeline;
  private constructor(
    private readonly device: GPUDevice,
    public readonly canvas: HTMLCanvasElement
  ) {
    const ctx = this.canvas.getContext("webgpu");

    if (ctx === null) {
      throw new Error("Could not get WebGPU Canvas context");
    }

    this.ctx = ctx;
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    new ResizeObserver((entries) => {
      const canvas = entries[0];

      const width = canvas.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas.devicePixelContentBoxSize[0].blockSize;

      this.canvas.width = width;
      this.canvas.height = height;
    }).observe(this.canvas);
  }

  public async initialise(): Promise<void> {
    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat,
    });

    this.renderShaderModule = await Shader.from(
      "render",
      "Render Shader Module"
    );

    this.renderShaderModule.initialise(this.device);

    const renderBindGroupLayout = this.device.createBindGroupLayout({
      label: "Render Bind Group Layout",
      entries: [],
    });

    this.renderBindGroup = this.device.createBindGroup({
      label: "Render Bind Group",
      layout: renderBindGroupLayout,
      entries: [],
    });

    const renderPipelineLayout = this.device.createPipelineLayout({
      label: "Render Pipeline Layout",
      bindGroupLayouts: [renderBindGroupLayout],
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: "Render Pipeline",
      layout: renderPipelineLayout,
      vertex: {
        module: this.renderShaderModule.shaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: this.renderShaderModule.shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: this.canvasFormat }],
      },
    });
  }

  public render(mesh: Mesh): void {
    mesh.initialise(this.device);

    const commandEncoder = this.device.createCommandEncoder({
      label: "Render Command Encoder",
    });

    const renderPass = commandEncoder.beginRenderPass({
      label: "Render Pass",
      colorAttachments: [
        {
          view: this.ctx.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    renderPass.setViewport(0, 0, this.canvas.width, this.canvas.height, 0, 1);
    renderPass.setVertexBuffer(0, mesh.vertexBuffer);
    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.setPipeline(this.renderPipeline);
    renderPass.draw(mesh.verticeCount);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  public static async create(canvas: HTMLCanvasElement): Promise<Renderer> {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (adapter === null) {
      throw new Error("No GPU Adapter found");
    }

    const device = await adapter.requestDevice();

    return new Renderer(device, canvas);
  }
}

export { Renderer };
