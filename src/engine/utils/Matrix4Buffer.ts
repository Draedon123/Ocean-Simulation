import { bufferData } from "./bufferData";
import { Matrix4 } from "./Matrix4";

class Matrix4Buffer extends Matrix4 {
  public readonly buffer: GPUBuffer;

  constructor(
    private readonly device: GPUDevice,
    public readonly label: string,
    usage: number = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  ) {
    super();

    this.buffer = bufferData(device, this.label, usage, this.components);
    this.device = device;
  }

  public writeBuffer(): void {
    this.device.queue.writeBuffer(this.buffer, 0, this.components);
  }
}

export { Matrix4Buffer };
