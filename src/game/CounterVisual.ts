import type Phaser from "phaser";
import type { EnemyActor } from "./EnemyActor";

/** Three bounded markers cover both mini-bosses and the final boss. */
export class CounterVisual {
  private ground: Phaser.GameObjects.Graphics;
  private cores: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[];
  constructor(scene: Phaser.Scene) {
    this.ground = scene.add.graphics().setDepth(2);
    this.cores = scene.add.graphics().setDepth(4500);
    this.labels = Array.from({ length: 3 }, () =>
      scene.add
        .text(0, 0, "", {
          fontFamily: "Arial",
          fontSize: "12px",
          fontStyle: "bold",
          color: "#fff0a8",
          stroke: "#29332c",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(4501)
        .setVisible(false),
    );
  }
  reset() {
    this.ground.clear();
    this.cores.clear();
    for (const label of this.labels) label.setVisible(false);
  }
  update(enemies: readonly EnemyActor[], time: number, effects: boolean) {
    this.reset();
    let index = 0;
    for (const enemy of enemies) {
      if (
        !enemy.living ||
        enemy.counter.multiplier <= 1 ||
        index >= this.labels.length
      )
        continue;
      const x = enemy.x,
        y = enemy.y - 22,
        pulse = effects ? 0.65 + Math.sin(time * 10) * 0.18 : 0.7;
      this.ground
        .lineStyle(3, 0xffdf86, pulse)
        .strokeEllipse(x, enemy.y + 14, enemy.radius * 2.3, 35);
      this.cores
        .fillStyle(0xffc75b, 0.2)
        .fillCircle(x, y, 22)
        .fillStyle(0xffdc7c)
        .fillTriangle(x, y - 13, x - 9, y, x, y + 13)
        .fillStyle(0xfff7cf)
        .fillTriangle(x, y - 13, x + 9, y, x, y + 13)
        .lineStyle(2, 0xffffff, 0.8)
        .lineBetween(x - 18, y, x - 26, y)
        .lineBetween(x + 18, y, x + 26, y);
      this.labels[index++]
        .setVisible(true)
        .setPosition(x, enemy.y - (enemy.elite ? 100 : 120))
        .setText(`LỘ LÕI ×1.5 · ${enemy.counter.remaining.toFixed(1)}s`);
    }
  }
}
