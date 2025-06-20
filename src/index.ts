import { Camera } from "./engine/rendering/Camera";
import { Mesh } from "./engine/rendering/Mesh";
import { Renderer } from "./engine/rendering/Renderer";
import { Loop } from "./engine/utils/Loop";

const x = 1;
const y = 0.3;
const z = 1;
// prettier-ignore
const vertices = [
  x, -y, z,
  x, -y, -z,
  -x, -y, -z,

  -x, -y, z,
  x, -y, z,
  -x, -y, -z,
]

const canvas = document.querySelector("canvas");

if (canvas === null) {
  throw new Error("Could not find canvas");
}

canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
});

const renderer = await Renderer.create(canvas);
await renderer.initialise();

const camera = new Camera();
const mesh = new Mesh(vertices, "Square");

const loop = new Loop();

loop.addCallback(render);
loop.start();

function render() {
  camera.checkKeyboardInputs();
  renderer.render(camera, mesh);
}
