export interface Positioned {
  x: number;
  y: number;
  active: boolean;
}
/** Rebuilt once per simulation tick; queries reuse caller-owned result arrays. */
export class SpatialGrid<T extends Positioned> {
  private cells = new Map<number, T[]>();
  private used: number[] = [];
  constructor(
    private size = 100,
    private accepts: (item: T) => boolean = (item) => item.active,
  ) {}
  private key(x: number, y: number) {
    return Math.floor(x / this.size) + Math.floor(y / this.size) * 64;
  }
  rebuild(items: Iterable<T>) {
    for (const key of this.used) this.cells.get(key)!.length = 0;
    this.used.length = 0;
    for (const item of items) {
      if (!this.accepts(item)) continue;
      const key = this.key(item.x, item.y);
      let cell = this.cells.get(key);
      if (!cell) {
        cell = [];
        this.cells.set(key, cell);
      }
      if (!cell.length) this.used.push(key);
      cell.push(item);
    }
  }
  query(x: number, y: number, radius: number, out: T[]) {
    out.length = 0;
    const radiusSq = radius * radius;
    for (
      let cy = Math.floor((y - radius) / this.size);
      cy <= Math.floor((y + radius) / this.size);
      cy++
    )
      for (
        let cx = Math.floor((x - radius) / this.size);
        cx <= Math.floor((x + radius) / this.size);
        cx++
      ) {
        const cell = this.cells.get(cx + cy * 64);
        if (cell)
          for (const item of cell)
            if (
              this.accepts(item) &&
              (item.x - x) ** 2 + (item.y - y) ** 2 <= radiusSq
            )
              out.push(item);
      }
    return out;
  }
}
