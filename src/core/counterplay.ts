export const COUNTERPLAY = {
  damageMultiplier: 1.5,
  golemDuration: 1.8,
  laneDuration: 1.6,
  eliteDuration: 1.35,
  hitRecovery: 0.55,
} as const;

/** Missing a heavy attack exposes the core; tanking it only causes recovery. */
export class CounterWindow {
  remaining = 0;
  exposed = false;
  get multiplier() {
    return this.remaining > 0 && this.exposed
      ? COUNTERPLAY.damageMultiplier
      : 1;
  }
  open(dodged: boolean, duration: number) {
    this.remaining = dodged ? duration : COUNTERPLAY.hitRecovery;
    this.exposed = dodged;
  }
  tick(dt: number) {
    this.remaining = Math.max(0, this.remaining - Math.max(0, dt));
    if (this.remaining <= 0) this.exposed = false;
  }
  reset() {
    this.remaining = 0;
    this.exposed = false;
  }
}
