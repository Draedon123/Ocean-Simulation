type Callback = (frameData: FrameData) => unknown;

type FrameData = {
  deltaTimeMS: number;
  totalTimeMS: number;
};

class Loop {
  private readonly callbacks: Callback[];
  private animationFrameID: number | null;
  private lastTick: number;

  constructor() {
    this.callbacks = [];
    this.animationFrameID = null;
    this.lastTick = 0;
  }

  public start(): void {
    if (this.animationFrameID !== null) {
      cancelAnimationFrame(this.animationFrameID);
    }

    this.tick(0);
  }

  public stop(): void {
    if (this.animationFrameID === null) {
      return;
    }

    cancelAnimationFrame(this.animationFrameID);
    this.animationFrameID = null;
  }

  public tick(tickTime: number): void {
    const deltaTime = tickTime - this.lastTick;
    const frameData: FrameData = {
      deltaTimeMS: deltaTime,
      totalTimeMS: tickTime,
    };

    for (const callback of this.callbacks) {
      callback(frameData);
    }

    this.lastTick = tickTime;
    this.animationFrameID = requestAnimationFrame((time) =>
      this.tick.bind(this)(time)
    );
  }

  public addCallback(callback: Callback): void {
    this.callbacks.push(callback);
  }

  public removeCallback(callback: Callback): void {
    const index = this.callbacks.findIndex((x) => x === callback);

    if (index === -1) {
      console.warn("Callback not found");

      return;
    }

    this.callbacks.splice(index, 1);
  }
}

export { Loop };
export type { Callback, FrameData };
