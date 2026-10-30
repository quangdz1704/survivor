import Phaser from "phaser";
import { seededRandom } from "./rules";
export function drawForestMap(scene: Phaser.Scene) {
  const trees: Phaser.GameObjects.Image[] = [];
  const r = seededRandom(73191);
  scene.add.rectangle(1200, 1200, 2400, 2400, 0x629c64);
  const g = scene.add.graphics();
  for (let i = 0; i < 850; i++) {
    g.fillStyle([0x85af6d, 0x4b8c5b, 0x73a369][Math.floor(r() * 3)], 0.24);
    g.fillEllipse(r() * 2400, r() * 2400, 25 + r() * 110, 10 + r() * 45);
  }
  // Gently winding continuous paths; the central clearing remains readable.
  const path = new Phaser.Curves.Path(0, 1360);
  path.splineTo([
    new Phaser.Math.Vector2(500, 1300),
    new Phaser.Math.Vector2(1000, 1235),
    new Phaser.Math.Vector2(1300, 1185),
    new Phaser.Math.Vector2(1700, 1280),
    new Phaser.Math.Vector2(2400, 1050),
  ]);
  g.lineStyle(92, 0x536f43, 0.2);
  path.draw(g, 110);
  g.lineStyle(77, 0xb3a87a, 0.72);
  path.draw(g, 110);
  g.lineStyle(57, 0xc0b187, 0.37);
  path.draw(g, 110);
  const branch = new Phaser.Curves.Path(1220, 1200);
  branch.splineTo([
    new Phaser.Math.Vector2(1150, 950),
    new Phaser.Math.Vector2(1370, 650),
    new Phaser.Math.Vector2(1250, 0),
  ]);
  g.lineStyle(55, 0xb6ac81, 0.66);
  branch.draw(g, 80);
  for (let i = 0; i < 3600; i++) {
    const x = r() * 2400,
      y = r() * 2400;
    g.lineStyle(1, i % 3 ? 0x39764d : 0xb2c67a, 0.3);
    g.beginPath();
    g.moveTo(x - 3, y);
    g.lineTo(x, y - 4 - r() * 4);
    g.lineTo(x + 2, y);
    g.strokePath();
  }
  for (let i = 0; i < 470; i++) {
    const x = r() * 2400,
      y = r() * 2400;
    if (Math.abs(y - 1235) < 40) continue;
    g.fillStyle(i % 3 ? 0xffefb7 : 0xeab2a2, 0.8);
    g.fillCircle(x, y, 1.8);
    g.fillStyle(0xe6c56e);
    g.fillCircle(x + 1, y + 1, 1);
  }
  for (let i = 0; i < 100; i++) {
    const x = r() * 2400,
      y = r() * 2400;
    g.fillStyle(0x3c664b, 0.3);
    g.fillEllipse(x + 3, y + 5, 15, 7);
    g.fillStyle(0x9aa892, 1);
    g.fillRoundedRect(x - 6, y - 3, 12 + r() * 9, 8, 4);
    g.lineStyle(1, 0xc4c6a5, 0.8);
    g.lineBetween(x - 3, y - 2, x + 3, y - 2);
  }
  // Bake thousands of static drawing commands once. Small tiles keep the GPU
  // texture size bounded and let the renderer cull terrain outside the camera.
  const ground = document.createElement("canvas");
  ground.width = ground.height = 2400;
  g.generateTexture(ground, 2400, 2400);
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 2; column++) {
      const key = `forest-ground-${row}-${column}`;
      if (!scene.textures.exists(key)) {
        const tile = document.createElement("canvas");
        tile.width = tile.height = 1200;
        tile
          .getContext("2d")!
          .drawImage(
            ground,
            column * 1200,
            row * 1200,
            1200,
            1200,
            0,
            0,
            1200,
            1200,
          );
        scene.textures.addCanvas(key, tile);
      }
      scene.add.image(column * 1200, row * 1200, key).setOrigin(0);
    }
  }
  g.destroy();
  for (let i = 0; i < 170; i++) {
    const x = r() * 2400,
      y = r() * 2400;
    if (
      Math.hypot(x - 1200, y - 1200) < 180 ||
      Math.abs(y - (1260 - (x - 1000) * 0.12)) < 95
    )
      continue;
    const s = 115 + r() * 85;
    trees.push(
      scene.add
        .image(x, y, "atlas", 3)
        .setDisplaySize(s, s)
        .setOrigin(0.5, 0.86)
        .setDepth(y + 10),
    );
  }
  for (let i = 0; i < 130; i++) {
    const x = r() * 2400,
      y = r() * 2400;
    if (Math.hypot(x - 1200, y - 1200) < 100) continue;
    const s = 38 + r() * 37;
    scene.add
      .image(x, y, "atlas", 5)
      .setDisplaySize(s, s)
      .setOrigin(0.5, 0.8)
      .setDepth(y);
  }
  // Hand-composed landmarks frame the starting clearing.
  scene.add
    .image(1323, 1034, "atlas", 4)
    .setDisplaySize(145, 145)
    .setOrigin(0.5, 0.88)
    .setDepth(1034);
  trees.push(
    scene.add
      .image(1028, 1280, "atlas", 3)
      .setDisplaySize(185, 185)
      .setOrigin(0.5, 0.88)
      .setDepth(1280),
  );
  trees.push(
    scene.add
      .image(1370, 1310, "atlas", 3)
      .setDisplaySize(168, 168)
      .setOrigin(0.5, 0.88)
      .setDepth(1310),
  );
  scene.add.image(1095, 1055, "atlas", 5).setDisplaySize(76, 76).setDepth(1055);
  const stone = scene.add.graphics().setDepth(1);
  stone.lineStyle(2, 0xc8cca0, 0.2);
  stone.strokeEllipse(1200, 1208, 110, 53);
  stone.lineStyle(1, 0xd9d6a3, 0.17);
  stone.strokeEllipse(1200, 1208, 133, 65);
  for (let i = 0; i < 26; i++) {
    const dot = scene.add
      .circle(940 + r() * 520, 820 + r() * 830, 1 + r() * 1.2, 0xffe8a0, 0.6)
      .setDepth(3000);

    scene.tweens.add({
      targets: dot,
      alpha: 0.12,
      y: dot.y - 22,
      duration: 1700 + r() * 2700,
      yoyo: true,
      repeat: -1,
      delay: r() * 3000,
    });
  }
  return trees;
}
