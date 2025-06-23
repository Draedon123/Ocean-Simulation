class Mesh {
  public vertexBuffer!: GPUBuffer;
  public indexBuffer!: GPUBuffer;
  private initialised: boolean;
  constructor(
    private readonly vertices: number[],
    private readonly indices: number[],
    public readonly label: string = ""
  ) {
    this.initialised = false;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    const vertices = new Float32Array(this.vertices);
    const indices = new (
      this.indexFormat === "uint16" ? Uint16Array : Uint32Array
    )(this.indices);

    this.vertexBuffer = device.createBuffer({
      label: `${this.label} Vertex Buffer`,
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = device.createBuffer({
      label: `${this.label} Index Buffer`,
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    device.queue.writeBuffer(this.indexBuffer, 0, indices);

    this.initialised = true;
  }

  public render(renderPass: GPURenderPassEncoder): void {
    if (!this.initialised) {
      console.error(`Mesh ${this.label} not initialised`);

      return;
    }

    this.bind(renderPass);
    renderPass.drawIndexed(this.indexCount);
  }

  public bind(renderPass: GPURenderPassEncoder): void {
    if (!this.initialised) {
      console.error(`Mesh ${this.label} not initialised`);

      return;
    }

    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setIndexBuffer(this.indexBuffer, this.indexFormat);
  }

  public get verticeCount(): number {
    return this.vertices.length / 3;
  }

  public get indexCount(): number {
    return this.indices.length;
  }

  public get indexFormat(): GPUIndexFormat {
    return this.vertices.length > 0xffff ? "uint32" : "uint16";
  }
}

export { Mesh };
