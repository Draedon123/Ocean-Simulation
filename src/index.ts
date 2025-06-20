import { Camera } from "./engine/rendering/Camera";
import { Mesh } from "./engine/rendering/Mesh";
import { Renderer } from "./engine/rendering/Renderer";

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

const renderer = await Renderer.create(canvas);
await renderer.initialise();

const camera = new Camera();
const mesh = new Mesh(vertices, "Square");

camera.position.x = 5;
camera.position.y = 5;
camera.position.z = 5;

camera.lookAt.x = 0;
camera.lookAt.y = 0;
camera.lookAt.z = 0;

function render() {
  renderer.render(camera, mesh);

  requestAnimationFrame(render);
}

render();
