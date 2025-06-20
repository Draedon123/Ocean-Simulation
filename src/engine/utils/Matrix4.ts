import { Vector3 } from "./Vector3";

class Matrix4 {
  public readonly components: Float32Array;
  constructor() {
    this.components = new Float32Array(16);

    this.components[0] = 1;
    this.components[5] = 1;
    this.components[10] = 1;
    this.components[15] = 1;
  }

  public copyFrom(source: Matrix4): this {
    this.components[0] = source.components[0];
    this.components[1] = source.components[1];
    this.components[2] = source.components[2];
    this.components[3] = source.components[3];
    this.components[4] = source.components[4];
    this.components[5] = source.components[5];
    this.components[6] = source.components[6];
    this.components[7] = source.components[7];
    this.components[8] = source.components[8];
    this.components[9] = source.components[9];
    this.components[10] = source.components[10];
    this.components[11] = source.components[11];
    this.components[12] = source.components[12];
    this.components[13] = source.components[13];
    this.components[14] = source.components[14];
    this.components[15] = source.components[15];

    return this;
  }

  // public transpose(): this {
  //   const a01 = this.components[1];
  //   const a02 = this.components[2];
  //   const a03 = this.components[3];
  //   const a12 = this.components[6];
  //   const a13 = this.components[7];
  //   const a23 = this.components[11];

  //   this.components[1] = this.components[4];
  //   this.components[2] = this.components[8];
  //   this.components[3] = this.components[12];
  //   this.components[4] = a01;
  //   this.components[6] = this.components[9];
  //   this.components[7] = this.components[13];
  //   this.components[8] = a02;
  //   this.components[9] = a12;
  //   this.components[11] = this.components[14];
  //   this.components[12] = a03;
  //   this.components[13] = a13;
  //   this.components[14] = a23;

  //   return this;
  // }

  // public invert(): this {
  //   const a00 = this.components[0];
  //   const a01 = this.components[1];
  //   const a02 = this.components[2];
  //   const a03 = this.components[3];
  //   const a10 = this.components[4];
  //   const a11 = this.components[5];
  //   const a12 = this.components[6];
  //   const a13 = this.components[7];
  //   const a20 = this.components[8];
  //   const a21 = this.components[9];
  //   const a22 = this.components[10];
  //   const a23 = this.components[11];
  //   const a30 = this.components[12];
  //   const a31 = this.components[13];
  //   const a32 = this.components[14];
  //   const a33 = this.components[15];

  //   const b00 = a00 * a11 - a01 * a10;
  //   const b01 = a00 * a12 - a02 * a10;
  //   const b02 = a00 * a13 - a03 * a10;
  //   const b03 = a01 * a12 - a02 * a11;
  //   const b04 = a01 * a13 - a03 * a11;
  //   const b05 = a02 * a13 - a03 * a12;
  //   const b06 = a20 * a31 - a21 * a30;
  //   const b07 = a20 * a32 - a22 * a30;
  //   const b08 = a20 * a33 - a23 * a30;
  //   const b09 = a21 * a32 - a22 * a31;
  //   const b10 = a21 * a33 - a23 * a31;
  //   const b11 = a22 * a33 - a23 * a32;

  //   const determinant =
  //     b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  //   if (determinant === 0) {
  //     console.warn("Determinant is 0. Matrix not inverted");
  //     return this;
  //   }

  //   const inverseDeterminant = 1 / determinant;

  //   this.components[0] =
  //     (a11 * b11 - a12 * b10 + a13 * b09) * inverseDeterminant;
  //   this.components[1] =
  //     (a02 * b10 - a01 * b11 - a03 * b09) * inverseDeterminant;
  //   this.components[2] =
  //     (a31 * b05 - a32 * b04 + a33 * b03) * inverseDeterminant;
  //   this.components[3] =
  //     (a22 * b04 - a21 * b05 - a23 * b03) * inverseDeterminant;
  //   this.components[4] =
  //     (a12 * b08 - a10 * b11 - a13 * b07) * inverseDeterminant;
  //   this.components[5] =
  //     (a00 * b11 - a02 * b08 + a03 * b07) * inverseDeterminant;
  //   this.components[6] =
  //     (a32 * b02 - a30 * b05 - a33 * b01) * inverseDeterminant;
  //   this.components[7] =
  //     (a20 * b05 - a22 * b02 + a23 * b01) * inverseDeterminant;
  //   this.components[8] =
  //     (a10 * b10 - a11 * b08 + a13 * b06) * inverseDeterminant;
  //   this.components[9] =
  //     (a01 * b08 - a00 * b10 - a03 * b06) * inverseDeterminant;
  //   this.components[10] =
  //     (a30 * b04 - a31 * b02 + a33 * b00) * inverseDeterminant;
  //   this.components[11] =
  //     (a21 * b02 - a20 * b04 - a23 * b00) * inverseDeterminant;
  //   this.components[12] =
  //     (a11 * b07 - a10 * b09 - a12 * b06) * inverseDeterminant;
  //   this.components[13] =
  //     (a00 * b09 - a01 * b07 + a02 * b06) * inverseDeterminant;
  //   this.components[14] =
  //     (a31 * b01 - a30 * b03 - a32 * b00) * inverseDeterminant;
  //   this.components[15] =
  //     (a20 * b03 - a21 * b01 + a22 * b00) * inverseDeterminant;

  //   return this;
  // }

  // public determinant(): number {
  //   const a00 = this.components[0];
  //   const a01 = this.components[1];
  //   const a02 = this.components[2];
  //   const a03 = this.components[3];
  //   const a10 = this.components[4];
  //   const a11 = this.components[5];
  //   const a12 = this.components[6];
  //   const a13 = this.components[7];
  //   const a20 = this.components[8];
  //   const a21 = this.components[9];
  //   const a22 = this.components[10];
  //   const a23 = this.components[11];
  //   const a30 = this.components[12];
  //   const a31 = this.components[13];
  //   const a32 = this.components[14];
  //   const a33 = this.components[15];

  //   const b0 = a00 * a11 - a01 * a10;
  //   const b1 = a00 * a12 - a02 * a10;
  //   const b2 = a01 * a12 - a02 * a11;
  //   const b3 = a20 * a31 - a21 * a30;
  //   const b4 = a20 * a32 - a22 * a30;
  //   const b5 = a21 * a32 - a22 * a31;
  //   const b6 = a00 * b5 - a01 * b4 + a02 * b3;
  //   const b7 = a10 * b5 - a11 * b4 + a12 * b3;
  //   const b8 = a20 * b2 - a21 * b1 + a22 * b0;
  //   const b9 = a30 * b2 - a31 * b1 + a32 * b0;

  //   return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
  // }

  // public preMultiply(a: Matrix4): this {
  //   Matrix4.multiply(this, a, this);

  //   return this;
  // }

  // public postMultiply(a: Matrix4): this {
  //   Matrix4.multiply(a, this, this);

  //   return this;
  // }

  // public static multiply(
  //   a: Matrix4,
  //   b: Matrix4,
  //   out: Matrix4 = new Matrix4()
  // ): Matrix4 {
  //   const a00 = a.components[0];
  //   const a01 = a.components[1];
  //   const a02 = a.components[2];
  //   const a03 = a.components[3];
  //   const a10 = a.components[4];
  //   const a11 = a.components[5];
  //   const a12 = a.components[6];
  //   const a13 = a.components[7];
  //   const a20 = a.components[8];
  //   const a21 = a.components[9];
  //   const a22 = a.components[10];
  //   const a23 = a.components[11];
  //   const a30 = a.components[12];
  //   const a31 = a.components[13];
  //   const a32 = a.components[14];
  //   const a33 = a.components[15];

  //   let b0 = b.components[0];
  //   let b1 = b.components[1];
  //   let b2 = b.components[2];
  //   let b3 = b.components[3];

  //   out.components[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  //   out.components[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  //   out.components[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  //   out.components[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  //   b0 = b.components[4];
  //   b1 = b.components[5];
  //   b2 = b.components[6];
  //   b3 = b.components[7];

  //   out.components[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  //   out.components[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  //   out.components[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  //   out.components[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  //   b0 = b.components[8];
  //   b1 = b.components[9];
  //   b2 = b.components[10];
  //   b3 = b.components[11];

  //   out.components[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  //   out.components[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  //   out.components[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  //   out.components[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  //   b0 = b.components[12];
  //   b1 = b.components[13];
  //   b2 = b.components[14];
  //   b3 = b.components[15];

  //   out.components[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  //   out.components[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  //   out.components[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  //   out.components[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  //   return out;
  // }

  public static perspective(
    fieldOfViewRadians: number,
    aspectRatio: number,
    near: number,
    far: number
  ): Matrix4 {
    const matrix = new Matrix4();
    const f = 1.0 / Math.tan(fieldOfViewRadians / 2);
    matrix.components[0] = f / aspectRatio;
    matrix.components[5] = f;
    matrix.components[11] = -1;
    matrix.components[15] = 0;

    if (far !== Infinity) {
      const nearFar = 1 / (near - far);

      matrix.components[10] = far * nearFar;
      matrix.components[14] = far * near * nearFar;
    } else {
      matrix.components[10] = -1;
      matrix.components[14] = -near;
    }

    return matrix;
  }

  public static lookAt(
    position: Vector3,
    lookAt: Vector3,
    up: Vector3
  ): Matrix4 {
    const out = new Matrix4();
    const EPSILON = 1e-6;

    let x0, x1, x2, y0, y1, y2, z0, z1, z2, length;

    const positionX = position.x;
    const positionY = position.y;
    const positionZ = position.z;
    const upX = up.x;
    const upY = up.y;
    const upZ = up.z;
    const lookAtX = lookAt.x;
    const lookAtY = lookAt.y;
    const lookAtZ = lookAt.z;

    if (
      Math.abs(positionX - lookAtX) < EPSILON &&
      Math.abs(positionY - lookAtY) < EPSILON &&
      Math.abs(positionZ - lookAtZ) < EPSILON
    ) {
      console.warn("Look At too close to Position");
      return new Matrix4();
    }

    z0 = positionX - lookAtX;
    z1 = positionY - lookAtY;
    z2 = positionZ - lookAtZ;

    length = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= length;
    z1 *= length;
    z2 *= length;

    x0 = upY * z2 - upZ * z1;
    x1 = upZ * z0 - upX * z2;
    x2 = upX * z1 - upY * z0;
    length = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!length) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      length = 1 / length;
      x0 *= length;
      x1 *= length;
      x2 *= length;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    length = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!length) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      length = 1 / length;
      y0 *= length;
      y1 *= length;
      y2 *= length;
    }

    out.components[0] = x0;
    out.components[1] = y0;
    out.components[2] = z0;
    out.components[3] = 0;
    out.components[4] = x1;
    out.components[5] = y1;
    out.components[6] = z1;
    out.components[7] = 0;
    out.components[8] = x2;
    out.components[9] = y2;
    out.components[10] = z2;
    out.components[11] = 0;
    out.components[12] = -(x0 * positionX + x1 * positionY + x2 * positionZ);
    out.components[13] = -(y0 * positionX + y1 * positionY + y2 * positionZ);
    out.components[14] = -(z0 * positionX + z1 * positionY + z2 * positionZ);
    out.components[15] = 1;

    return out;
  }
}

export { Matrix4 };
