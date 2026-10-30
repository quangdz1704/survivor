import { describe, expect, it } from "vitest";
import { SpatialGrid } from "./SpatialGrid";
describe("spatial collision index", () => {
  it("excludes corpses immediately even when they die after the index rebuild", () => {
    const enemy = { x: 20, y: 20, active: true, living: true };
    const grid = new SpatialGrid<typeof enemy>(100, (item) => item.living);
    grid.rebuild([enemy]);
    expect(grid.query(0, 0, 100, [])).toEqual([enemy]);
    enemy.living = false;
    expect(grid.query(0, 0, 100, [])).toEqual([]);
    grid.rebuild([enemy]);
    expect(grid.query(0, 0, 100, [])).toEqual([]);
  });
  it("returns the same nearby living candidates as a full scan across cell edges", () => {
    const items = Array.from({ length: 150 }, (_, i) => ({
      x: (i * 173) % 2400,
      y: (i * 347) % 2400,
      active: i % 5 !== 0,
    }));
    const grid = new SpatialGrid<(typeof items)[number]>();
    grid.rebuild(items);
    for (const [x, y, radius] of [
      [0, 0, 90],
      [100, 100, 145],
      [1200, 1200, 330],
      [2390, 2390, 100],
    ]) {
      const actual = grid.query(x, y, radius, []);
      const expected = items.filter(
        (i) => i.active && (i.x - x) ** 2 + (i.y - y) ** 2 <= radius ** 2,
      );
      expect(new Set(actual)).toEqual(new Set(expected));
    }
    items.forEach((i) => (i.active = false));
    grid.rebuild(items);
    expect(grid.query(100, 100, 500, [])).toEqual([]);
  });
});
