import { createGame } from "../src/game/createGame";
import { bridge } from "../src/game/bridge";
import { newProfile } from "../src/core/game";
const game = createGame(document.getElementById("game")!);
const log = document.getElementById("log")!;
const button = document.getElementById("start")! as HTMLButtonElement;
let running = false,
  frames = 0,
  started = 0,
  elapsed = 0,
  lowest = 150,
  highest = 0;
bridge.whenReady(() => {
  button.disabled = false;
  button.textContent = "Chạy tải 20 giây";
});
button.onclick = () => {
  bridge.send("start", newProfile());
  const scene: any = game.scene.getScene("forest");
  const kinds = ["slime", "bat", "skeleton", "orc"];
  for (let i = 0; i < 150; i++) scene.spawn(kinds[i % 4]);
  const active = scene.enemies.filter((e: any) => e.active);
  if (active.length !== 150 || scene.spawn("slime") !== null)
    throw new Error("Enemy cap failed");
  scene.spawn("golem");
  if (scene.enemies.filter((e: any) => e.active).length !== 150)
    throw new Error("Boss exceeded cap");
  scene.enemies
    .filter((e: any) => e.active)
    .forEach((e: any, i: number) => {
      const angle = i * 2.39996,
        radius = 70 + (i % 9) * 19;
      e.setPosition(
        scene.player.x + Math.cos(angle) * radius,
        scene.player.y + Math.sin(angle) * radius,
      );
      e.hp = e.maxHp = 1e9;
    });
  scene.invincible = 1e9;
  frames = 0;
  started = performance.now();
  elapsed = 0;
  lowest = 150;
  highest = 0;
  running = true;
  button.disabled = true;
};
game.events.on("poststep", () => {
  if (!running) return;
  const scene: any = game.scene.getScene("forest");
  const n = scene.enemies.filter((e: any) => e.living).length;
  lowest = Math.min(lowest, n);
  highest = Math.max(highest, n);
  frames++;
  elapsed = (performance.now() - started) / 1000;
  bridge.send("move", { x: Math.cos(elapsed), y: Math.sin(elapsed) });
  log.textContent = `Thời gian đo: ${elapsed.toFixed(1)}s\nSố quái: ${n} (min ${lowest}, max ${highest})\nFPS trung bình: ${(frames / elapsed).toFixed(1)}\nKiểm tra giới hạn + boss: ĐẠT\n${elapsed >= 20 ? "HOÀN TẤT · Chỉ phản ánh máy desktop hiện tại." : "Đang đo…"}`;
  if (elapsed >= 20) {
    running = false;
    button.disabled = false;
    bridge.send("pause", true);
  }
});
