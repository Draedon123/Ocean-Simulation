import { ButterflyTexture } from "./ButterflyTexture";
import { HeightAmplitudes } from "./HeightAmplitudes";
import { IFFT } from "./IFFT";
import { SlopeAndDisplacement } from "./SlopeAndDisplacement";
import { Spectrum } from "./Spectrum";

class Ocean {
  private constructor(
    private readonly ifft: IFFT,
    private readonly heightAmplitudes: HeightAmplitudes,
    private readonly slopeAndDisplacement: SlopeAndDisplacement
  ) {}

  public create(time: number): void {
    this.heightAmplitudes.createSpectrum(time);
    this.slopeAndDisplacement.create();
    this.ifft.compute();
  }

  public get heightMap(): GPUTexture {
    return this.ifft.activeTexture;
  }

  public get slopeVector(): GPUTexture {
    return this.slopeAndDisplacement.slopeVector;
  }

  public get displacementField(): GPUTexture {
    return this.slopeAndDisplacement.displacementField;
  }

  public static async create(
    device: GPUDevice,
    domainSize: number,
    textureSize: number,
    waveSpectrum: WaveSpectrum
  ): Promise<Ocean> {
    const spectrum = await Spectrum.create(
      device,
      domainSize,
      textureSize,
      waveSpectrum
    );

    const heightAmplitudes = await HeightAmplitudes.create(
      device,
      spectrum,
      domainSize,
      textureSize
    );

    const butterflyTexture = await ButterflyTexture.create(device, textureSize);
    butterflyTexture.createTexture();

    const ifft = await IFFT.create(
      device,
      textureSize,
      heightAmplitudes.texture,
      1,
      "Wave Height Map",
      butterflyTexture
    );

    const slopeAndDisplacement = await SlopeAndDisplacement.create(
      device,
      heightAmplitudes.texture,
      textureSize,
      domainSize,
      butterflyTexture
    );

    return new Ocean(ifft, heightAmplitudes, slopeAndDisplacement);
  }
}

export { Ocean };
