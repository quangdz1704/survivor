import Phaser from "phaser";
interface Particle {
  image: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}
interface NumberEffect {
  text: Phaser.GameObjects.Text;
  life: number;
}
export class Effects {
  enabled = true;
  private particles: Particle[] = [];
  private numbers: NumberEffect[] = [];
  constructor(private scene: Phaser.Scene) {
    for (let i = 0; i < 130; i++)
      this.particles.push({
        image: scene.add
          .circle(0, 0, 3, 0xffffff)
          .setDepth(5000)
          .setVisible(false),
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
      });
    for (let i = 0; i < 36; i++)
      this.numbers.push({
        text: scene.add
          .text(0, 0, "", {
            fontFamily: "Arial",
            fontSize: "16px",
            fontStyle: "bold",
            color: "#fff5c2",
            stroke: "#204c35",
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(5001)
          .setVisible(false),
        life: 0,
      });
  }
  burst(x: number, y: number, color: number, count = 7) {
    if (!this.enabled) return;
    let made = 0;
    for (const p of this.particles) {
      if (p.life > 0) continue;
      const angle = Math.random() * Math.PI * 2,
        speed = 35 + Math.random() * 85;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.maxLife = p.life = 0.25 + Math.random() * 0.2;
      p.image
        .setPosition(x, y)
        .setFillStyle(color)
        .setAlpha(1)
        .setScale(0.5 + Math.random() * 0.7)
        .setVisible(true);
      if (++made >= count) break;
    }
  }
  number(x: number, y: number, value: number, critical = false) {
    if (!this.enabled) return;
    const n = this.numbers.find((n) => n.life <= 0);
    if (!n) return;
    n.life = 0.6;
    n.text
      .setText(critical ? `${value}!` : `${value}`)
      .setColor(critical ? "#ffd573" : "#fff5c2")
      .setFontSize(critical ? 20 : 16)
      .setPosition(x, y - 20)
      .setAlpha(1)
      .setVisible(true);
  }
  ring(x: number, y: number, radius: number, color: number, duration = 300) {
    if (!this.enabled) return;
    const ring = this.scene.add
      .circle(x, y, radius * 0.5)
      .setStrokeStyle(2, color, 0.7)
      .setDepth(y + 50);
    this.scene.tweens.add({
      targets: ring,
      scale: 2,
      alpha: 0,
      duration,
      onComplete: () => ring.destroy(),
    });
  }
  update(dt: number) {
    for (const p of this.particles)
      if (p.life > 0) {
        p.life -= dt;
        p.image.x += p.vx * dt;
        p.image.y += p.vy * dt;
        p.image.alpha = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) p.image.setVisible(false);
      }
    for (const n of this.numbers)
      if (n.life > 0) {
        n.life -= dt;
        n.text.y -= 35 * dt;
        n.text.alpha = Math.min(1, n.life * 3);
        if (n.life <= 0) n.text.setVisible(false);
      }
  }
  clear() {
    for (const p of this.particles) {
      p.life = 0;
      p.image.setVisible(false);
    }
    for (const n of this.numbers) {
      n.life = 0;
      n.text.setVisible(false);
    }
  }
}
