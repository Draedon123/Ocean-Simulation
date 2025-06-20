class Mesh {
  public vertexBuffer!: GPUBuffer;
  private initialised: boolean;
  constructor(
    private readonly vertices: number[],
    public readonly label: string = ""
  ) {
    this.initialised = false;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    const vertices = new Float32Array(this.vertices);

    this.vertexBuffer = device.createBuffer({
      label: this.label,
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

    this.initialised = true;
  }

  public get verticeCount(): number {
    return this.vertices.length / 3;
  }
}

export { Mesh };
