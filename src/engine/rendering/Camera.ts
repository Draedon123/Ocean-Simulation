import { degreesToRadians } from "../utils/angles";
import { clamp } from "../utils/clamp";
import { KeyboardManager } from "../utils/KeyboardManager";
import { Matrix4 } from "../utils/Matrix4";
import { Vector3 } from "../utils/Vector3";

type CameraOptions = {
  position: Vector3;
  fieldOfView: number;
  aspectRatio: number;
  near: number;
  far: number;

  movementSpeed: number;
  mouseSensitivity: number;
};

class Camera implements CameraOptions {
  public position: Vector3;
  public fieldOfView: number;
  public aspectRatio: number;
  public near: number;
  public far: number;

  public movementSpeed: number;
  public mouseSensitivity: number;

  private forward: Vector3;
  private up: Vector3;
  private pitch: number;
  private yaw: number;

  private readonly keyboardManager: KeyboardManager;

  constructor(options: Partial<CameraOptions> = {}) {
    this.position = options.position ?? new Vector3();
    this.fieldOfView = options.fieldOfView ?? 60;
    this.aspectRatio = options.aspectRatio ?? 16 / 9;
    this.near = options.near ?? 0.001;
    this.far = options.far ?? 1000;

    this.movementSpeed = options.movementSpeed ?? 0.05;
    this.mouseSensitivity = options.mouseSensitivity ?? 0.1;

    this.forward = new Vector3(0, 0, -1);
    this.up = new Vector3(0, 1, 0);

    this.pitch = 0;
    this.yaw = -90;

    this.keyboardManager = new KeyboardManager(
      new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft"])
    );
    this.addEventListeners();
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
    return Matrix4.lookAt(
      this.position,
      Vector3.add(this.position, this.forward),
      this.up
    );
  }

  public checkKeyboardInputs(): void {
    if (this.keyboardManager.isKeyDown("KeyW")) {
      this.position.add(Vector3.scale(this.forward, this.movementSpeed));
    }
    if (this.keyboardManager.isKeyDown("KeyS")) {
      this.position.subtract(Vector3.scale(this.forward, this.movementSpeed));
    }
    if (this.keyboardManager.isKeyDown("KeyA")) {
      this.position.subtract(
        Vector3.scale(
          Vector3.cross(this.forward, this.up).normalise(),
          this.movementSpeed
        )
      );
    }
    if (this.keyboardManager.isKeyDown("KeyD")) {
      this.position.add(
        Vector3.scale(
          Vector3.cross(this.forward, this.up).normalise(),
          this.movementSpeed
        )
      );
    }
    if (this.keyboardManager.isKeyDown("Space")) {
      this.position.y += this.movementSpeed;
    }
    if (this.keyboardManager.isKeyDown("ShiftLeft")) {
      this.position.y -= this.movementSpeed;
    }
  }

  private addEventListeners(): void {
    this.keyboardManager.addEventListeners();

    document.addEventListener("mousemove", (event) => {
      const deltaX = event.movementX * this.mouseSensitivity;
      const deltaY = -event.movementY * this.mouseSensitivity;

      this.yaw += deltaX;
      this.pitch = clamp(-89, this.pitch + deltaY, 89);

      const yaw = degreesToRadians(this.yaw);
      const pitch = degreesToRadians(this.pitch);

      const cosYaw = Math.cos(yaw);
      const cosPitch = Math.cos(pitch);
      const sinYaw = Math.sin(yaw);
      const sinPitch = Math.sin(pitch);

      const direction = new Vector3(
        cosYaw * cosPitch,
        sinPitch,
        sinYaw * cosPitch
      ).normalise();

      this.forward = direction;
    });
  }
}

export { Camera };
