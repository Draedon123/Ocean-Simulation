import { Camera } from "@rendering/Camera";
import { Mesh } from "@rendering/Mesh";
import { Renderer } from "@rendering/Renderer";
import { Callback, FrameData, Loop } from "@utils/Loop";
import { subdivideSquare } from "@utils/subdivideSquare";
import { Vector3 } from "@utils/Vector3";

const loading = document.querySelector(".loading") as HTMLElement;
main()
  .then(() => {
    loading.remove();
  })
  .catch((error) => {
    loading.textContent =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
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

  const oceanSize: number = 50;
  const textureSize: number = 512;
  const renderer = await Renderer.create(canvas, {
    wireframe: false,
    meshSize: oceanSize,
    domainSize: 2000,
    textureSize,
    waveSpectrum: "phillips",
  });
  await renderer.initialise();

  const camera = new Camera({
    position: new Vector3(0, 5, -25),
    movementSpeed: 10,
    pitch: -20,
    yaw: 90,
  });
  const meshData = subdivideSquare(textureSize - 1, oceanSize);
  const oceanMesh = new Mesh(
    renderer.device,
    meshData.vertices,
    meshData.indices,
    "Ocean Mesh"
  );

  const loop = new Loop();

  const loopCallback: Callback = (data: FrameData): void => {
    const totalTimeSeconds = data.totalTimeMS / 1000;

    if (data.deltaTimeMS < 500) {
      camera.checkKeyboardInputs(data.deltaTimeSeconds);
    }

    renderer.render(camera, [oceanMesh], totalTimeSeconds);
  };

  loop.addCallback(loopCallback);
  loop.start();
}
