import { Matrix4 } from "./Matrix4";
import { Vector3 } from "./Vector3";

class BufferWriter {
  public readonly buffer: ArrayBufferLike;
  private readonly dataview: DataView;
  constructor(
    bufferOrLength: ArrayBuffer | number = new ArrayBuffer(),
    public readonly littleEndian: boolean = true,
    private offset: number = 0
  ) {
    this.buffer =
      bufferOrLength instanceof ArrayBuffer
        ? bufferOrLength
        : new ArrayBuffer(bufferOrLength);
    this.dataview = new DataView(this.buffer);
  }

  public toFloat32Array(): Float32Array {
    return new Float32Array(this.buffer);
  }

  public writeFloat32(float32: number): void {
    this.dataview.setFloat32(this.offset, float32, this.littleEndian);
    this.offset += 4;
  }

  public writeUint32(uint32: number): void {
    this.dataview.setUint32(this.offset, uint32, this.littleEndian);
    this.offset += 4;
  }

  public writeVec3f32(vec3f32: Vector3): void {
    this.writeFloat32(vec3f32.x);
    this.writeFloat32(vec3f32.y);
    this.writeFloat32(vec3f32.z);
  }

  public writeMat4x4f(mat4x4f: Matrix4): void {
    for (let i = 0; i < 16; i++) {
      this.writeFloat32(mat4x4f.components[i]);
    }
  }

  // public writeBooleanAsUint32(boolean: boolean): void {
  //   this.writeUint32(boolean ? 1 : 0);
  // }

  public pad(bytes: number): void {
    for (let i = 0; i < bytes; i++) {
      this.dataview.setUint8(this.offset, 0);
      this.offset += 1;
    }
  }
}

export { BufferWriter };
