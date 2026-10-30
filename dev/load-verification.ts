import { createGame } from "../src/game/createGame";
import { bridge } from "../src/game/bridge";
import { newProfile } from "../src/core/game";
import {
  DIFFICULTIES,
  MAPS,
  MAP_IDS,
  DIFFICULTY_IDS,
} from "../src/core/campaign";
import type { MapId, DifficultyId } from "../src/core/campaign";
const params = new URLSearchParams(location.search);
const map: MapId = MAP_IDS.includes(params.get("map") as MapId)
  ? (params.get("map") as MapId)
  : "glacier";
const difficulty: DifficultyId = DIFFICULTY_IDS.includes(
  params.get("difficulty") as DifficultyId,
)
  ? (params.get("difficulty") as DifficultyId)
  : "nightmare";
const cap = DIFFICULTIES[difficulty].cap;
document.querySelector("h1")!.textContent = `Kiểm thử tải ${cap} quái`;
const game = createGame(document.getElementById("game")!);
const log = document.getElementById("log")!;
const button = document.getElementById("start")! as HTMLButtonElement;
let running = false,
  frames = 0,
  started = 0,
  elapsed = 0,
  lowest = cap,
  highest = 0;
bridge.whenReady(() => {
  button.disabled = false;
  button.textContent = "Chạy tải 20 giây";
});
button.onclick = () => {
  const profile = newProfile();
  profile.campaign.map = map;
  profile.campaign.difficulty = difficulty;
  profile.loadout.pet = "owl";
  profile.loadout.pets.owl = 5;
  bridge.send("start", profile);
  const scene: any = game.scene.getScene("forest");
  const kinds = MAPS[map].enemies;
  for (let i = 0; i < cap; i++) scene.spawn(kinds[i % 4]);
  const active = scene.enemies.filter((e: any) => e.active);
  if (active.length !== cap || scene.spawn("slime") !== null)
    throw new Error("Enemy cap failed");
  scene.spawn(MAPS[map].boss);
  if (scene.enemies.filter((e: any) => e.active).length !== cap)
    throw new Error("Boss exceeded cap");
  scene.run.weapons = {
    sword: 7,
    fireball: 6,
    lightning: 6,
    frost: 7,
    leaf: 8,
  };
  scene.run.evolutions = {
    "sword-array": true,
    blizzard: true,
    "leaf-vortex": true,
  };
  scene.run.masteries["frost-area"] = 5;
  scene.run.rageWeapon = "leaf";
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
  lowest = cap;
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
  if (scene.run.mana >= 100) bridge.send("rage", undefined);
  frames++;
  elapsed = (performance.now() - started) / 1000;
  bridge.send("move", { x: Math.cos(elapsed), y: Math.sin(elapsed) });
  log.textContent = `Thời gian đo: ${elapsed.toFixed(1)}s\nVùng: ${map} / ${difficulty} · Pet Cú5 · cả5vũ khí/3tiến hóa/rage lá
Số quái: ${n} (min ${lowest}, max ${highest})\nFPS trung bình: ${(frames / elapsed).toFixed(1)}\nKiểm tra giới hạn + boss: ĐẠT\n${elapsed >= 20 ? "HOÀN TẤT · Chỉ phản ánh máy desktop hiện tại." : "Đang đo…"}`;
  if (elapsed >= 20) {
    running = false;
    button.disabled = false;
    bridge.send("pause", true);
  }
});
