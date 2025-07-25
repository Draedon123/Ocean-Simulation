import { Matrix4Buffer } from "@utils/Matrix4Buffer";
import { Shader } from "./Shader";
import { Camera } from "./Camera";
import { Texture } from "./Texture";

class SkyboxRenderer {
  private readonly inversePespectiveViewMatrix: Matrix4Buffer;
  private readonly bindGroups: GPUBindGroup[] = [];
  private activeSkybox: number;
  private renderBindGroupLayout!: GPUBindGroupLayout;
  private renderPipeline!: GPURenderPipeline;

  public readonly skyboxes: Texture[];
  public sampler!: GPUSampler;
  constructor(
    private readonly device: GPUDevice,
    shader: Shader,
    canvasFormat: GPUTextureFormat,
    public readonly label: string
  ) {
    this.activeSkybox = -1;
    this.skyboxes = [];
    this.bindGroups = [];
    this.inversePespectiveViewMatrix = new Matrix4Buffer(
      device,
      `${this.label} Inverse Perspective View Matrix Buffer`
    );

    this.sampler = this.device.createSampler({
      label: `${this.label} Sampler`,
    });

    this.renderBindGroupLayout = this.device.createBindGroupLayout({
      label: `${this.label} Bind Group Layout`,
      entries: [
        {
          binding: 0,
          sampler: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 1,
          texture: {
            viewDimension: "cube",
          },
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 2,
          buffer: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
      ],
    });

    const renderPipelineLayout = this.device.createPipelineLayout({
      label: `${this.label} Render Pipeline Layout`,
      bindGroupLayouts: [this.renderBindGroupLayout],
    });
    this.renderPipeline = this.device.createRenderPipeline({
      label: `${this.label} Render Pipeline`,
      layout: renderPipelineLayout,
      vertex: {
        module: shader.shaderModule,
        entryPoint: "vertexMain",
      },
      fragment: {
        module: shader.shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: canvasFormat }],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less-equal",
        format: "depth24plus",
      },
    });

    for (let i = 0, skyboxes = this.skyboxes.length; i < skyboxes; i++) {
      const skybox = this.skyboxes[i];

      this.skyboxes.splice(0, 1);
      this.addSkybox(skybox);
    }
  }

  public static async create(
    device: GPUDevice,
    canvasFormat: GPUTextureFormat,
    label: string
  ): Promise<SkyboxRenderer> {
    const shader = await Shader.create(
      device,
      "rendering/skybox",
      `${label} Shader Module`
    );

    return new SkyboxRenderer(device, shader, canvasFormat, label);
  }

  public addSkybox(skybox: Texture): void {
    const renderBindGroup = this.device.createBindGroup({
      label: `${this.label} ${skybox.label} Bind Group`,
      layout: this.renderBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.sampler,
        },
        {
          binding: 1,
          resource: skybox.texture.createView({
            dimension: "cube",
          }),
        },
        {
          binding: 2,
          resource: {
            buffer: this.inversePespectiveViewMatrix.buffer,
          },
        },
      ],
    });

    this.skyboxes.push(skybox);
    this.bindGroups.push(renderBindGroup);
  }

  public setActiveSkybox(skybox: Texture | null): void {
    if (skybox === null) {
      this.activeSkybox = -1;
      return;
    }

    if (!this.skyboxes.includes(skybox)) {
      this.addSkybox(skybox);
    }

    const skyboxIndex = this.skyboxes.findIndex((box) => box === skybox);
    this.activeSkybox = skyboxIndex;
  }

  public render(renderPass: GPURenderPassEncoder, camera: Camera): void {
    if (this.activeSkybox === -1) {
      console.warn("No active skybox");

      return;
    }

    this.inversePespectiveViewMatrix.copyFrom(
      camera.getPerspectiveViewMatrix().invert()
    );
    this.inversePespectiveViewMatrix.writeBuffer();

    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.bindGroups[this.activeSkybox]);
    renderPass.draw(3);
  }
}

export { SkyboxRenderer };
