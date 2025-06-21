import { random } from "./random";

const TWO_PI = Math.PI * 2;

class Vector2 {
  public readonly components: Float32Array;
  constructor(x: number = 0, y: number = 0) {
    this.components = new Float32Array(2);

    this.components[0] = x;
    this.components[1] = y;
  }

  public normalise(): this {
    const inverseMagnitude = 1 / this.magnitude;

    this.components[0] *= inverseMagnitude;
    this.components[1] *= inverseMagnitude;

    return this;
  }

  public get x(): number {
    return this.components[0];
  }

  public get y(): number {
    return this.components[1];
  }

  public set x(x: number) {
    this.components[0] = x;
  }

  public set y(y: number) {
    this.components[1] = y;
  }

  public get magnitude(): number {
    return Math.hypot(this.components[0], this.components[1]);
  }

  public static randomUnit(): Vector2 {
    const angle = random(0, TWO_PI);

    const x = Math.cos(angle);
    const y = Math.sin(angle);

    return new Vector2(x, y).normalise();
  }
}

export { Vector2 };
