import { resolveBasePath } from "@utils/resolveBasePath";

class Shader {
  private initialised: boolean;
  public shaderModule!: GPUShaderModule;
  constructor(
    private readonly code: string,
    public readonly label?: string
  ) {
    this.initialised = false;
  }

  public static async from(
    url: string[] | string,
    label?: string
  ): Promise<Shader> {
    const urls = typeof url === "string" ? [url] : url;
    const promises = urls.map((url) =>
      fetch(resolveBasePath(`shaders/${url}.wgsl`)).then((response) =>
        response.text()
      )
    );
    const code = (await Promise.all(promises)).join("");

    return new Shader(code, label);
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      console.warn("Shader already initialised");

      return;
    }

    const shaderModule = device.createShaderModule({
      label: this.label,
      code: this.code,
    });

    this.shaderModule = shaderModule;
    this.initialised = true;
  }
}

export { Shader };
