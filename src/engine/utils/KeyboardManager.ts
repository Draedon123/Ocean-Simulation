class KeyboardManager {
  public keybinds: Set<string>;
  private keysDown: Set<string>;
  constructor(keybinds: Iterable<string>) {
    this.keysDown = new Set();
    this.keybinds = new Set(keybinds);
  }

  public addEventListeners(): void {
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  public isKeyDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  private onKeyDown(event: KeyboardEvent): void {
    const key = event.code;

    if (this.keybinds.has(key)) {
      this.keysDown.add(key);
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const key = event.code;

    this.keysDown.delete(key);
  }
}

export { KeyboardManager };
