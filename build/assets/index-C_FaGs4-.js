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
  constructor(device, canvas) {
    this.device = device;
    this.canvas = canvas;
    const ctx = this.canvas.getContext("webgpu");
    if (ctx === null) {
      throw new Error("Could not get WebGPU Canvas context");
    }
    this.ctx = ctx;
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    new ResizeObserver((entries) => {
      const canvas2 = entries[0];
      const width = canvas2.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas2.devicePixelContentBoxSize[0].blockSize;
      this.canvas.width = width;
      this.canvas.height = height;
    }).observe(this.canvas);
  }
  ctx;
  canvasFormat;
  renderShaderModule;
  renderBindGroup;
  renderPipeline;
  async initialise() {
    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat
    });
    this.renderShaderModule = await Shader.from(
      "render",
      "Render Shader Module"
    );
    this.renderShaderModule.initialise(this.device);
    const renderBindGroupLayout = this.device.createBindGroupLayout({
      label: "Render Bind Group Layout",
      entries: []
    });
    this.renderBindGroup = this.device.createBindGroup({
      label: "Render Bind Group",
      layout: renderBindGroupLayout,
      entries: []
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
      }
    });
  }
  render(mesh) {
    mesh.initialise(this.device);
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
  static async create(canvas) {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter === null) {
      throw new Error("No GPU Adapter found");
    }
    const device = await adapter.requestDevice();
    return new Renderer(device, canvas);
  }
}

const vertices = [
  1,
  1,
  1,
  1,
  -1,
  1,
  -1,
  -1,
  1,
  -1,
  1,
  1,
  1,
  1,
  1,
  -1,
  -1,
  1
].map((x) => 0.5 * x);
const canvas = document.querySelector("canvas");
if (canvas === null) {
  throw new Error("Could not find canvas");
}
const renderer = await Renderer.create(canvas);
await renderer.initialise();
const mesh = new Mesh(vertices, "Cube");
renderer.render(mesh);
