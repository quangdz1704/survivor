import { createRoot } from "react-dom/client";
import { createGame } from "../src/game/createGame";
import { bridge } from "../src/game/bridge";
import { newProfile, xpRequired } from "../src/core/game";
import type { WeaponId } from "../src/core/game";
import { MAPS } from "../src/core/campaign";
import type { MapId } from "../src/core/campaign";
import type { PetId } from "../src/core/equipment";
import { useUI } from "../src/ui/store";
import { GameHUD } from "../src/ui/components/GameHUD";
import { LevelUp } from "../src/ui/components/Progression";
import { RageControl } from "../src/ui/components/RageControl";
import { Joystick } from "../src/ui/Joystick";
import { audioManager } from "../src/audio/AudioManager";
import "../src/style.css";
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
      {mode === "playing" && (
        <>
          <Joystick />
          <RageControl />
        </>
      )}
      {mode === "levelup" && <LevelUp />}
      {mode === "paused" && (
        <div className="modal-backdrop">
          <button
            className="play-button compact"
            onClick={() => {
              bridge.send("pause", false);
              useUI.getState().setMode("playing");
            }}
          >
            Tiếp tục
          </button>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("qa-ui")!).render(<UI />);
bridge.subscribe((stats) => {
  useUI.getState().setStats(stats);
  document.getElementById("log")!.textContent =
    `Cảnh đặt sẵn · ${stats.map}\nMana ${stats.mana.toFixed(1)} · Rage ${stats.rageRemaining.toFixed(1)}s\nQuái ${stats.enemies} · Hạ ${stats.kills}\nMastery ${JSON.stringify(scene().run?.masteries)}\nObject ${scene().children.list.length}`;
});
bridge.event("choices", useUI.getState().setChoices);
bridge.event("result", useUI.getState().setResult);
const game = createGame(document.getElementById("game")!);
const scene = () => game.scene.getScene("forest") as any;
const value = (id: string) =>
  (document.getElementById(id) as HTMLSelectElement).value;
function setup() {
  audioManager.unlock();
  const profile = newProfile();
  profile.campaign.map = value("map") as MapId;
  profile.hero = value("weapon") === "frost" ? "linh" : "an";
  profile.upgrades.health = 10;
  profile.settings.music = 0;
  const pet = value("pet") as PetId;
  profile.loadout.pet = pet;
  profile.loadout.pets[pet] = 5;
  useUI.getState().setProfile(profile);
  bridge.send("start", profile);
  useUI.getState().setMode("playing");
  const s = scene();
  s.directWaves = () => {};
  s.enemies.forEach((e: any) => e.setActive(false).setVisible(false));
  s.run.hp = 200;
  s.run.mana = 100;
  s.run.rageWeapon = value("weapon") as WeaponId;
  s.run.weapons = { sword: 7, fireball: 6, lightning: 6, frost: 7, leaf: 8 };
  s.run.evolutions = {
    "sword-array": true,
    blizzard: true,
    "leaf-vortex": true,
  };
  for (let i = 0; i < 28; i++) {
    const e = s.spawn(MAPS[profile.campaign.map].enemies[i % 4]);
    if (e) {
      const a = i * 2.39996,
        r = 180 + (i % 5) * 25;
      e.setPosition(1200 + Math.cos(a) * r, 1200 + Math.sin(a) * r);
      e.hp = e.maxHp = 10000;
      e.damage = 0;
      e.speed = 12;
      e.xp = 0;
    }
  }
  s.publish();
}
bridge.whenReady(() => {
  for (const b of document.querySelectorAll<HTMLButtonElement>("aside button"))
    b.disabled = false;
  setup();
});
document.getElementById("setup")!.onclick = setup;
document.getElementById("mana")!.onclick = () => {
  if (scene().run && !scene().run.ended) {
    scene().run.mana = 100;
    scene().publish();
  }
};
document.getElementById("boss")!.onclick = () => {
  const s = scene();
  if (!s.run || s.run.ended) return;
  s.boss = s.spawn(MAPS[s.run.profile.campaign.map as MapId].boss);
  s.boss?.setPosition(1200, 980);
  s.bossCooldown = 1;
  s.publish();
};
document.getElementById("upgrade")!.onclick = () => {
  const s = scene();
  if (!s.run || s.run.ended) return;
  s.run.gainXp(xpRequired(s.run.level));
  bridge.emit("choices", [...s.run.choices]);
  s.syncPause();
  s.publish();
};
document.getElementById("home")!.onclick = () => {
  bridge.send("home", undefined);
  useUI.getState().setMode("menu");
};
