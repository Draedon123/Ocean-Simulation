import { Camera } from "./engine/rendering/Camera";
import { Mesh } from "./engine/rendering/Mesh";
import { Renderer } from "./engine/rendering/Renderer";
import { Loop } from "./engine/utils/Loop";
import { Vector3 } from "./engine/utils/Vector3";

const canvas = document.querySelector("canvas");

if (canvas === null) {
  throw new Error("Could not find canvas");
}

canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
});

const renderer = await Renderer.create(canvas, {
  wireframe: true,
});
await renderer.initialise();

const camera = new Camera({
  position: new Vector3(0, 1, 5),
});
const mesh = new Mesh(getSubdividedSquare(100, 10), "Square");
const loop = new Loop();

loop.addCallback(render);
loop.start();

function render() {
  camera.checkKeyboardInputs();
  renderer.render(camera, mesh);
}

// TODO: INDEXED VERTICES
function getSubdividedSquare(tiles: number, width: number): number[] {
  const tileWidth = width / tiles / 2;
  const centringAdjustment = 0.5 * (1 - 1 / tiles) * width;
  // prettier-ignore
  const baseVertices = [
    tileWidth - centringAdjustment, 0, -tileWidth - centringAdjustment,
    tileWidth - centringAdjustment, 0, tileWidth - centringAdjustment,
    -tileWidth - centringAdjustment, 0, tileWidth - centringAdjustment,
  
    -tileWidth - centringAdjustment, 0, -tileWidth - centringAdjustment,
    tileWidth - centringAdjustment, 0, -tileWidth - centringAdjustment,
    -tileWidth - centringAdjustment, 0, tileWidth - centringAdjustment,
  ]

  const newVertices: number[] = [];

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
