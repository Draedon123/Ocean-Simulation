true&&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

const DEGREES_TO_RADIANS = Math.PI / 180;
function degreesToRadians(degrees) {
  return degrees * DEGREES_TO_RADIANS;
}

function clamp(value, min, max) {
  return Math.max(Math.min(value, max), min);
}

class KeyboardManager {
  constructor(keybinds) {
    this.keybinds = keybinds;
    this.eventListeners = [];
    this.keysDown = /* @__PURE__ */ new Set();
  }
  eventListeners;
  keysDown;
  addEventListeners() {
    if (this.eventListeners.length > 0) {
      return;
    }
    const onKeyDown = {
      callback: this.onKeyDown.bind(this)
    };
    const onKeyUp = {
      callback: this.onKeyUp.bind(this)
    };
    document.addEventListener("keydown", onKeyDown.callback);
    document.addEventListener("keyup", onKeyUp.callback);
  }
  isKeyDown(key) {
    return this.keysDown.has(key);
  }
  onKeyDown(event) {
    const key = event.code;
    if (this.keybinds.has(key)) {
      this.keysDown.add(key);
    }
  }
  onKeyUp(event) {
    const key = event.code;
    this.keysDown.delete(key);
  }
  removeEventListeners() {
    for (const { type, callback } of this.eventListeners) {
      document.removeEventListener(type, callback);
    }
  }
}

class Matrix4 {
  components;
  constructor() {
    this.components = new Float32Array(16);
    this.components[0] = 1;
    this.components[5] = 1;
    this.components[10] = 1;
    this.components[15] = 1;
  }
  transpose() {
    const a01 = this.components[1];
    const a02 = this.components[2];
    const a03 = this.components[3];
    const a12 = this.components[6];
    const a13 = this.components[7];
    const a23 = this.components[11];
    this.components[1] = this.components[4];
    this.components[2] = this.components[8];
    this.components[3] = this.components[12];
    this.components[4] = a01;
    this.components[6] = this.components[9];
    this.components[7] = this.components[13];
    this.components[8] = a02;
    this.components[9] = a12;
    this.components[11] = this.components[14];
    this.components[12] = a03;
    this.components[13] = a13;
    this.components[14] = a23;
    return this;
  }
  invert() {
    const a00 = this.components[0];
    const a01 = this.components[1];
    const a02 = this.components[2];
    const a03 = this.components[3];
    const a10 = this.components[4];
    const a11 = this.components[5];
    const a12 = this.components[6];
    const a13 = this.components[7];
    const a20 = this.components[8];
    const a21 = this.components[9];
    const a22 = this.components[10];
    const a23 = this.components[11];
    const a30 = this.components[12];
    const a31 = this.components[13];
    const a32 = this.components[14];
    const a33 = this.components[15];
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;
    const determinant = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (determinant === 0) {
      console.warn("Determinant is 0. Matrix not inverted");
      return this;
    }
    const inverseDeterminant = 1 / determinant;
    this.components[0] = (a11 * b11 - a12 * b10 + a13 * b09) * inverseDeterminant;
    this.components[1] = (a02 * b10 - a01 * b11 - a03 * b09) * inverseDeterminant;
    this.components[2] = (a31 * b05 - a32 * b04 + a33 * b03) * inverseDeterminant;
    this.components[3] = (a22 * b04 - a21 * b05 - a23 * b03) * inverseDeterminant;
    this.components[4] = (a12 * b08 - a10 * b11 - a13 * b07) * inverseDeterminant;
    this.components[5] = (a00 * b11 - a02 * b08 + a03 * b07) * inverseDeterminant;
    this.components[6] = (a32 * b02 - a30 * b05 - a33 * b01) * inverseDeterminant;
    this.components[7] = (a20 * b05 - a22 * b02 + a23 * b01) * inverseDeterminant;
    this.components[8] = (a10 * b10 - a11 * b08 + a13 * b06) * inverseDeterminant;
    this.components[9] = (a01 * b08 - a00 * b10 - a03 * b06) * inverseDeterminant;
    this.components[10] = (a30 * b04 - a31 * b02 + a33 * b00) * inverseDeterminant;
    this.components[11] = (a21 * b02 - a20 * b04 - a23 * b00) * inverseDeterminant;
    this.components[12] = (a11 * b07 - a10 * b09 - a12 * b06) * inverseDeterminant;
    this.components[13] = (a00 * b09 - a01 * b07 + a02 * b06) * inverseDeterminant;
    this.components[14] = (a31 * b01 - a30 * b03 - a32 * b00) * inverseDeterminant;
    this.components[15] = (a20 * b03 - a21 * b01 + a22 * b00) * inverseDeterminant;
    return this;
  }
  determinant() {
    const a00 = this.components[0];
    const a01 = this.components[1];
    const a02 = this.components[2];
    const a03 = this.components[3];
    const a10 = this.components[4];
    const a11 = this.components[5];
    const a12 = this.components[6];
    const a13 = this.components[7];
    const a20 = this.components[8];
    const a21 = this.components[9];
    const a22 = this.components[10];
    const a23 = this.components[11];
    const a30 = this.components[12];
    const a31 = this.components[13];
    const a32 = this.components[14];
    const a33 = this.components[15];
    const b0 = a00 * a11 - a01 * a10;
    const b1 = a00 * a12 - a02 * a10;
    const b2 = a01 * a12 - a02 * a11;
    const b3 = a20 * a31 - a21 * a30;
    const b4 = a20 * a32 - a22 * a30;
    const b5 = a21 * a32 - a22 * a31;
    const b6 = a00 * b5 - a01 * b4 + a02 * b3;
    const b7 = a10 * b5 - a11 * b4 + a12 * b3;
    const b8 = a20 * b2 - a21 * b1 + a22 * b0;
    const b9 = a30 * b2 - a31 * b1 + a32 * b0;
    return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
  }
  preMultiply(a) {
    Matrix4.multiply(this, a, this);
    return this;
  }
  postMultiply(a) {
    Matrix4.multiply(a, this, this);
    return this;
  }
  static multiply(a, b, out = new Matrix4()) {
    const a00 = a.components[0];
    const a01 = a.components[1];
    const a02 = a.components[2];
    const a03 = a.components[3];
    const a10 = a.components[4];
    const a11 = a.components[5];
    const a12 = a.components[6];
    const a13 = a.components[7];
    const a20 = a.components[8];
    const a21 = a.components[9];
    const a22 = a.components[10];
    const a23 = a.components[11];
    const a30 = a.components[12];
    const a31 = a.components[13];
    const a32 = a.components[14];
    const a33 = a.components[15];
    let b0 = b.components[0];
    let b1 = b.components[1];
    let b2 = b.components[2];
    let b3 = b.components[3];
    out.components[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out.components[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out.components[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out.components[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b.components[4];
    b1 = b.components[5];
    b2 = b.components[6];
    b3 = b.components[7];
    out.components[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out.components[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out.components[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out.components[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b.components[8];
    b1 = b.components[9];
    b2 = b.components[10];
    b3 = b.components[11];
    out.components[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out.components[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out.components[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out.components[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b.components[12];
    b1 = b.components[13];
    b2 = b.components[14];
    b3 = b.components[15];
    out.components[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out.components[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out.components[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out.components[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  static perspective(fieldOfViewRadians, aspectRatio, near, far) {
    const matrix = new Matrix4();
    const f = 1 / Math.tan(fieldOfViewRadians / 2);
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
  static lookAt(position, lookAt, up) {
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
    if (Math.abs(positionX - lookAtX) < EPSILON && Math.abs(positionY - lookAtY) < EPSILON && Math.abs(positionZ - lookAtZ) < EPSILON) {
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

class Vector3 {
  static ZERO = new Vector3();
  components;
  constructor(x = 0, y = 0, z = 0) {
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
  static scale(vector3, scalar) {
    return new Vector3(
      vector3.components[0] * scalar,
      vector3.components[1] * scalar,
      vector3.components[2] * scalar
    );
  }
  static add(a, b) {
    return a.clone().add(b);
  }
  static subtract(a, b) {
    return a.clone().subtract(b);
  }
  static cross(a, b) {
    const ax = a.components[0];
    const ay = a.components[1];
    const az = a.components[2];
    const bx = b.components[0];
    const by = b.components[1];
    const bz = b.components[2];
    return new Vector3(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }
  add(vector3) {
    this.components[0] += vector3.components[0];
    this.components[1] += vector3.components[1];
    this.components[2] += vector3.components[2];
    return this;
  }
  subtract(vector3) {
    this.components[0] -= vector3.components[0];
    this.components[1] -= vector3.components[1];
    this.components[2] -= vector3.components[2];
    return this;
  }
  multiply(vector3) {
    this.components[0] *= vector3.components[0];
    this.components[1] *= vector3.components[1];
    this.components[2] *= vector3.components[2];
    return this;
  }
  scale(scalar) {
    this.components[0] *= scalar;
    this.components[1] *= scalar;
    this.components[2] *= scalar;
    return this;
  }
  normalise() {
    const inverseMagnitude = 1 / this.magnitude;
    this.components[0] *= inverseMagnitude;
    this.components[1] *= inverseMagnitude;
    this.components[2] *= inverseMagnitude;
    return this;
  }
  clone() {
    return new Vector3(
      this.components[0],
      this.components[1],
      this.components[2]
    );
  }
  get magnitude() {
    return Math.hypot(
      this.components[0],
      this.components[1],
      this.components[2]
    );
  }
  get x() {
    return this.components[0];
  }
  get y() {
    return this.components[1];
  }
  get z() {
    return this.components[2];
  }
  set x(value) {
    this.components[0] = value;
  }
  set y(value) {
    this.components[1] = value;
  }
  set z(value) {
    this.components[2] = value;
  }
}

class Camera {
  position;
  fieldOfView;
  aspectRatio;
  near;
  far;
  movementSpeed;
  mouseSensitivity;
  forward;
  up;
  pitch;
  yaw;
  keyboardManager;
  constructor(options = {}) {
    this.position = options.position ?? new Vector3();
    this.fieldOfView = options.fieldOfView ?? 60;
    this.aspectRatio = options.aspectRatio ?? 16 / 9;
    this.near = options.near ?? 1e-3;
    this.far = options.far ?? 1e3;
    this.movementSpeed = options.movementSpeed ?? 0.05;
    this.mouseSensitivity = options.mouseSensitivity ?? 0.1;
    this.forward = new Vector3(0, 0, -1);
    this.up = new Vector3(0, 1, 0);
    this.pitch = 0;
    this.yaw = -90;
    this.keyboardManager = new KeyboardManager(
      /* @__PURE__ */ new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft"])
    );
    this.addEventListeners();
  }
  // TODO: CACHE
  getPerspectiveMatrix() {
    return Matrix4.perspective(
      degreesToRadians(this.fieldOfView),
      this.aspectRatio,
      this.near,
      this.far
    );
  }
  // TODO: CACHE
  getViewMatrix() {
    return Matrix4.lookAt(
      this.position,
      Vector3.add(this.position, this.forward),
      this.up
    );
  }
  checkKeyboardInputs() {
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
  addEventListeners() {
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

class Mesh {
  constructor(vertices, label = "") {
    this.vertices = vertices;
    this.label = label;
    this.initialised = false;
  }
  vertexBuffer;
  initialised;
  initialise(device) {
    if (this.initialised) {
      return;
    }
    const vertices = new Float32Array(this.vertices);
    this.vertexBuffer = device.createBuffer({
      label: this.label,
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    this.initialised = true;
  }
  get verticeCount() {
    return this.vertices.length / 3;
  }
}

class Shader {
  constructor(code, label) {
    this.code = code;
    this.label = label;
    this.initialised = false;
  }
  static BASE_PATH = `${"/Ocean-Simulation"}/shaders`;
  initialised;
  shaderModule;
  static async from(url, label) {
    const urls = typeof url === "string" ? [url] : url;
    const promises = urls.map(
      (url2) => fetch(Shader.resolveBasePath(url2)).then((response) => response.text())
    );
    const code = (await Promise.all(promises)).join("");
    return new Shader(code, label);
  }
  static resolveBasePath(path) {
    return Shader.BASE_PATH === "" ? path : `${Shader.BASE_PATH}/${path}.wgsl`;
  }
  initialise(device) {
    if (this.initialised) {
      return;
    }
    const shaderModule = device.createShaderModule({
      label: this.label,
      code: this.code
    });
    this.shaderModule = shaderModule;
    this.initialised = true;
  }
}

const vertexBufferLayout = {
  arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
  attributes: [
    {
      format: "float32x3",
      offset: 0,
      shaderLocation: 0
    }
  ]
};
class Renderer {
  constructor(device, canvas, _settings) {
    this.device = device;
    this.canvas = canvas;
    const ctx = this.canvas.getContext("webgpu");
    if (ctx === null) {
      throw new Error("Could not get WebGPU Canvas context");
    }
    this.ctx = ctx;
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.initialised = false;
    const settings = Object.assign(
      structuredClone(Renderer.DEFAULT_SETTINGS),
      _settings
    );
    this.settings = settings;
    new ResizeObserver((entries) => {
      const canvas2 = entries[0];
      const width = canvas2.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas2.devicePixelContentBoxSize[0].blockSize;
      this.canvas.width = width;
      this.canvas.height = height;
    }).observe(this.canvas);
  }
  static DEFAULT_SETTINGS = {
    wireframe: false
  };
  settings;
  ctx;
  canvasFormat;
  initialised;
  renderShaderModule;
  renderBindGroup;
  renderPipeline;
  perspectiveMatrix;
  viewMatrix;
  async initialise() {
    if (this.initialised) {
      return;
    }
    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat
    });
    this.renderShaderModule = await Shader.from(
      "render",
      "Render Shader Module"
    );
    this.renderShaderModule.initialise(this.device);
    this.perspectiveMatrix = this.device.createBuffer({
      label: "Camera Matrix",
      size: 16 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.viewMatrix = this.device.createBuffer({
      label: "Camera Matrix",
      size: 16 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const renderBindGroupLayout = this.device.createBindGroupLayout({
      label: "Render Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: {},
          visibility: GPUShaderStage.VERTEX
        },
        {
          binding: 1,
          buffer: {},
          visibility: GPUShaderStage.VERTEX
        }
      ]
    });
    this.renderBindGroup = this.device.createBindGroup({
      label: "Render Bind Group",
      layout: renderBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.perspectiveMatrix
          }
        },
        {
          binding: 1,
          resource: {
            buffer: this.viewMatrix
          }
        }
      ]
    });
    const renderPipelineLayout = this.device.createPipelineLayout({
      label: "Render Pipeline Layout",
      bindGroupLayouts: [renderBindGroupLayout]
    });
    this.renderPipeline = this.device.createRenderPipeline({
      label: "Render Pipeline",
      layout: renderPipelineLayout,
      vertex: {
        module: this.renderShaderModule.shaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout]
      },
      fragment: {
        module: this.renderShaderModule.shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: this.canvasFormat }]
      },
      primitive: {
        topology: this.settings.wireframe ? "line-strip" : "triangle-list"
      }
    });
    this.initialised = true;
  }
  render(camera, mesh) {
    if (!this.initialised) {
      console.error("Renderer not initialised");
      return;
    }
    mesh.initialise(this.device);
    camera.aspectRatio = this.canvas.width / this.canvas.height;
    this.device.queue.writeBuffer(
      this.perspectiveMatrix,
      0,
      camera.getPerspectiveMatrix().components
    );
    this.device.queue.writeBuffer(
      this.viewMatrix,
      0,
      camera.getViewMatrix().components
    );
    const commandEncoder = this.device.createCommandEncoder({
      label: "Render Command Encoder"
    });
    const renderPass = commandEncoder.beginRenderPass({
      label: "Render Pass",
      colorAttachments: [
        {
          view: this.ctx.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store"
        }
      ]
    });
    renderPass.setViewport(0, 0, this.canvas.width, this.canvas.height, 0, 1);
    renderPass.setVertexBuffer(0, mesh.vertexBuffer);
    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.setPipeline(this.renderPipeline);
    renderPass.draw(mesh.verticeCount);
    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
  static async create(canvas, settings = {}) {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter === null) {
      throw new Error("No GPU Adapter found");
    }
    const device = await adapter.requestDevice();
    return new Renderer(device, canvas, settings);
  }
}

class Loop {
  callbacks;
  animationFrameID;
  lastTick;
  constructor() {
    this.callbacks = [];
    this.animationFrameID = null;
    this.lastTick = 0;
  }
  start() {
    if (this.animationFrameID !== null) {
      cancelAnimationFrame(this.animationFrameID);
    }
    this.tick(0);
  }
  stop() {
    if (this.animationFrameID === null) {
      return;
    }
    cancelAnimationFrame(this.animationFrameID);
    this.animationFrameID = null;
  }
  tick(tickTime) {
    const deltaTime = tickTime - this.lastTick;
    for (const callback of this.callbacks) {
      callback(deltaTime);
    }
    this.lastTick = tickTime;
    this.animationFrameID = requestAnimationFrame(
      (time) => this.tick.bind(this)(time)
    );
  }
  addCallback(callback) {
    this.callbacks.push(callback);
  }
  removeCallback(callback) {
    const index = this.callbacks.findIndex((x) => x === callback);
    if (index === -1) {
      console.warn("Callback not found");
      return;
    }
    this.callbacks.splice(index, 1);
  }
}

const canvas = document.querySelector("canvas");
if (canvas === null) {
  throw new Error("Could not find canvas");
}
canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
});
const renderer = await Renderer.create(canvas, {
  wireframe: true
});
await renderer.initialise();
const camera = new Camera({
  position: new Vector3(0, 1, 5)
});
const mesh = new Mesh(getSubdividedSquare(100, 10), "Square");
const loop = new Loop();
loop.addCallback(render);
loop.start();
function render() {
  camera.checkKeyboardInputs();
  renderer.render(camera, mesh);
}
function getSubdividedSquare(tiles, width) {
  const tileWidth = width / tiles / 2;
  const centringAdjustment = 0.5 * (1 - 1 / tiles) * width;
  const baseVertices = [
    tileWidth - centringAdjustment,
    0,
    -0.05 - centringAdjustment,
    tileWidth - centringAdjustment,
    0,
    tileWidth - centringAdjustment,
    -0.05 - centringAdjustment,
    0,
    tileWidth - centringAdjustment,
    -0.05 - centringAdjustment,
    0,
    -0.05 - centringAdjustment,
    tileWidth - centringAdjustment,
    0,
    -0.05 - centringAdjustment,
    -0.05 - centringAdjustment,
    0,
    tileWidth - centringAdjustment
  ];
  const newVertices = [];
  for (let x = 0; x < tiles; x++) {
    for (let z = 0; z < tiles; z++) {
      for (let i = 0; i < baseVertices.length; i++) {
        const value = baseVertices[i];
        switch (i % 3) {
          case 0:
            newVertices.push(value + x * tileWidth * 2);
            break;
          case 1:
            newVertices.push(value);
            break;
          case 2:
            newVertices.push(value + z * tileWidth * 2);
            break;
        }
      }
    }
  }
  return newVertices;
}
