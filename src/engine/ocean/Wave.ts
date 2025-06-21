import { BufferWriter } from "@utils/BufferWriter";
import { random } from "@utils/random";
import { Vector2 } from "@utils/Vector2";

const TWO_PI = Math.PI * 2;

class Wave {
  public static readonly BYTE_SIZE: number = 8 * Float32Array.BYTES_PER_ELEMENT;
  constructor(
    public readonly wavelength: number,
    public readonly speed: number,
    public readonly amplitude: number,
    public readonly direction: Vector2
  ) {}

  public writeToBuffer(buffer: BufferWriter): void {
    buffer.writeFloat32(this.frequency);
    buffer.writeFloat32(this.amplitude);
    buffer.writeFloat32(this.phaseConstant);
    buffer.pad(4);
    buffer.writeVec2f32(this.direction);
    buffer.pad(8);
  }

  public get frequency(): number {
    return TWO_PI / this.wavelength;
  }

  public get phaseConstant(): number {
    return (this.speed * TWO_PI) / this.wavelength;
  }

  public static random(): Wave {
    const wavelength = random(0.5, 1.5);
    const speed = random(0.4, 0.6);
    const amplitude = random(0.1, 0.5);
    const direction = Vector2.randomUnit();

    return new Wave(wavelength, speed, amplitude, direction);
  }
}

export { Wave };
