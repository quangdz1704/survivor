import { createGame } from "../src/game/createGame";
import { bridge } from "../src/game/bridge";
import { newProfile } from "../src/core/game";
import { GOLEM_BLAST_RADIUS } from "../src/game/GolemBlast";
import { audioManager } from "../src/audio/AudioManager";
const game = createGame(document.getElementById("game")!);
const log = document.getElementById("log")!;
let ready = false,
  enabled = true;
const scene = () => game.scene.getScene("forest") as any;
function setup() {
  if (!ready) return;
  audioManager.unlock();
  const profile = newProfile();
  profile.settings = { ...profile.settings, music: 0, effects: enabled };
  bridge.send("start", profile);
  const s = scene();
  for (const e of s.enemies) e.setActive(false).setVisible(false);
  for (const id of Object.keys(s.run.weapons)) s.run.weapons[id] = 0;
  s.spawnClock = -10000;
  s.boss = s.spawn("golem");
  s.boss.setPosition(1100, 1100);
  s.bossCooldown = 0;
  s.updateBoss(0);
  log.textContent = `Vùng sát thương: ${GOLEM_BLAST_RADIUS}px · Báo trước: 1 giây · Sát thương: 25\nHiệu ứng: ${enabled ? "đầy đủ" : "giảm"}`;
  return s;
}
function advance(seconds: number) {
  const s = scene();
  for (let remaining = seconds; remaining > 0.000001;) {
    const dt = Math.min(remaining, 1 / 60);
    s.update(0, dt * 1000);
    remaining -= dt;
  }
}
function pose(seconds: number) {
  const s = setup();
  if (!s) return;
  s.scene.pause();
  advance(seconds);
}
bridge.whenReady(() => {
  ready = true;
  pose(0.65);
});
document.getElementById("play")!.onclick = () => setup()?.scene.resume();
document.getElementById("pause")!.onclick = () => {
  const s = scene();
  if (s.scene.isPaused()) s.scene.resume();
  else s.scene.pause();
};
document.getElementById("warning")!.onclick = () => pose(0.8);
document.getElementById("impact")!.onclick = () => pose(1.09);
document.getElementById("smoke")!.onclick = () => pose(1.55);
document.getElementById("quality")!.onclick = (event) => {
  enabled = !enabled;
  bridge.send("quality", enabled);
  (event.target as HTMLElement).textContent =
    `Giảm hiệu ứng: ${enabled ? "TẮT" : "BẬT"}`;
  pose(1.09);
};
document.getElementById("verify")!.onclick = () => {
  const checks: string[] = [];
  const check = (ok: boolean, label: string) => {
    checks.push(`${ok ? "ĐẠT" : "LỖI"} · ${label}`);
    if (!ok) throw new Error(label);
  };
  let s = setup();
  s.scene.pause();
  advance(1.1);
  check(
    s.run.hp === 75 && s.stomp === null,
    "Trong vùng: đúng 25 sát thương, kết thúc cảnh báo",
  );
  advance(1.3);
  check(
    s.effects.blast.age >= 1.15 && !s.effects.blast.cloud.visible,
    "Vụ nổ tự thu hồi sau 1,15s",
  );
  s = setup();
  s.scene.pause();
  s.player.x += GOLEM_BLAST_RADIUS + 5;
  advance(1.1);
  check(s.run.hp === 100, "Ngoài vùng: không trúng đòn");
  s = setup();
  s.scene.pause();
  bridge.send("pause", true);
  const remaining = s.stomp.remaining;
  advance(0.5);
  check(
    s.stomp.remaining === remaining && s.run.time === 0,
    "Tạm dừng: cảnh báo và đồng hồ đứng yên",
  );
  bridge.send("pause", false);
  advance(1.1);
  const age = s.effects.blast.age;
  bridge.send("pause", true);
  advance(0.5);
  check(s.effects.blast.age === age, "Tạm dừng: vụ nổ đứng yên");
  bridge.send("pause", false);
  s.finish(false);
  advance(1.3);
  check(!s.effects.blast.cloud.visible, "Kết thúc ván: khói vẫn tan hết");
  const count = s.children.length;
  for (let i = 0; i < 30; i++) s.effects.golemBlast(1200, 1200);
  check(
    s.children.length === count,
    "30 vụ nổ liên tiếp: không thêm game object",
  );
  bridge.send("home", undefined);
  check(
    !s.effects.blast.cloud.visible && !s.effects.blast.ground.visible,
    "Về trại: xóa sạch vụ nổ",
  );
  enabled = false;
  s = setup();
  s.scene.pause();
  advance(1.1);
  check(
    s.run.hp === 75 && s.stomp === null,
    "Giảm hiệu ứng: giữ nguyên sát thương/thời điểm",
  );
  enabled = true;
  pose(1.09);
  log.textContent = checks.join("\n");
};
