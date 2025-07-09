import { ButterflyTexture } from "./ButterflyTexture";
import { HeightAmplitudes } from "./HeightAmplitudes";
import { IFFT } from "./IFFT";
import { SlopeVector } from "./SlopeVector";
import { Permute } from "./Permute";

class Ocean {
  private constructor(
    private readonly permute: Permute,
    private readonly ifft: IFFT,
    private readonly heightAmplitudes: HeightAmplitudes,
    private readonly _slopeVector: SlopeVector
  ) {}

  public create(time: number): void {
    this.heightAmplitudes.createSpectrum(time);
    this._slopeVector.create();
    this.ifft.call();
    this.permute.call();
  }

  public get heightMap(): GPUTexture {
    return this.permute.permuted;
  }

  public get slopeVector(): GPUTexture {
    return this._slopeVector.slopeVector;
  }

  public static async create(
    device: GPUDevice,
    domainSize: number,
    textureSize: number
  ): Promise<Ocean> {
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

    const permute = await Permute.create(
      device,
      textureSize,
      ifft,
      1,
      "Wave Height Map"
    );

    const normalMap = await SlopeVector.create(
      device,
      heightAmplitudes.texture,
      textureSize,
      domainSize,
      butterflyTexture
    );

    return new Ocean(permute, ifft, heightAmplitudes, normalMap);
  }
}

export { Ocean };
