import { Camera } from "./Camera";
import { Shader } from "./Shader";
import { SkyboxRenderer } from "./SkyboxRenderer";
import { Ocean } from "../ocean/Ocean";
import { Texture } from "./Texture";
import { bufferData } from "@utils/bufferData";

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
  domainSize: number;
  textureSize: number;
  meshSize: number;
  waveSpectrum: WaveSpectrum;
};

class Renderer {
  private static readonly DEFAULT_SETTINGS: RendererSettings = {
    wireframe: false,
    domainSize: 2000,
    textureSize: 512,
    meshSize: 50,
    waveSpectrum: "phillips",
  };

  public readonly settings: RendererSettings;
  public readonly canvasFormat: GPUTextureFormat;

  private readonly ctx: GPUCanvasContext;

  private initialised: boolean;

  private bindGroup!: GPUBindGroup;
  private renderPipeline!: GPURenderPipeline;
  private depthTexture!: GPUTexture;

  private cameraBuffer!: GPUBuffer;
  private settingsBuffer!: GPUBuffer;

  public skyboxRenderer!: SkyboxRenderer;
  private ocean!: Ocean;

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

    this.ocean = await Ocean.create(
      this.device,
      this.settings.domainSize,
      this.settings.textureSize,
      this.settings.waveSpectrum
    );

    await this.initialiseRendering();
  }

  private async initialiseRendering(): Promise<void> {
    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat,
    });

    const cubemap = await Texture.createCubemap(
      this.device,
      "Skybox Cubemap",
      "skybox"
    );

    this.skyboxRenderer = await SkyboxRenderer.create(
      this.device,
      this.canvasFormat,
      "Skybox Renderer"
    );

    this.skyboxRenderer.addSkybox(cubemap);
    this.skyboxRenderer.setActiveSkybox(cubemap);

    const renderShaderModule = await Shader.create(
      this.device,
      ["rendering/vertex", "rendering/fragment"],
      "Renderer Shader Module"
    );

    this.cameraBuffer = bufferData(
      this.device,
      "Renderer Camera Buffer",
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      Camera.BYTE_SIZE
    );

    this.settingsBuffer = bufferData(
      this.device,
      "Renderer Settings Buffer",
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      new Float32Array([0, this.settings.meshSize, this.settings.domainSize])
    );

    this.depthTexture = this.createDepthTexture();

    const renderBindGroupLayout = this.device.createBindGroupLayout({
      label: "Renderer Bind Group Layout",
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
            format: "r32float",
            access: "read-only",
          },
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 5,
          storageTexture: {
            format: "rg32float",
            access: "read-only",
          },
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 6,
          storageTexture: {
            format: "rg32float",
            access: "read-only",
          },
          visibility: GPUShaderStage.VERTEX,
        },
      ],
    });

    this.bindGroup = this.device.createBindGroup({
      label: "Renderer Bind Group",
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
          resource: this.ocean.heightMap.createView(),
        },
        {
          binding: 5,
          resource: this.ocean.slopeVector.createView(),
        },
        {
          binding: 6,
          resource: this.ocean.displacementField.createView(),
        },
      ],
    });

    const renderPipelineLayout = this.device.createPipelineLayout({
      label: "Renderer Render Pipeline Layout",
      bindGroupLayouts: [renderBindGroupLayout],
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: "Renderer Render Pipeline",
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
      label: "Renderer Depth Texture",
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

    this.ocean.create(time);
    camera.aspectRatio = this.canvas.width / this.canvas.height;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, camera.writeToBuffer());

    this.device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([time])
    );

    const commandEncoder = this.device.createCommandEncoder({
      label: "Renderer Command Encoder",
    });

    const renderPass = commandEncoder.beginRenderPass({
      label: "Renderer Render Pass",
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

    renderPass.setBindGroup(0, this.bindGroup);
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
