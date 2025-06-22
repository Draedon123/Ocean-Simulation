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
  waves: 32,
});
await renderer.initialise();

const camera = new Camera({
  position: new Vector3(0, 0.5, 5),
});
const meshData = getSubdividedSquare(500, 10);
const mesh = new Mesh(meshData.vertices, meshData.indices, "Square");
const loop = new Loop();

const loopCallback: Callback = (data: FrameData): void => {
  const totalTimeSeconds = data.totalTimeMS / 1000;

  camera.checkKeyboardInputs();
  renderer.render(camera, mesh, totalTimeSeconds);
};

loop.addCallback(loopCallback);
loop.start();

function getSubdividedSquare(
  tiles: number,
  width: number
): { vertices: number[]; indices: number[] } {
  const tileWidth = width / tiles / 2;
  const centringAdjustment = 0.5 * (1 - 1 / tiles) * width;
  const meshStart = -tileWidth - centringAdjustment;
  const newVertices: number[] = [];
  const indices: number[] = [];

  const vertexCount = (tiles + 1) ** 2;

  for (let i = 0; i < vertexCount; i++) {
    const row = Math.floor(i / (tiles + 1));
    const column = i - (tiles + 1) * row;
    newVertices.push(
      meshStart + column * 2 * tileWidth,
      0,
      meshStart + row * 2 * tileWidth
    );
  }

  for (let x = 0; x < tiles; x++) {
    for (let y = 0; y < tiles; y++) {
      const currentRowOffset = y * (tiles + 1);
      const nextRowOffset = (y + 1) * (tiles + 1);
      indices.push(
        currentRowOffset + x + 1,
        nextRowOffset + x + 1,
        nextRowOffset + x
      );
      indices.push(
        currentRowOffset + x,
        currentRowOffset + x + 1,
        nextRowOffset + x
      );
    }
  }

  return {
    vertices: newVertices,
    indices,
  };
}
