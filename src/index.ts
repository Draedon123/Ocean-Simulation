import { Camera } from "@rendering/Camera";
import { Mesh } from "@rendering/Mesh";
import { Renderer } from "@rendering/Renderer";
import { Callback, FrameData, Loop } from "@utils/Loop";
import { subdivideSquare } from "@utils/subdivideSquare";
import { Vector3 } from "@utils/Vector3";

main().catch((error) => {
  alert(error);
  throw error;
});

async function main(): Promise<void> {
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
  const meshData = subdivideSquare(500, 10);
  const oceanMesh = new Mesh(meshData.vertices, meshData.indices, "Ocean Mesh");

  const loop = new Loop();

  oceanMesh.initialise(renderer.device);

  const loopCallback: Callback = async (data: FrameData): Promise<void> => {
    const totalTimeSeconds = data.totalTimeMS / 1000;

    camera.checkKeyboardInputs();
    renderer.render(camera, [oceanMesh], totalTimeSeconds);
  };

  loop.addCallback(loopCallback);
  loop.start();
}
