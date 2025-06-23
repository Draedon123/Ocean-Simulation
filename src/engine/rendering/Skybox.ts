import { Matrix4Buffer } from "@utils/Matrix4Buffer";
import { Cubemap } from "./Cubemap";
import { Shader } from "./Shader";
import { Camera } from "./Camera";

class Skybox {
  private initialised: boolean;

  private readonly sampler: GPUSampler;
  private readonly inversePespectiveViewMatrix: Matrix4Buffer;
  private renderBindGroup!: GPUBindGroup;
  private renderPipeline!: GPURenderPipeline;
  constructor(
    private readonly device: GPUDevice,
    private readonly texture: Cubemap,
    public readonly label: string = ""
  ) {
    this.inversePespectiveViewMatrix = new Matrix4Buffer(
      `Skybox ${this.label} Inverse Perspective View Matrix Butter`
    );
    this.sampler = this.device.createSampler({
      label: `Skybox ${this.label} Sampler`,
    });

    this.inversePespectiveViewMatrix.initialise(device);

    this.initialised = false;
  }

  public async initialise(canvasFormat: GPUTextureFormat): Promise<void> {
    if (this.initialised) {
      return;
    }

    const renderShaderModule = await Shader.from(
      "skybox",
      `Skybox "${this.label}" Shader Module`
    );

    renderShaderModule.initialise(this.device);

    const renderBindGroupLayout = this.device.createBindGroupLayout({
      label: `Skybox "${this.label}" Bind Group Layout`,
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

    this.renderBindGroup = this.device.createBindGroup({
      label: `Skybox "${this.label}" Bind Group`,
      layout: renderBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.sampler,
        },
        {
          binding: 1,
          resource: this.texture.texture.createView({
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

    const renderPipelineLayout = this.device.createPipelineLayout({
      label: `Skybox "${this.label}" Render Pipeline Layout`,
      bindGroupLayouts: [renderBindGroupLayout],
    });
    this.renderPipeline = this.device.createRenderPipeline({
      label: `Skybox "${this.label}" Render Pipeline`,
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

    this.initialised = true;
  }

  public render(renderPass: GPURenderPassEncoder, camera: Camera): void {
    if (!this.initialised) {
      console.error(`Skybox "${this.label}" not initialised`);

      return;
    }

    this.inversePespectiveViewMatrix.copyFrom(
      camera.getPerspectiveViewMatrix().invert()
    );
    this.inversePespectiveViewMatrix.writeBuffer();

    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.draw(3);
  }
}

export { Skybox };
