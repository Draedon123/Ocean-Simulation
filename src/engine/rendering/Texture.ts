import { resolveBasePath } from "@utils/resolveBasePath";

class Texture {
  protected initialised: boolean;
  public texture!: GPUTexture;
  constructor(public readonly label: string = "") {
    this.initialised = false;
  }

  public async initialise(device: GPUDevice, ...urls: string[]): Promise<void> {
    if (this.initialised) {
      return;
    }

    const requests = urls.map(
      async (url) => await (await fetch(resolveBasePath(url))).blob()
    );
    const blobs = await Promise.all(requests);
    const sources = await Promise.all(
      blobs.map((blob) => createImageBitmap(blob))
    );

    this.texture = device.createTexture({
      label: this.label,
      format: "rgba8unorm",
      size: [sources[0].width, sources[0].height, sources.length],
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    for (let layer = 0; layer < sources.length; layer++) {
      const source = sources[layer];

      device.queue.copyExternalImageToTexture(
        {
          source: source,
        },
        {
          texture: this.texture,
          origin: [0, 0, layer],
        },
        {
          width: source.width,
          height: source.height,
        }
      );
    }

    this.initialised = true;
  }
}

export { Texture };
