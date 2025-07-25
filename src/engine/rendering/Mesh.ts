import { bufferData } from "@utils/bufferData";

class Mesh {
  public readonly vertexBuffer: GPUBuffer;
  public readonly indexBuffer: GPUBuffer;

  private readonly vertices: Float32Array;
  private readonly indices: Uint16Array | Uint32Array;
  constructor(
    device: GPUDevice,
    _vertices: number[],
    _indices: number[],
    public readonly label: string = ""
  ) {
    this.vertices = new Float32Array(_vertices);
    this.indices = new (
      this.indexFormat === "uint16" ? Uint16Array : Uint32Array
    )(_indices);

    this.vertexBuffer = bufferData(
      device,
      `${this.label} Vertex Buffer`,
      GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      this.vertices
    );

    this.indexBuffer = bufferData(
      device,
      `${this.label} Index Buffer`,
      GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      this.indices
    );
  }

  public render(renderPass: GPURenderPassEncoder): void {
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setIndexBuffer(this.indexBuffer, this.indexFormat);
    renderPass.drawIndexed(this.indexCount);
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
