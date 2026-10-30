import { createRoot } from "react-dom/client";
import { createGame } from "../src/game/createGame";
import { bridge } from "../src/game/bridge";
import {
  EVOLUTIONS,
  EVOLUTION_IDS,
  UPGRADE_NAMES,
  WEAPONS,
  newProfile,
  xpRequired,
} from "../src/core/game";
import type { EvolutionId } from "../src/core/game";
import { useUI } from "../src/ui/store";
import { GameHUD } from "../src/ui/components/GameHUD";
import { LevelUp } from "../src/ui/components/Progression";
import { Joystick } from "../src/ui/Joystick";
import { audioManager } from "../src/audio/AudioManager";
import "../src/style.css";
const log = document.getElementById("log")!,
  verification = document.getElementById("verify-log")!;
let enabled = true,
  ready = false,
  selected: EvolutionId = "sword-array";
let sawSlow = false,
  sawReturn = false;
function UI() {
  const mode = useUI((s) => s.mode);
  return (
    <>
      <GameHUD
        pause={() => {
          bridge.send("pause", true);
          useUI.getState().setMode("paused");
        }}
      />
      {mode === "playing" && <Joystick />}
      {mode === "levelup" && <LevelUp />}
      {mode === "paused" && (
        <div className="modal-backdrop">
          <section className="modal">
            <h2>Đang tạm dừng</h2>
            <button
              className="play-button compact"
              onClick={() => {
                bridge.send("pause", false);
                useUI.getState().setMode("playing");
              }}
            >
              Tiếp tục
            </button>
          </section>
        </div>
      )}
      {mode === "ended" && (
        <div className="modal-backdrop">
          <section className="modal">
            <h2>Đã kết thúc cảnh thử</h2>
            <button
              className="play-button compact"
              onClick={() => setup(selected)}
            >
              Thử lại
            </button>
          </section>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("qa-ui")!).render(<UI />);
bridge.subscribe((snapshot) => {
  useUI.getState().setStats(snapshot);
  const s = scene();
  sawSlow ||= s.enemies.some((e: any) => e.living && e.chill.remaining > 0);
  sawReturn ||= s.combat.projectiles.some(
    (p: any) => p.active && p.evolved && p.flight.returning,
  );
  log.textContent = `Đã tiến hóa: ${
    EVOLUTION_IDS.filter((id) => snapshot.evolutions[id])
      .map((id) => UPGRADE_NAMES[id])
      .join(", ") || "chưa chọn"
  }\nHP ${snapshot.hp}/${snapshot.maxHp} · Hạ ${snapshot.kills}\nĐã thấy làm chậm: ${sawSlow}\nĐã thấy lá xoáy trở về: ${sawReturn}`;
});
bridge.event("choices", useUI.getState().setChoices);
bridge.event("result", useUI.getState().setResult);
const game = createGame(document.getElementById("game")!);
const scene = () => game.scene.getScene("forest") as any;
function setup(id: EvolutionId) {
  if (!ready) return;
  selected = id;
  sawSlow = sawReturn = false;
  audioManager.unlock();
  const profile = newProfile();
  profile.hero = id === "blizzard" ? "linh" : "an";
  profile.upgrades.health = 10;
  profile.settings = { ...profile.settings, music: 0, effects: enabled };
  useUI.getState().setProfile(profile);
  bridge.send("start", profile);
  const s = scene(),
    recipe = EVOLUTIONS[id];
  for (const weapon of WEAPONS) s.run.weapons[weapon] = 0;
  s.run.weapons[recipe.weapon] = 6;
  s.run.ranks[recipe.passive] = 2;
  for (const enemy of s.enemies) enemy.setActive(false).setVisible(false);
  for (let i = 0; i < 9; i++) {
    const e = s.spawn(i % 3 ? "skeleton" : "orc");
    const angle = (i / 9) * Math.PI * 2;
    e.setPosition(1200 + Math.cos(angle) * 190, 1200 + Math.sin(angle) * 190);
    e.hp = e.maxHp = 1200;
    e.xp = 0;
  }
  s.spawnClock = -1000;
  s.run.gainXp(xpRequired(s.run.level));
  bridge.emit("choices", [...s.run.choices]);
  s.syncPause();
  s.publish();
  return s;
}
bridge.whenReady(() => {
  ready = true;
  document
    .querySelectorAll<HTMLButtonElement>("aside button")
    .forEach((button) => (button.disabled = false));
  setup("sword-array");
});
for (const id of EVOLUTION_IDS)
  document.getElementById(id)!.onclick = () => setup(id);
document.getElementById("all")!.onclick = () => {
  const s = setup("sword-array");
  for (const id of EVOLUTION_IDS) {
    const r = EVOLUTIONS[id];
    s.run.weapons[r.weapon] = 6;
    s.run.ranks[r.passive] = 2;
  }
  for (let i = 0; i < EVOLUTION_IDS.length; i++) {
    if (!s.run.pending) s.run.gainXp(xpRequired(s.run.level));
    const offered = s.run.choices.find((choice: any) => choice.evolution);
    if (offered) bridge.send("choose", offered.id);
  }
};
document.getElementById("quality")!.onclick = (event) => {
  enabled = !enabled;
  bridge.send("quality", enabled);
  (event.target as HTMLElement).textContent =
    `Giảm hiệu ứng: ${enabled ? "TẮT" : "BẬT"}`;
};
document.getElementById("verify")!.onclick = () => {
  const checks: string[] = [];
  const check = (ok: boolean, label: string) => {
    checks.push(`${ok ? "ĐẠT" : "LỖI"} · ${label}`);
    verification.textContent =
      `${checks.length} kiểm tra · ${ok ? "ĐẠT" : "LỖI"}\n` + checks.join("\n");
    if (!ok) throw new Error(label);
  };
  for (const id of EVOLUTION_IDS) {
    const s = setup(id);
    s.scene.pause();
    check(
      s.run.choices.some((c: any) => c.id === id),
      `${UPGRADE_NAMES[id]} có thẻ tiến hóa hợp lệ`,
    );
    bridge.send("choose", id);
    for (let i = 0; i < 114; i++) s.update(0, 1000 / 60);
    check(
      s.run.evolutions[id] && s.combat.attacks > 0,
      `${UPGRADE_NAMES[id]} đã chọn và đánh được`,
    );
    if (id === "blizzard")
      check(
        s.enemies.some((e: any) => e.chill.remaining > 0),
        "Bão tuyết làm chậm qua hitEnemy thật",
      );
    if (id === "leaf-vortex")
      check(
        s.combat.projectiles.some((p: any) => p.evolved && p.flight.returning),
        "Lá xoáy chuyển sang pha trở về",
      );
    const time = s.run.time,
      phase = s.combat.evolved.time,
      snowAge = s.combat.evolved.blizzard.age;
    bridge.send("pause", true);
    s.update(0, 200);
    check(
      s.run.time === time &&
        s.combat.evolved.time === phase &&
        s.combat.evolved.blizzard.age === snowAge,
      `${UPGRADE_NAMES[id]} dừng khi pause`,
    );
    bridge.send("pause", false);
    const count = s.children.list.length;
    for (let i = 0; i < 200; i++) s.update(0, 1000 / 60);
    check(
      s.children.list.length === count,
      `${UPGRADE_NAMES[id]} tái dùng pool`,
    );
    if (id === "blizzard") {
      s.finish(false);
      check(
        !s.combat.evolved.blizzard.ground.visible &&
          !s.combat.evolved.blizzard.snow.visible,
        "Bão tuyết dọn cả hai lớp khi kết thúc lượt",
      );
    }
    bridge.send("home", undefined);
    check(
      s.combat.evolved.swords.every((sword: any) => !sword.visible) &&
        !s.combat.evolved.aura.visible &&
        !s.combat.evolved.blizzard.ground.visible &&
        !s.combat.evolved.blizzard.snow.visible &&
        s.combat.projectiles.every((p: any) => !p.active),
      `${UPGRADE_NAMES[id]} xóa khi về trại`,
    );
    bridge.send("start", newProfile());
    check(
      EVOLUTION_IDS.every((e) => !s.run.evolutions[e]),
      "Lượt mới không giữ tiến hóa",
    );
    s.scene.resume();
  }
  setup(selected);
  verification.textContent =
    `HOÀN TẤT · ${checks.length}/${checks.length} ĐẠT\n` + checks.join("\n");
};
