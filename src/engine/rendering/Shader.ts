class Shader {
  public static BASE_PATH: string = `${import.meta.env.BASE_URL}/shaders`;
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
      fetch(Shader.resolveBasePath(url)).then((response) => response.text())
    );
    const code = (await Promise.all(promises)).join("");

    return new Shader(code, label);
  }

  private static resolveBasePath(path: string): string {
    return Shader.BASE_PATH === "" ? path : `${Shader.BASE_PATH}/${path}.wgsl`;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
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
