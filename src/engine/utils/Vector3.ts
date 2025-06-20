class Vector3 {
  public static readonly ZERO: Vector3 = new Vector3();
  public readonly components: Float32Array;
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.components = new Float32Array(3);

    this.components[0] = x;
    this.components[1] = y;
    this.components[2] = z;
  }

  *[Symbol.iterator]() {
    yield this.components[0];
    yield this.components[1];
    yield this.components[2];
  }

  public static scale(vector3: Vector3, scalar: number): Vector3 {
    return new Vector3(
      vector3.components[0] * scalar,
      vector3.components[1] * scalar,
      vector3.components[2] * scalar
    );
  }

  public static add(a: Vector3, b: Vector3): Vector3 {
    return a.clone().add(b);
  }

  public static subtract(a: Vector3, b: Vector3): Vector3 {
    return a.clone().subtract(b);
  }

  public static cross(a: Vector3, b: Vector3): Vector3 {
    const ax = a.components[0];
    const ay = a.components[1];
    const az = a.components[2];
    const bx = b.components[0];
    const by = b.components[1];
    const bz = b.components[2];

    return new Vector3(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }

  public add(vector3: Vector3): this {
    this.components[0] += vector3.components[0];
    this.components[1] += vector3.components[1];
    this.components[2] += vector3.components[2];

    return this;
  }

  public subtract(vector3: Vector3): this {
    this.components[0] -= vector3.components[0];
    this.components[1] -= vector3.components[1];
    this.components[2] -= vector3.components[2];

    return this;
  }

  public multiply(vector3: Vector3): this {
    this.components[0] *= vector3.components[0];
    this.components[1] *= vector3.components[1];
    this.components[2] *= vector3.components[2];

    return this;
  }

  public scale(scalar: number): this {
    this.components[0] *= scalar;
    this.components[1] *= scalar;
    this.components[2] *= scalar;

    return this;
  }

  public normalise(): this {
    const inverseMagnitude = 1 / this.magnitude;

    this.components[0] *= inverseMagnitude;
    this.components[1] *= inverseMagnitude;
    this.components[2] *= inverseMagnitude;

    return this;
  }

  public clone(): Vector3 {
    return new Vector3(
      this.components[0],
      this.components[1],
      this.components[2]
    );
  }

  public get magnitude(): number {
    return Math.hypot(
      this.components[0],
      this.components[1],
      this.components[2]
    );
  }

  public get x(): number {
    return this.components[0];
  }

  public get y(): number {
    return this.components[1];
  }

  public get z(): number {
    return this.components[2];
  }

  public set x(value: number) {
    this.components[0] = value;
  }

  public set y(value: number) {
    this.components[1] = value;
  }

  public set z(value: number) {
    this.components[2] = value;
  }
}

export { Vector3 };
