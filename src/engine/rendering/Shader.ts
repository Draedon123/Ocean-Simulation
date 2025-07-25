import { resolveBasePath } from "@utils/resolveBasePath";

class Shader {
  public shaderModule!: GPUShaderModule;
  constructor(
    device: GPUDevice,
    public code: string,
    public readonly label?: string
  ) {
    const shaderModule = device.createShaderModule({
      label: this.label,
      code: this.code,
    });

    this.shaderModule = shaderModule;
  }

  protected static async joinURLContents(urls: string[]): Promise<string> {
    const promises = urls.map((url) =>
      fetch(resolveBasePath(`shaders/${url}.wgsl`)).then((response) =>
        response.text()
      )
    );

    return (await Promise.all(promises)).join("");
  }

  public static async create(
    device: GPUDevice,
    url: string[] | string,
    label: string,
    codeOverride: (code: string) => string = (code: string) => code
  ): Promise<Shader> {
    const urls = typeof url === "string" ? [url] : url;
    const code = await Shader.joinURLContents(urls);

    return new Shader(device, codeOverride(code), label);
  }
}

export { Shader };
