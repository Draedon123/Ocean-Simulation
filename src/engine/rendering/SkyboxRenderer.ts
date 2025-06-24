import { Matrix4Buffer } from "@utils/Matrix4Buffer";
import { Shader } from "./Shader";
import { Camera } from "./Camera";
import { Cubemap } from "./Cubemap";

class SkyboxRenderer {
  private initialised: boolean;

  private readonly inversePespectiveViewMatrix: Matrix4Buffer;
  private readonly bindGroups: GPUBindGroup[] = [];
  private readonly skyboxes: Cubemap[];
  private activeSkybox: number;
  private device!: GPUDevice;
  private sampler!: GPUSampler;
  private renderBindGroupLayout!: GPUBindGroupLayout;
  private renderPipeline!: GPURenderPipeline;
  constructor(
    public readonly label: string = "",
    ...skyboxes: Cubemap[]
  ) {
    this.activeSkybox = skyboxes.length - 1;
    this.skyboxes = skyboxes;
    this.bindGroups = [];
    this.inversePespectiveViewMatrix = new Matrix4Buffer(
      `Skybox ${this.label} Inverse Perspective View Matrix Butter`
    );

    this.initialised = false;
  }

  public async initialise(
    device: GPUDevice,
    canvasFormat: GPUTextureFormat
  ): Promise<void> {
    if (this.initialised) {
      return;
    }

    this.device = device;
    this.sampler = device.createSampler({
      label: `Skybox Renderer ${this.label} Sampler`,
    });

    this.inversePespectiveViewMatrix.initialise(device);

    const renderShaderModule = await Shader.from(
      "skybox",
      `Skybox Renderer "${this.label}" Shader Module`
    );

    renderShaderModule.initialise(device);

    this.renderBindGroupLayout = device.createBindGroupLayout({
      label: `Skybox Renderer "${this.label}" Bind Group Layout`,
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

    const renderPipelineLayout = device.createPipelineLayout({
      label: `Skybox Renderer "${this.label}" Render Pipeline Layout`,
      bindGroupLayouts: [this.renderBindGroupLayout],
    });
    this.renderPipeline = device.createRenderPipeline({
      label: `Skybox Renderer "${this.label}" Render Pipeline`,
      layout: renderPipelineLayout,
      vertex: {
        module: renderShaderModule.shaderModule,
        entryPoint: "vertexMain",
      },
      fragment: {
        module: renderShaderModule.shaderModule,
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

    this.initialised = true;
  }

  public addSkybox(skybox: Cubemap): void {
    const renderBindGroup = this.device.createBindGroup({
      label: `Skybox Renderer "${skybox.label}" Bind Group`,
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

  public setActiveSkybox(skybox: Cubemap | null): void {
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
    if (!this.initialised) {
      console.error(`Skybox Renderer "${this.label}" not initialised`);

      return;
    }

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
