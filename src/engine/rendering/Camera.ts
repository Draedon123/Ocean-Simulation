import { degreesToRadians } from "../utils/angles";
import { Matrix4 } from "../utils/Matrix4";
import { Vector3 } from "../utils/Vector3";

type CameraOptions = {
  position: Vector3;
  lookAt: Vector3;
  fieldOfView: number;
  aspectRatio: number;
  near: number;
  far: number;
};

class Camera implements CameraOptions {
  public position: Vector3;
  public lookAt: Vector3;
  public fieldOfView: number;
  public aspectRatio: number;
  public near: number;
  public far: number;

  constructor(options: Partial<CameraOptions> = {}) {
    this.position = options.position ?? new Vector3();
    this.lookAt = options.lookAt ?? new Vector3(1, 1, 1);
    this.fieldOfView = options.fieldOfView ?? 60;
    this.aspectRatio = options.aspectRatio ?? 16 / 9;
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 1000;
  }

  // TODO: CACHE
  public getPerspectiveMatrix(): Matrix4 {
    return Matrix4.perspective(
      degreesToRadians(this.fieldOfView),
      this.aspectRatio,
      this.near,
      this.far
    );
  }

  // TODO: CACHE
  public getViewMatrix(): Matrix4 {
    const UP = new Vector3(0, 1, 0);

    const cameraDirection = Vector3.subtract(
      this.lookAt,
      this.position
    ).normalise();
    const cameraRight = Vector3.cross(UP, cameraDirection).normalise();
    const cameraUp = Vector3.cross(cameraDirection, cameraRight);

    return Matrix4.lookAt(this.position, this.lookAt, cameraUp);
  }
}

export { Camera };
