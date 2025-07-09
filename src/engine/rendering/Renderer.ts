import { Camera } from "./Camera";
import { Shader } from "./Shader";
import { Cubemap } from "./Cubemap";
import { SkyboxRenderer } from "./SkyboxRenderer";
import { WaveHeightMap } from "../ocean/WaveHeightMap";

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
};

class Renderer {
  private static readonly DEFAULT_SETTINGS: RendererSettings = {
    wireframe: false,
  };

  public readonly settings: RendererSettings;
  public readonly canvasFormat: GPUTextureFormat;
  public readonly skyboxRenderer: SkyboxRenderer;

  private readonly ctx: GPUCanvasContext;

  private initialised: boolean;

  private renderBindGroup!: GPUBindGroup;
  private renderPipeline!: GPURenderPipeline;
  private depthTexture!: GPUTexture;

  private cameraBuffer!: GPUBuffer;
  private renderSettingsBuffer!: GPUBuffer;

  private waveHeightMap!: WaveHeightMap;

  private constructor(
    public readonly device: GPUDevice,
    public readonly canvas: HTMLCanvasElement,
    _settings: Partial<RendererSettings>
  ) {
    const ctx = this.canvas.getContext("webgpu");

    if (ctx === null) {
      throw new Error("Could not get WebGPU Canvas context");
    }

    this.ctx = ctx;
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.skyboxRenderer = new SkyboxRenderer("Renderer Skybox");
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

      if (this.initialised) {
        this.depthTexture?.destroy();
        this.depthTexture = this.createDepthTexture();
      }
    }).observe(this.canvas);
  }

  public async initialise(): Promise<void> {
    if (this.initialised) {
      return;
    }

    this.waveHeightMap = await WaveHeightMap.create(this.device, 2000, 512);

    await this.initialiseRendering();
  }

  private async initialiseRendering(): Promise<void> {
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

    await this.skyboxRenderer.initialise(this.device, this.canvasFormat);
    this.skyboxRenderer.addSkybox(cubemap);

    this.skyboxRenderer.setActiveSkybox(cubemap);

    const renderShaderModule = await Shader.from(
      ["headers", "vertex", "fragment", "complexNumber", "random"],
      "Render Shader Module"
    );

    renderShaderModule.initialise(this.device);

    this.cameraBuffer = this.device.createBuffer({
      label: "Camera Buffer",
      size: Camera.BYTE_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.renderSettingsBuffer = this.device.createBuffer({
      label: "Settings Buffer",
      size: 6 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(
      this.renderSettingsBuffer,
      0,
      new Float32Array([0, 50, 256, 2000])
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
          sampler: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 3,
          texture: {
            viewDimension: "cube",
          },
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 4,
          storageTexture: {
            format: "rgba32float",
            access: "read-only",
          },
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
            buffer: this.renderSettingsBuffer,
          },
        },
        {
          binding: 2,
          resource: this.skyboxRenderer.sampler,
        },
        {
          binding: 3,
          resource: this.skyboxRenderer.skyboxes[0].texture.createView({
            dimension: "cube",
          }),
        },
        {
          binding: 4,
          resource: this.waveHeightMap.heightMap.createView(),
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
        topology: this.settings.wireframe ? "line-list" : "triangle-list",
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

  public render(camera: Camera, renderables: Renderable[], time: number): void {
    if (!this.initialised) {
      console.error("Renderer not initialised");

      return;
    }

    this.waveHeightMap.create(time);
    camera.aspectRatio = this.canvas.width / this.canvas.height;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, camera.writeToBuffer());

    this.device.queue.writeBuffer(
      this.renderSettingsBuffer,
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
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1,
      },
    });

    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.setPipeline(this.renderPipeline);

    for (const renderable of renderables) {
      try {
        renderable.render(renderPass, camera);
      } catch (error) {
        console.error("Error while trying to render object", error);
      }
    }

    this.skyboxRenderer.render(renderPass, camera);

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
