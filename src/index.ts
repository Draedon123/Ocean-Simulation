import { Camera } from "@rendering/Camera";
import { Mesh } from "@rendering/Mesh";
import { Renderer } from "@rendering/Renderer";
import { Callback, FrameData, Loop } from "@utils/Loop";
import { Vector3 } from "@utils/Vector3";

const canvas = document.querySelector("canvas");

if (canvas === null) {
  throw new Error("Could not find canvas");
}

canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
});

const renderer = await Renderer.create(canvas, {
  wireframe: false,
});
await renderer.initialise();

const camera = new Camera({
  position: new Vector3(0, 1, 5),
});
const mesh = new Mesh(getSubdividedSquare(100, 10), "Square");
const loop = new Loop();

const loopCallback: Callback = (data: FrameData): void => {
  const totalTimeSeconds = data.totalTimeMS / 1000;

  camera.checkKeyboardInputs();
  renderer.render(camera, mesh, totalTimeSeconds);
};

loop.addCallback(loopCallback);
loop.start();

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
