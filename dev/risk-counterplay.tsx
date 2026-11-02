import { createRoot } from "react-dom/client";
import { createGame } from "../src/game/createGame";
import { bridge } from "../src/game/bridge";
import { newProfile, settleResult } from "../src/core/game";
import type { EnemyKind } from "../src/core/game";
import { ProfileRepository } from "../src/core/profile";
import { ELITES } from "../src/core/encounters";
import type { EliteId } from "../src/core/encounters";
import { useUI } from "../src/ui/store";
import { GameHUD } from "../src/ui/components/GameHUD";
import {
  RiskEventChoice,
  RiskEventStatus,
} from "../src/ui/components/RiskEvent";
import { LevelUp } from "../src/ui/components/Progression";
import { Treasure } from "../src/ui/components/Treasure";
import { Joystick } from "../src/ui/Joystick";
import "../src/style.css";

const repository = new ProfileRepository(indexedDB, "survivor-mini-risk-qa");
let fast = false,
  freeze = true,
  report = "",
  scenario = "trial";
const log = document.getElementById("log")!;
function UI() {
  const mode = useUI((s) => s.mode);
  return (
    <>
      <RiskEventStatus />
      <GameHUD
        pause={() => {
          bridge.send("pause", true);
          useUI.getState().setMode("paused");
        }}
      />
      {mode === "playing" && (
        <>
          <Joystick />
        </>
      )}
      {mode === "trial" && <RiskEventChoice />}
      {mode === "levelup" && <LevelUp />}
      {mode === "treasure" && <Treasure />}
      {mode === "paused" && (
        <button
          style={{ position: "absolute", bottom: 110, left: 40, zIndex: 10 }}
          className="secondary-button"
          onClick={resume}
        >
          Tiếp tục QA
        </button>
      )}
    </>
  );
}
createRoot(document.getElementById("qa-ui")!).render(<UI />);
bridge.event("choices", useUI.getState().setChoices);
bridge.event("treasure", useUI.getState().setRelicChoices);
bridge.event("trial", useUI.getState().setTrialOpen);
bridge.event("result", (result) => {
  useUI.getState().setResult(result);
  void repository
    .update((p) => settleResult(p, result))
    .then(async (saved) => {
      const twice = await repository.update((p) => settleResult(p, result));
      report = `Đã lưu QA: ${JSON.stringify(result.collectedGear)}\nKho: ${JSON.stringify(saved.loadout.inventory)}\nChống nhận trùng: ${twice.totalRuns === saved.totalRuns}`;
      log.textContent = report;
    });
});
const game = createGame(document.getElementById("game")!);
const scene = () => game.scene.getScene("forest") as any;
let waves: (dt: number) => void;
function base() {
  const profile = newProfile();
  profile.settings.music = 0;
  profile.loadout.pet = null;
  bridge.send("start", profile);
  useUI.getState().setProfile(profile);
  useUI.getState().setMode("playing");
  const s = scene();
  s.enemies.forEach((e: any) => e.setActive(false).setVisible(false));
  s.run.hp = 10000;
  s.run.weapons.sword = 0;
  s.run.elites = { "slime-king": "claimed", "orc-captain": "claimed" };
  s.directWaves = () => {};
  report = "";
  fast = false;
  document.getElementById("fast")!.textContent = "Tốc độ ×8: TẮT";
  return s;
}
function trial() {
  scenario = "trial";
  const s = base();
  s.run.time = 89.99;
  s.run.weapons.sword = 4;
  s.directWaves = waves;
  s.publish();
}
function boss(kind: EnemyKind) {
  scenario = kind;
  const s = base();
  s.boss = s.spawn(kind);
  s.boss.setPosition(1200, 1040);
  s.bossPattern = kind === "golem" ? 0 : 2;
  s.bossCooldown = 1;
  s.publish();
}
function elite(id: EliteId) {
  scenario = id;
  const s = base(),
    e = s.spawn(ELITES[id].kind);
  e.makeElite(id);
  e.setPosition(1200, 1050);
  s.run.elites[id] = "active";
  s.encounters.register(id, e);
  s.publish();
}
function resume() {
  bridge.send("pause", false);
  useUI.getState().setMode("playing");
}
bridge.subscribe((stats) => {
  const s = scene();
  const exposed = s.enemies.find(
    (e: any) => e.living && e.counter.multiplier > 1,
  );
  if (freeze && exposed && !s.manualPaused) {
    bridge.send("pause", true);
    useUI.getState().setMode("paused");
  }
  log.textContent = `${scenario} · HP QA10000 · ${fast ? "×8" : "thời gian thật"}\nT=${stats.time.toFixed(2)} · mode=${useUI.getState().mode}\nTrial ${JSON.stringify(stats.trial)}\nĐồ nhặt ${JSON.stringify(s.run?.collectedGear)}\nLõi ${exposed ? `${exposed.kind} ×${exposed.counter.multiplier} ${exposed.counter.remaining.toFixed(2)}s` : "đóng"}\nQuái ${stats.enemies} · Objects ${s.children.list.length}\n${report}`;
});
bridge.whenReady(() => {
  waves = scene().directWaves.bind(scene());
  for (const b of document.querySelectorAll<HTMLButtonElement>(
    "body > aside button",
  ))
    b.disabled = false;
  trial();
});
game.events.on("poststep", () => {
  if (fast && scene().activeRun)
    for (let i = 0; i < 7; i++) scene().update(0, 1000 / 60);
});
document.getElementById("trial")!.onclick = trial;
for (const kind of ["golem", "ember-drake", "frost-warden"] as EnemyKind[])
  document.getElementById(kind)!.onclick = () => boss(kind);
for (const id of ["slime-king", "orc-captain"] as EliteId[])
  document.getElementById(id)!.onclick = () => elite(id);
document.getElementById("fast")!.onclick = () => {
  fast = !fast;
  document.getElementById("fast")!.textContent =
    `Tốc độ ×8: ${fast ? "BẬT" : "TẮT"}`;
};
document.getElementById("freeze")!.onclick = () => {
  freeze = !freeze;
  document.getElementById("freeze")!.textContent =
    `Dừng khi lộ lõi: ${freeze ? "BẬT" : "TẮT"}`;
};
document.getElementById("resume")!.onclick = resume;
document.getElementById("settle")!.onclick = () => scene().finish(false);
