import { BufferWriter } from "@utils/BufferWriter";
import { random } from "@utils/random";
import { Vector2 } from "@utils/Vector2";

type WaveParameters = {
  speed: [number, number];
};

class Wave {
  public static readonly BYTE_SIZE: number = 3 * Float32Array.BYTES_PER_ELEMENT;
  constructor(
    public readonly speed: number,
    public readonly direction: Vector2
  ) {}

  public writeToBuffer(buffer: BufferWriter): void {
    buffer.writeVec2f32(this.direction);
    buffer.writeFloat32(this.speed);
  }

  public static random(ranges: WaveParameters): Wave {
    const speed = random(ranges.speed);
    const direction = Vector2.randomUnit();

    return new Wave(speed, direction);
  }
}

export { Wave };
