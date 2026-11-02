import { it, expect, vi } from "vitest";
import type Phaser from "phaser";
import { EquipmentDrops } from "./EquipmentDrops";
import type { Effects } from "./Effects";
import { RunModel, newProfile, settleResult } from "../core/game";
function fixture() {
  const nodes: { visible: boolean; x: number; y: number }[] = [];
  const node = () => {
    const data = { visible: false, x: 0, y: 0 };
    const proxy = new Proxy(data, {
      get: (o, key) =>
        key in o
          ? o[key as keyof typeof data]
          : (...args: unknown[]) => {
              if (key === "setVisible") o.visible = args[0] as boolean;
              if (key === "setPosition") {
                o.x = args[0] as number;
                o.y = args[1] as number;
              }
              if (key === "setY") o.y = args[0] as number;
              return proxy;
            },
    });
    nodes.push(proxy);
    return proxy;
  };
  const graphics: unknown = new Proxy({}, { get: () => () => graphics });
  const scene = {
    make: { graphics: () => graphics },
    add: { image: node, text: node },
  } as unknown as Phaser.Scene;
  const drops = new EquipmentDrops(scene, {
    ring: vi.fn(),
  } as unknown as Effects);
  return { drops, nodes, run: new RunModel(newProfile(), () => 0.5, "bags") };
}
it("keeps bags reachable at every world edge and collects each one once into the saved reward", () => {
  const { drops, nodes, run } = fixture();
  drops.spawn("cinderwand", 2431, 2500);
  expect(nodes[0].x).toBe(2365);
  expect(nodes[0].y).toBe(2365);
  drops.update(0.1, 2365, 2365, run);
  drops.update(0.1, 2365, 2365, run);
  expect(run.collectedGear).toEqual(["cinderwand"]);
  drops.spawn("barkhood", -30, -30);
  expect(nodes[0].x).toBe(35);
  expect(nodes[0].y).toBe(40);
  drops.update(0.1, 35, 40, run);
  expect(run.collectedGear).toEqual(["cinderwand", "barkhood"]);
  const result = run.finish(false)!,
    saved = settleResult(newProfile(), result);
  expect(saved.loadout.inventory.cinderwand).toBe(1);
  expect(saved.loadout.inventory.barkhood).toBe(1);
  expect(settleResult(saved, result)).toBe(saved);
});
it("does not collect bags while choosing a level and resets the fixed visual pool", () => {
  const { drops, nodes, run } = fixture();
  drops.spawn("cinderwand", 100, 100);
  run.gainXp(20);
  drops.update(0.1, 100, 100, run);
  expect(run.collectedGear).toEqual([]);
  run.select(run.choices[0].id);
  drops.update(0.1, 100, 100, run);
  expect(run.collectedGear).toEqual(["cinderwand"]);
  for (let i = 0; i < 20; i++) {
    drops.reset();
    drops.spawn("barkhood", 200, 200);
  }
  expect(nodes).toHaveLength(4);
  drops.reset();
  expect(nodes.every((n) => !n.visible)).toBe(true);
});
