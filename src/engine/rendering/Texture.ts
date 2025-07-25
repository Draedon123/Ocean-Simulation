import { resolveBasePath } from "@utils/resolveBasePath";

class Texture {
  constructor(
    public readonly label: string,
    public readonly texture: GPUTexture
  ) {}

  public static async create(
    device: GPUDevice,
    label: string,
    ...urls: string[]
  ): Promise<Texture> {
    const requests = urls.map(
      async (url) => await (await fetch(resolveBasePath(url))).blob()
    );
    const blobs = await Promise.all(requests);
    const sources = await Promise.all(
      blobs.map((blob) => createImageBitmap(blob))
    );

    const texture = device.createTexture({
      label,
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
          texture,
          origin: [0, 0, layer],
        },
        {
          width: source.width,
          height: source.height,
        }
      );
    }

    return new Texture(label, texture);
  }

  public static async createCubemap(
    device: GPUDevice,
    label: string,
    textureDirectory: string
  ): Promise<Texture> {
    return await Texture.create(
      device,
      label,
      `${textureDirectory}/px.png`,
      `${textureDirectory}/nx.png`,
      `${textureDirectory}/py.png`,
      `${textureDirectory}/ny.png`,
      `${textureDirectory}/pz.png`,
      `${textureDirectory}/nz.png`
    );
  }
}

export { Texture };
