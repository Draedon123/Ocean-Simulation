import { Camera } from "./Camera";
import { Mesh } from "./Mesh";
import { Shader } from "./Shader";
import { Wave } from "../ocean/Wave";
import { BufferWriter } from "@utils/BufferWriter";
import { random } from "@utils/random";
import { Skybox } from "./Skybox";
import { Cubemap } from "./Cubemap";

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
  frequencyRange: [number, number];
  amplitudeRange: [number, number];
  speedRange: [number, number];
};

class Renderer {
  private static readonly DEFAULT_SETTINGS: RendererSettings = {
    wireframe: false,
    waves: 32,
    frequencyRange: [3, 6],
    amplitudeRange: [0.2, 0.4],
    speedRange: [0.4, 0.6],
  };

  public readonly settings: RendererSettings;

  private readonly ctx: GPUCanvasContext;
  private readonly canvasFormat: GPUTextureFormat;

  private initialised: boolean;

  private skybox!: Skybox;

  private renderBindGroup!: GPUBindGroup;
  private renderPipeline!: GPURenderPipeline;
  private depthTexture!: GPUTexture;

  private cameraBuffer!: GPUBuffer;
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

    new ResizeObserver((entries) => {
      const canvas = entries[0];

      const width = canvas.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas.devicePixelContentBoxSize[0].blockSize;

      this.canvas.width = width;
      this.canvas.height = height;

      this.depthTexture = this.createDepthTexture();
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

    const cubemap = new Cubemap("Cubemap");
    await cubemap.initialise(
      this.device,
      "skybox/px.png",
      "skybox/nx.png",
      "skybox/py.png",
      "skybox/ny.png",
      "skybox/pz.png",
      "skybox/nz.png"
    );

    this.skybox = new Skybox(this.device, cubemap, "Skybox");
    await this.skybox.initialise(this.canvasFormat);

    const renderShaderModule = await Shader.from(
      ["headers", "vertex", "fragment", "waveFunctions"],
      "Render Shader Module"
    );

    renderShaderModule.initialise(this.device);

    this.cameraBuffer = this.device.createBuffer({
      label: "Camera Buffer",
      size: Camera.BYTE_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.settingsBuffer = this.device.createBuffer({
      label: "Settings Buffer",
      size: 3 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.wavesBuffer = this.device.createBuffer({
      label: "Waves Buffer",
      size: this.settings.waves * Wave.BYTE_SIZE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const wavesBuffer = new BufferWriter(this.settings.waves * Wave.BYTE_SIZE);
    const waves = Array.from(Array(this.settings.waves), () =>
      Wave.random({
        speed: this.settings.speedRange,
      })
    );

    for (const wave of waves) {
      wave.writeToBuffer(wavesBuffer);
    }

    this.device.queue.writeBuffer(
      this.wavesBuffer,
      0,
      wavesBuffer.toFloat32Array()
    );

    this.device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([
        0,
        random(this.settings.frequencyRange),
        random(this.settings.amplitudeRange),
      ])
    );

    this.depthTexture = this.createDepthTexture();

    const renderBindGroupLayout = this.device.createBindGroupLayout({
      label: "Render Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: {},
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        },
        {
          binding: 1,
          buffer: {},
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 2,
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
            buffer: this.cameraBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.settingsBuffer,
          },
        },
        {
          binding: 2,
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
        module: renderShaderModule.shaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: renderShaderModule.shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: this.canvasFormat }],
      },
      primitive: {
        topology: this.settings.wireframe ? "line-strip" : "triangle-list",
        cullMode: "front",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });

    this.initialised = true;
  }

  private createDepthTexture(): GPUTexture {
    return this.device.createTexture({
      size: this.canvas,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  public render(camera: Camera, mesh: Mesh, time: number): void {
    if (!this.initialised) {
      console.error("Renderer not initialised");

      return;
    }

    mesh.initialise(this.device);

    camera.aspectRatio = this.canvas.width / this.canvas.height;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, camera.writeToBuffer());

    this.device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([time]),
      0,
      1
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
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1,
      },
    });

    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.setPipeline(this.renderPipeline);
    mesh.render(renderPass);
    this.skybox.render(renderPass, camera);

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
