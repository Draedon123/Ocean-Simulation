import { Texture } from "./Texture";

class Cubemap extends Texture {
  public override async initialise(
    device: GPUDevice,
    ...urls: string[]
  ): Promise<void> {
    if (urls.length !== 6) {
      throw new Error("Exactly 6 textures needed for Cubemap");
    }

    for (const url of urls) {
      // path/to/image.ext -> image
      const name =
        url.split("/").at(-1)?.split(".").slice(0, -1).join("") ?? "";

      if (!/^[np][xyz]$/.test(name)) {
        throw new Error(
          `Invalid url ${url}. File name must be in the format of (n or p)(x, y, or z)`
        );
      }
    }

    await super.initialise(device, ...urls);
  }
}

export { Cubemap };
