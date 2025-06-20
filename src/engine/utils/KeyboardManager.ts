type EventListener = {
  type: keyof DocumentEventMap;
  callback: (event: KeyboardEvent) => unknown;
};

class KeyboardManager {
  public keybinds: Set<string>;
  private eventListeners: EventListener[];
  private keysDown: Set<string>;
  constructor(keybinds: Iterable<string>) {
    this.eventListeners = [];
    this.keysDown = new Set();
    this.keybinds = new Set(keybinds);
  }

  public addEventListeners(): void {
    if (this.eventListeners.length > 0) {
      return;
    }

    const onKeyDown: EventListener = {
      type: "keydown",
      callback: this.onKeyDown.bind(this),
    };

    const onKeyUp: EventListener = {
      type: "keyup",
      callback: this.onKeyUp.bind(this),
    };

    document.addEventListener("keydown", onKeyDown.callback);
    document.addEventListener("keyup", onKeyUp.callback);
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

  public removeEventListeners(): void {
    for (const { type, callback } of this.eventListeners) {
      // @ts-expect-error no idea why typescript is doing this
      document.removeEventListener(type, callback);
    }
  }
}

export { KeyboardManager };
