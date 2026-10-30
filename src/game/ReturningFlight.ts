/** One pooled leaf flight: straight outward, then home toward the moving caster. */
export class ReturningFlight {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  age = 0;
  speed = 0;
  returning = false;
  done = true;
  private angle = 0;
  private spiral = false;
  launch(x: number, y: number, angle: number, speed: number, spiral = false) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.angle = angle;
    this.spiral = spiral;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.age = 0;
    this.returning = false;
    this.done = false;
  }
  step(dt: number, casterX: number, casterY: number) {
    if (this.done) return;
    let remaining = Math.max(0, dt);
    const duration = this.spiral ? 0.7 : 0.48;
    const outward = Math.min(remaining, Math.max(0, duration - this.age));
    if (this.spiral) {
      const nextAngle = this.angle + 2.8 * outward;
      this.x +=
        (this.speed / 2.8) * (Math.sin(nextAngle) - Math.sin(this.angle));
      this.y -=
        (this.speed / 2.8) * (Math.cos(nextAngle) - Math.cos(this.angle));
      this.angle = nextAngle;
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    } else {
      this.x += this.vx * outward;
      this.y += this.vy * outward;
    }
    this.age += outward;
    remaining -= outward;
    if (this.age >= duration - 1e-9) this.returning = true;
    if (!this.returning || remaining <= 0) return;
    const dx = casterX - this.x,
      dy = casterY - this.y,
      d = Math.hypot(dx, dy);
    if (d <= this.speed * remaining + 8) {
      this.x = casterX;
      this.y = casterY;
      this.done = true;
      return;
    }
    this.vx = (dx / d) * this.speed;
    this.vy = (dy / d) * this.speed;
    this.x += this.vx * remaining;
    this.y += this.vy * remaining;
    this.age += remaining;
    if (this.age >= 2.2) this.done = true;
  }
}
