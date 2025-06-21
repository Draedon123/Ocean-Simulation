import { Matrix4Buffer } from "@utils/Matrix4Buffer";
import { Camera } from "./Camera";
import { Mesh } from "./Mesh";
import { Shader } from "./Shader";
import { Wave } from "../ocean/Wave";
import { BufferWriter } from "@utils/BufferWriter";

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

type RendererSettings = {
  wireframe: boolean;
  waves: number;
};

class Renderer {
  private static readonly DEFAULT_SETTINGS: RendererSettings = {
    wireframe: false,
    waves: 3,
  };

  public readonly settings: RendererSettings;

  private readonly ctx: GPUCanvasContext;
  private readonly canvasFormat: GPUTextureFormat;

  private initialised: boolean;

  private renderShaderModule!: Shader;
  private renderBindGroup!: GPUBindGroup;
  private renderPipeline!: GPURenderPipeline;

  private readonly perspectiveMatrix: Matrix4Buffer;
  private readonly viewMatrix: Matrix4Buffer;
  private settingsBuffer!: GPUBuffer;
  private wavesBuffer!: GPUBuffer;
  private constructor(
    private readonly device: GPUDevice,
    public readonly canvas: HTMLCanvasElement,
    _settings: Partial<RendererSettings>
  ) {
    const ctx = this.canvas.getContext("webgpu");

    if (ctx === null) {
      throw new Error("Could not get WebGPU Canvas context");
    }

    this.ctx = ctx;
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.initialised = false;

    const settings = Object.assign(
      structuredClone(Renderer.DEFAULT_SETTINGS),
      _settings
    );
    this.settings = settings;

    this.perspectiveMatrix = new Matrix4Buffer("Perspective Matrix");
    this.viewMatrix = new Matrix4Buffer("View Matrix");

    this.perspectiveMatrix.initialise(device);
    this.viewMatrix.initialise(device);

    new ResizeObserver((entries) => {
      const canvas = entries[0];

      const width = canvas.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas.devicePixelContentBoxSize[0].blockSize;

      this.canvas.width = width;
      this.canvas.height = height;
    }).observe(this.canvas);
  }

  public async initialise(): Promise<void> {
    if (this.initialised) {
      return;
    }

    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat,
    });

    this.renderShaderModule = await Shader.from(
      "render",
      "Render Shader Module"
    );

    this.renderShaderModule.initialise(this.device);

    this.settingsBuffer = this.device.createBuffer({
      label: "Settings Buffer",
      size: 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.wavesBuffer = this.device.createBuffer({
      label: "Waves Buffer",
      size: this.settings.waves * Wave.BYTE_SIZE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const wavesBuffer = new BufferWriter(this.settings.waves * Wave.BYTE_SIZE);
    const waves = Array.from(Array(this.settings.waves), () => Wave.random());

    for (const wave of waves) {
      wave.writeToBuffer(wavesBuffer);
    }

    this.device.queue.writeBuffer(
      this.wavesBuffer,
      0,
      wavesBuffer.toFloat32Array()
    );

    const renderBindGroupLayout = this.device.createBindGroupLayout({
      label: "Render Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: {},
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 1,
          buffer: {},
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 2,
          buffer: {},
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 3,
          buffer: { type: "read-only-storage" },
          visibility: GPUShaderStage.VERTEX,
        },
      ],
    });

    this.renderBindGroup = this.device.createBindGroup({
      label: "Render Bind Group",
      layout: renderBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.perspectiveMatrix.buffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.viewMatrix.buffer,
          },
        },
        {
          binding: 2,
          resource: {
            buffer: this.settingsBuffer,
          },
        },
        {
          binding: 3,
          resource: {
            buffer: this.wavesBuffer,
          },
        },
      ],
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
      primitive: {
        topology: this.settings.wireframe ? "line-strip" : "triangle-list",
      },
    });

    this.initialised = true;
  }

  public render(camera: Camera, mesh: Mesh, time: number): void {
    if (!this.initialised) {
      console.error("Renderer not initialised");

      return;
    }

    mesh.initialise(this.device);

    camera.aspectRatio = this.canvas.width / this.canvas.height;
    this.viewMatrix.copyFrom(camera.getViewMatrix()).writeBuffer();
    this.perspectiveMatrix
      .copyFrom(camera.getPerspectiveMatrix())
      .writeBuffer();

    this.device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([time])
    );

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

  public static async create(
    canvas: HTMLCanvasElement,
    settings: Partial<RendererSettings> = {}
  ): Promise<Renderer> {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (adapter === null) {
      throw new Error("No GPU Adapter found");
    }

    const device = await adapter.requestDevice();

    return new Renderer(device, canvas, settings);
  }
}

export { Renderer };
