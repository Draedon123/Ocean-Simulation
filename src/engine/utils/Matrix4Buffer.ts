import { Matrix4 } from "./Matrix4";

class Matrix4Buffer extends Matrix4 {
  private device!: GPUDevice;
  public buffer!: GPUBuffer;

  private initialised: boolean;
  constructor(public readonly label: string) {
    super();

    this.initialised = false;
  }

  public initialise(
    device: GPUDevice,
    usage: number = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  ): void {
    if (this.initialised) {
      console.warn("Matrix4Buffer already initialised");
      return;
    }

    this.buffer = device.createBuffer({
      label: this.label,
      size: 64,
      usage,
    });

    this.device = device;
    this.initialised = true;
  }

  public writeBuffer(): void {
    if (!this.initialised) {
      console.error("Matrix4Buffer not initialised");
      return;
    }

    this.device.queue.writeBuffer(this.buffer, 0, this.components);
  }
}

export { Matrix4Buffer };
