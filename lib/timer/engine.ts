export class TimerEngine {
  private startTime: number | null = null;
  private elapsedBeforePause = 0;
  private rafId: number | null = null;
  private onTick: (elapsed: number) => void;

  constructor(onTick: (elapsed: number) => void) {
    this.onTick = onTick;
  }

  private loop = (): void => {
    this.onTick(this.getElapsed());
    this.rafId = requestAnimationFrame(this.loop);
  };

  private cancelRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  start(): void {
    this.elapsedBeforePause = 0;
    this.startTime = performance.now();
    this.cancelRaf();
    this.rafId = requestAnimationFrame(this.loop);
  }

  split(): number {
    return this.getElapsed();
  }

  pause(): number {
    const elapsed = this.getElapsed();
    this.elapsedBeforePause = elapsed;
    this.startTime = null;
    this.cancelRaf();
    return elapsed;
  }

  resume(): void {
    if (this.startTime !== null) return;
    this.startTime = performance.now();
    this.cancelRaf();
    this.rafId = requestAnimationFrame(this.loop);
  }

  reset(): void {
    this.cancelRaf();
    this.startTime = null;
    this.elapsedBeforePause = 0;
  }

  getElapsed(): number {
    if (this.startTime === null) {
      return this.elapsedBeforePause;
    }
    return this.elapsedBeforePause + (performance.now() - this.startTime);
  }

  setElapsed(elapsed: number): void {
    this.elapsedBeforePause = elapsed;
    if (this.startTime !== null) {
      // Reanchor so the timer continues forward from `elapsed`
      this.startTime = performance.now();
    }
  }
}
