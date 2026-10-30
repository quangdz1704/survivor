import { createGame } from "../src/game/createGame";
import { bridge } from "../src/game/bridge";
import { newProfile, settleResult } from "../src/core/game";
import { ProfileRepository } from "../src/core/profile";
const game = createGame(document.getElementById("game")!);
const log = document.getElementById("log")!;
let testing = false,
  mode = "victory",
  seen = new Set<string>(),
  maxEnemies = 0,
  pauses = 0,
  latest: any = null,
  results: any[] = [],
  slowClockPassed = false,
  pauseChecked = false;
const report = (extra = "") => {
  log.textContent = `Đồng hồ ở 15 FPS: ${slowClockPassed ? "ĐẠT" : "CHƯA CHẠY"}\nChế độ: ${mode}\nThời gian: ${latest?.time.toFixed(1) ?? 0}s\nHP: ${latest?.hp ?? 0} · Cấp: ${latest?.level ?? 1}\nQuái đã hạ: ${latest?.kills ?? 0}\nĐồng thời tối đa: ${maxEnemies}\nLoại quái đã gặp: ${[...seen].join(", ")}\nLần chọn nâng cấp: ${pauses}\n${extra}\nKết quả: ${JSON.stringify(results, null, 2)}`;
};
bridge.subscribe((snapshot) => {
  latest = snapshot;
  if (testing) report();
});
bridge.event("choices", (choices) => {
  if (!testing || !choices.length) return;
  pauses++;
  const scene: any = game.scene.getScene("forest");
  const before = scene.run.time;
  setTimeout(() => {
    if (!testing) return;
    if (scene.run.time !== before)
      throw new Error("Level-up did not pause clock");
    const run = scene.run;
    const order = [
      "fireball",
      "lightning",
      "sword",
      "fireball",
      "lightning",
      "damage",
      "haste",
      "health",
      "magnet",
      "speed",
    ];
    const choice =
      choices.find((c) => c.current === 0 && c.weapon) ??
      (run.hp < run.stats.maxHp * 0.4
        ? choices.find((c) => c.id === "health")
        : null) ??
      choices
        .slice()
        .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))[0];
    bridge.send("choose", choice.id);
  }, 50);
});
bridge.event("result", async (result) => {
  if (!testing) return;
  results.push(result);
  testing = false;
  report("Đang kiểm tra phần thưởng/lưu lại…");
  const repo = new ProfileRepository(indexedDB, "survivor-mini-verification");
  const before = await repo.load();
  const saved = await repo.update((p) => settleResult(p, result));
  const duplicated = await repo.update((p) => settleResult(p, result));
  if (
    duplicated.gold !== saved.gold ||
    saved.totalRuns !== before.totalRuns + 1
  )
    throw new Error("Duplicate reward");
  repo.close();
  const reload = new ProfileRepository(indexedDB, "survivor-mini-verification");
  if ((await reload.load()).gold !== saved.gold)
    throw new Error("Reload lost save");
  reload.close();
  report("Lưu lại và chống nhận thưởng trùng: ĐẠT");
  if (mode === "victory") {
    mode = "defeat";
    setTimeout(() => {
      testing = true;
      bridge.send("start", newProfile());
    }, 250);
  } else report("HOÀN TẤT · Hai kết quả đã đi qua cùng engine.");
});
bridge.whenReady(() => {
  log.textContent = "Sẵn sàng. Bấm Chạy kiểm thử.";
});
document.getElementById("start")!.onclick = () => {
  seen = new Set();
  maxEnemies = 0;
  pauses = 0;
  results = [];
  pauseChecked = false;
  mode = "victory";
  testing = false;
  bridge.send("start", newProfile());
  const clockScene: any = game.scene.getScene("forest");
  const initialX = clockScene.player.x;
  bridge.send("move", { x: 1, y: 0 });
  for (let i = 0; i < 15; i++) clockScene.update(0, 1000 / 15);
  slowClockPassed =
    Math.abs(clockScene.run.time - 1) < 0.001 &&
    Math.abs(clockScene.spawnClock - 1) < 0.001 &&
    clockScene.player.x - initialX > 150;
  if (!slowClockPassed) throw new Error("Match clock slows at 15 FPS");
  const p = newProfile();
  p.settings = {
    ...p.settings,
    effects: false,
    music: 0,
    sound: 0,
    vibration: false,
  };
  bridge.send("start", p);
  testing = true;
};
function drive(scene: any) {
  const run = scene.run,
    player = scene.player;
  if (!run || run.ended || run.pending) return;
  if (mode === "defeat") {
    bridge.send("move", { x: 0, y: 0 });
    return;
  }
  if (!pauseChecked && run.time > 10) {
    pauseChecked = true;
    const time = run.time;
    bridge.send("pause", true);
    setTimeout(() => {
      if (run.time !== time) throw new Error("Manual pause clock drift");
      bridge.send("pause", false);
    }, 90);
    return;
  }
  const enemies = scene.enemies.filter((e: any) => e.living);
  enemies.forEach((e: any) => seen.add(e.kind));
  maxEnemies = Math.max(maxEnemies, enemies.length);
  let tx = 1200 + Math.cos(run.time * 0.33) * 240,
    ty = 1200 + Math.sin(run.time * 0.33) * 240;
  const orbs = scene.pickups.items
    .filter((p: any) => p.active)
    .sort(
      (a: any, b: any) =>
        Math.hypot(a.x - player.x, a.y - player.y) -
        Math.hypot(b.x - player.x, b.y - player.y),
    );
  if (orbs[0] && Math.hypot(orbs[0].x - player.x, orbs[0].y - player.y) < 320) {
    tx = orbs[0].x;
    ty = orbs[0].y;
  }
  let vx = tx - player.x,
    vy = ty - player.y;
  const len = Math.hypot(vx, vy) || 1;
  vx /= len;
  vy /= len;
  for (const e of enemies) {
    const dx = player.x - e.x,
      dy = player.y - e.y,
      d = Math.hypot(dx, dy);
    if (d < 125 + e.radius) {
      const strength = ((125 + e.radius - d) / (125 + e.radius)) * 3.8;
      vx += (dx / (d || 1)) * strength;
      vy += (dy / (d || 1)) * strength;
    }
  }
  if (scene.stomp) {
    const s = scene.stomp,
      dx = player.x - s.x,
      dy = player.y - s.y,
      d = Math.hypot(dx, dy);
    if (d < 125) {
      if (d < 5) {
        vx += 2;
        vy -= 2;
      } else {
        vx += (dx / d) * 4;
        vy += (dy / d) * 4;
      }
    }
  }
  if (player.x < 170) vx += 3;
  if (player.x > 2230) vx -= 3;
  if (player.y < 170) vy += 3;
  if (player.y > 2230) vy -= 3;
  const n = Math.hypot(vx, vy) || 1;
  bridge.send("move", { x: vx / n, y: vy / n });
}
game.events.on("poststep", () => {
  if (!testing) return;
  const scene: any = game.scene.getScene("forest");
  for (let i = 0; i < 24; i++) {
    if (!testing || !scene.run || scene.run.ended) break;
    drive(scene);
    scene.update(0, 1000 / 60);
    scene.cameras.main.preRender();
  }
  if (scene.run?.time > 480) {
    testing = false;
    report("HẾT GIỚI HẠN 480 GIÂY: cần xem cân bằng.");
  }
});
