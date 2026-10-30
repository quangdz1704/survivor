import { PLAYER_SPEED, normalizeMovement } from "./rules";

/** Exact integration of exponential velocity smoothing, independent of frame rate. */
export function integrateVelocity(
  current: number,
  target: number,
  dt: number,
  response: number,
) {
  const decay = Math.exp(-response * dt);
  return {
    velocity: target + (current - target) * decay,
    distance: target * dt + ((current - target) * (1 - decay)) / response,
  };
}

export class PlayerMotion {
  vx = 0;
  vy = 0;
  reset() {
    this.vx = 0;
    this.vy = 0;
  }
  step(x: number, y: number, dt: number, speed = PLAYER_SPEED) {
    const input = normalizeMovement(x, y);
    const response = Math.hypot(input.x, input.y) > 0.01 ? 24 : 34;
    const horizontal = integrateVelocity(
      this.vx,
      input.x * speed,
      dt,
      response,
    );
    const vertical = integrateVelocity(this.vy, input.y * speed, dt, response);
    this.vx = horizontal.velocity;
    this.vy = vertical.velocity;
    return {
      dx: horizontal.distance,
      dy: vertical.distance,
      vx: this.vx,
      vy: this.vy,
    };
  }
}
