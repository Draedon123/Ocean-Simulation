import { Mesh } from "./engine/rendering/Mesh";
import { Renderer } from "./engine/rendering/Renderer";

// prettier-ignore
const vertices = [
  1, 1, 1,
  1, -1, 1,
  -1, -1, 1,

  -1, 1, 1,
  1, 1, 1,
  -1, -1, 1,
].map(x => 0.5 * x)

const canvas = document.querySelector("canvas");

if (canvas === null) {
  throw new Error("Could not find canvas");
}

const renderer = await Renderer.create(canvas);
await renderer.initialise();

const mesh = new Mesh(vertices, "Cube");

renderer.render(mesh);
