import { degreesToRadians } from "@utils/angles";
import { BufferWriter } from "@utils/BufferWriter";
import { clamp } from "@utils/clamp";
import { KeyboardManager } from "@utils/KeyboardManager";
import { Matrix4 } from "@utils/Matrix4";
import { Vector3 } from "@utils/Vector3";

type Keybinds = {
  forwards: string;
  backwards: string;
  left: string;
  right: string;
  up: string;
  down: string;
};

type CameraOptions = {
  position: Vector3;
  fieldOfView: number;
  aspectRatio: number;
  near: number;
  far: number;

  movementSpeed: number;
  mouseSensitivity: number;

  keybinds: Partial<Keybinds>;
};

class Camera implements CameraOptions {
  public static readonly BYTE_SIZE: number =
    32 * Float32Array.BYTES_PER_ELEMENT;

  public position: Vector3;
  public fieldOfView: number;
  public aspectRatio: number;
  public near: number;
  public far: number;

  public movementSpeed: number;
  public mouseSensitivity: number;

  public readonly keybinds: Keybinds;

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

    this.keybinds = {
      forwards: options.keybinds?.forwards ?? "KeyW",
      backwards: options.keybinds?.backwards ?? "KeyS",
      left: options.keybinds?.left ?? "KeyA",
      right: options.keybinds?.right ?? "KeyD",
      up: options.keybinds?.up ?? "Space",
      down: options.keybinds?.down ?? "ShiftLeft",
    };

    this.keyboardManager = new KeyboardManager(Object.values(this.keybinds));
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

  // TODO: CACHE
  public getPerspectiveViewMatrix(): Matrix4 {
    return this.getPerspectiveMatrix().postMultiply(this.getViewMatrix());
  }

  public writeToBuffer(): Float32Array {
    const bufferWriter = new BufferWriter(Camera.BYTE_SIZE);

    bufferWriter.writeMat4x4f(this.getPerspectiveViewMatrix());
    bufferWriter.writeVec3f32(this.position);
    bufferWriter.pad(4);
    bufferWriter.writeVec3f32(this.forward.normalise());

    return bufferWriter.toFloat32Array();
  }

  public checkKeyboardInputs(): void {
    if (this.keyboardManager.isKeyDown(this.keybinds.forwards)) {
      const forward = this.forward.clone();
      forward.y = 0;
      this.position.add(Vector3.scale(forward.normalise(), this.movementSpeed));
    }
    if (this.keyboardManager.isKeyDown(this.keybinds.backwards)) {
      const forward = this.forward.clone();
      forward.y = 0;
      this.position.subtract(
        Vector3.scale(forward.normalise(), this.movementSpeed)
      );
    }
    if (this.keyboardManager.isKeyDown(this.keybinds.left)) {
      const forward = this.forward.clone();
      forward.y = 0;
      this.position.subtract(
        Vector3.scale(
          Vector3.cross(forward, this.up).normalise(),
          this.movementSpeed
        )
      );
    }
    if (this.keyboardManager.isKeyDown(this.keybinds.right)) {
      const forward = this.forward.clone();
      forward.y = 0;
      this.position.add(
        Vector3.scale(
          Vector3.cross(forward, this.up).normalise(),
          this.movementSpeed
        )
      );
    }
    if (this.keyboardManager.isKeyDown(this.keybinds.up)) {
      this.position.y += this.movementSpeed;
    }
    if (this.keyboardManager.isKeyDown(this.keybinds.down)) {
      this.position.y -= this.movementSpeed;
    }
  }

  private addEventListeners(): void {
    this.keyboardManager.addEventListeners();

    document.addEventListener("mousemove", (event) => {
      const deltaX = event.movementX * this.mouseSensitivity;
      const deltaY = -event.movementY * this.mouseSensitivity;

      this.yaw += deltaX;
      this.pitch = clamp(this.pitch + deltaY, -89, 89);

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
