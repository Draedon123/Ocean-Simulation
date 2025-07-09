import { ButterflyTexture } from "./ButterflyTexture";
import { HeightAmplitudes } from "./HeightAmplitudes";
import { IFFT } from "./IFFT";
import { Permute } from "./Permute";

class WaveHeightMap {
  private constructor(
    private readonly permute: Permute,
    private readonly heightAmplitudes: HeightAmplitudes
  ) {}

  public create(time: number): void {
    this.heightAmplitudes.createSpectrum(time);
    this.permute.createHeightMap();
  }

  public get heightMap(): GPUTexture {
    return this.permute.heightMap;
  }

  public static async create(
    device: GPUDevice,
    domainSize: number,
    textureSize: number
  ): Promise<WaveHeightMap> {
    const heightAmplitudes = await HeightAmplitudes.create(
      device,
      domainSize,
      textureSize
    );

    const butterflyTexture = await ButterflyTexture.create(device, textureSize);
    butterflyTexture.createTexture();

    const ifft = await IFFT.create(
      device,
      textureSize,
      heightAmplitudes.texture,
      butterflyTexture
    );

    const permute = await Permute.create(device, textureSize, ifft);

    return new WaveHeightMap(permute, heightAmplitudes);
  }
}

export { WaveHeightMap };
