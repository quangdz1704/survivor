/** Refreshes a slow without multiplying it on repeated hits. */
export class SlowEffect {
  remaining = 0;
  private amount = 0;
  get multiplier() {
    return this.remaining > 0 ? 1 - this.amount : 1;
  }
  apply(duration: number, amount: number, boss = false) {
    this.remaining = Math.max(this.remaining, duration * (boss ? 0.7 : 1));
    this.amount = Math.max(
      this.amount,
      Math.min(0.65, Math.max(0, amount)) * (boss ? 0.5 : 1),
    );
  }
  step(dt: number) {
    this.remaining = Math.max(0, this.remaining - Math.max(0, dt));
    if (!this.remaining) this.amount = 0;
  }
  clear() {
    this.remaining = this.amount = 0;
  }
}
