import { createRoot } from "react-dom/client";
import { createGame } from "../src/game/createGame";
import { bridge } from "../src/game/bridge";
import { newProfile, WEAPONS } from "../src/core/game";
import { ELITES } from "../src/core/encounters";
import type { EliteId } from "../src/core/encounters";
import { RELICS } from "../src/core/relics";
import { useUI } from "../src/ui/store";
import { GameHUD } from "../src/ui/components/GameHUD";
import { LevelUp } from "../src/ui/components/Progression";
import { Treasure, RelicInventory } from "../src/ui/components/Treasure";
import { Joystick } from "../src/ui/Joystick";
import "../src/style.css";

let ready = false,
  selected: EliteId = "slime-king",
  effects = true;
const game = createGame(document.getElementById("game")!);
const scene = () => game.scene.getScene("forest") as any;
const log = document.getElementById("log")!,
  results = document.getElementById("verify-log")!;
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
      {mode === "treasure" && <Treasure />}
      {mode === "paused" && (
        <div className="modal-backdrop">
          <section className="modal">
            <h2>Đang tạm dừng</h2>
            <RelicInventory />
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
    </>
  );
}
createRoot(document.getElementById("qa-ui")!).render(<UI />);
bridge.subscribe((snapshot) => {
  useUI.getState().setStats(snapshot);
  log.textContent = `Thủ lĩnh: ${snapshot.elites.map((e) => `${ELITES[e.id].name} ${e.hp}/${e.maxHp}`).join(", ") || "đã hạ"}\nRương còn trên bản đồ: ${snapshot.chests.length}\nBảo vật: ${snapshot.relics.map((id) => RELICS[id].name).join(", ") || "chưa nhận"}\nHP: ${snapshot.hp}/${snapshot.maxHp}`;
});
bridge.event("choices", useUI.getState().setChoices);
bridge.event("treasure", useUI.getState().setRelicChoices);
bridge.event("result", useUI.getState().setResult);
function setup(id: EliteId) {
  if (!ready) return;
  selected = id;
  const profile = newProfile();
  profile.upgrades.health = 10;
  profile.settings = { ...profile.settings, music: 0, sound: 0, effects };
  bridge.send("start", profile);
  const s = scene();
  for (const enemy of s.enemies) enemy.setActive(false).setVisible(false);
  for (const weapon of WEAPONS) s.run.weapons[weapon] = 0;
  s.spawnClock = -9999;
  s.run.time = ELITES[id].time;
  s.run.elites["slime-king"] = s.run.elites["orc-captain"] = "claimed";
  const enemy = s.spawn(ELITES[id].kind);
  enemy.setPosition(1200, 1070);
  enemy.makeElite(id);
  enemy.xp = 0;
  s.run.elites[id] = "active";
  s.encounters.register(id, enemy);
  s.publish();
  useUI.getState().setMode("playing");
  return { s, enemy };
}
function open() {
  const { s, enemy } = setup(selected)!;
  s.run.weapons.frost = s.run.weapons.leaf = 1;
  s.hitEnemy(enemy, 100000, 0, -1, "sword");
  s.player.setPosition(enemy.x, enemy.y);
  s.update(0, 16.67);
  return s;
}
function verify() {
  const checks: string[] = [];
  const check = (name: string, okay: boolean) => {
    if (!okay) throw new Error(name);
    checks.push(`ĐẠT · ${name}`);
  };
  try {
    for (const id of ["slime-king", "orc-captain"] as const) {
      const { s, enemy } = setup(id)!;
      check(
        `${id}: HP/scale/radius`,
        enemy.hp === ELITES[id].hp &&
          enemy.radius > (id === "slime-king" ? 17 : 25),
      );
      const time = s.run.time;
      bridge.send("pause", true);
      for (let i = 0; i < 20; i++) s.update(0, 100);
      check(`${id}: pause`, s.run.time === time && enemy.charging === 0);
      bridge.send("pause", false);
      s.hitEnemy(enemy, 100000, 0, 1, "sword");
      check(
        `${id}: chest without ending run`,
        s.encounters.chests().length === 1 && !s.run.ended,
      );
      s.player.setPosition(enemy.x, enemy.y);
      s.update(0, 16.67);
      check(
        `${id}: opens 3-card treasure`,
        s.run.relicChoices.length === 3 && s.run.pending,
      );
      const pauseTime = s.run.time;
      s.update(0, 250);
      check(`${id}: treasure pauses simulation`, s.run.time === pauseTime);
      const choice = s.run.relicChoices[0];
      bridge.send("relic", choice);
      bridge.send("relic", choice);
      check(
        `${id}: one relic only`,
        s.run.relics.length === 1 && !s.run.pending,
      );
      bridge.send("home", undefined);
      check(
        `${id}: home cleanup`,
        s.encounters.chests().length === 0 &&
          s.encounters.snapshot().length === 0,
      );
    }
    const { s } = setup("slime-king")!;
    for (const e of s.enemies) e.setActive(false).setVisible(false);
    s.encounters.reset();
    const target = s.spawn("skeleton");
    target.setPosition(1260, 1200);
    target.hp = target.maxHp = 2000;
    s.random = () => 0.99;
    s.run.relics = ["rime"];
    s.hitEnemy(target, 100, 1, 0, "sword");
    const before = target.hp;
    target.chill.apply(2, 0.3);
    s.hitEnemy(target, 100, 1, 0, "sword");
    check(
      "Rime uses actual chilled-target hit path",
      before - target.hp === 125,
    );
    target.chill.clear();
    target.makeElite("orc-captain");
    s.run.relics = ["fang"];
    const leaderHp = target.hp;
    s.hitEnemy(target, 100, 1, 0, "sword");
    check("Fang boosts actual elite damage", leaderHp - target.hp === 140);
    target.activate(1260, 1200, 50);
    s.run.relics = ["heart"];
    s.grid.rebuild([target]);
    const health = target.hp;
    s.pickups.spawn(1200, 1200, 8, "heal");
    s.update(0, 16.67);
    check("Heart pickup emits real area damage", target.hp === health - 30);
    s.run.relics = ["root", "rage"];
    s.motion.reset();
    s.move = { x: 0, y: 0 };
    for (let i = 0; i < 70; i++) s.update(0, 16.67);
    check(
      "Root activates from actual stationary movement",
      s.run.stats.damage === 13.5,
    );
    s.run.hp = 100;
    check("Rage activates at 40 percent HP", s.run.stats.attackSpeed === 1.3);
    const fresh = setup("slime-king")!.s;
    check("New run clears relics", fresh.run.relics.length === 0);
    for (let i = 0; i < 160; i++) fresh.spawn("slime");
    const full = fresh.enemies.filter((e: any) => e.active).length;
    const priority = fresh.spawn("golem");
    check(
      "150-actor budget preserves elite and boss",
      full === 150 &&
        fresh.enemies.filter((e: any) => e.active).length === 150 &&
        !!priority &&
        fresh.enemies.some((e: any) => e.living && e.elite === "slime-king"),
    );
    setup("slime-king");
    const objectCount = s.children.list.length;
    for (let i = 0; i < 20; i++) {
      open();
      bridge.send("relic", scene().run.relicChoices[0]);
    }
    check(
      "20 chest cycles reuse scene objects",
      s.children.list.length === objectCount,
    );
    results.textContent = `HOÀN TẤT · ${checks.length}/${checks.length} ĐẠT\n${checks.join("\n")}`;
    open();
  } catch (error) {
    results.textContent = `LỖI · ${String(error)}\n${checks.join("\n")}`;
  }
}
for (const id of ["slime-king", "orc-captain"] as const)
  document.getElementById(id)!.onclick = () => setup(id);
document.getElementById("chest")!.onclick = open;
document.getElementById("verify")!.onclick = verify;
document.getElementById("quality")!.onclick = () => {
  effects = !effects;
  bridge.send("quality", effects);
  document.getElementById("quality")!.textContent =
    `Giảm hiệu ứng: ${effects ? "TẮT" : "BẬT"}`;
};
bridge.whenReady(() => {
  ready = true;
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "aside button",
  ))
    button.disabled = false;
  setup("slime-king");
});
