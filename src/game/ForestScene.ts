import Phaser from "phaser";
import { PlayerActor } from "./PlayerActor";
import { PlayerMotion } from "./PlayerMotion";
import { EnemyActor } from "./EnemyActor";
import { CombatSystem } from "./CombatSystem";
import { Pickups } from "./Pickups";
import { Effects } from "./Effects";
import { GOLEM_BLAST_RADIUS } from "./GolemBlast";
import { EliteEncounters } from "./EliteEncounters";
import { ELITES } from "../core/encounters";
import { relicHitMultiplier } from "../core/relics";
import type { RelicId } from "../core/relics";
import { SpatialGrid } from "./SpatialGrid";
import { CampaignWorld } from "./CampaignWorld";
import { HostileAttacks } from "./HostileAttacks";
import { RageCombat } from "./RageCombat";
import { PetActor, preloadPets } from "./PetActor";
import { DIFFICULTIES, MAPS, isBoss } from "../core/campaign";
import { renderScale } from "./renderQuality";
import { bridge } from "./bridge";
import { WORLD_SIZE, normalizeMovement, seededRandom } from "./rules";
import {
  MATCH_DURATION,
  ENEMIES,
  RunModel,
  rolledDamage,
  waveAt,
  xpRequired,
  isEvolution,
} from "../core/game";
import type {
  EnemyKind,
  Profile,
  Settings,
  UpgradeId,
  WeaponId,
} from "../core/game";
import { audioManager } from "../audio/AudioManager";

interface Stomp {
  x: number;
  y: number;
  remaining: number;
  circle: Phaser.GameObjects.Arc;
}
export class ForestScene extends Phaser.Scene {
  private player!: PlayerActor;
  private motion = new PlayerMotion();
  private shadow!: Phaser.GameObjects.Ellipse;
  private aura!: Phaser.GameObjects.Arc;
  private effects!: Effects;
  private combat!: CombatSystem;
  private world!: CampaignWorld;
  private hostile!: HostileAttacks;
  private rage!: RageCombat;
  private pet!: PetActor;
  private bossPattern = 0;
  private encounters!: EliteEncounters;
  private relicTargets: EnemyActor[] = [];
  private pickups!: Pickups;
  private grid = new SpatialGrid<EnemyActor>(100, (enemy) => enemy.living);
  private enemies: EnemyActor[] = [];
  private trees: Phaser.GameObjects.Image[] = [];
  private run: RunModel | null = null;
  private activeRun = false;
  private manualPaused = false;
  private move = { x: 0, y: 0 };
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private removers: (() => void)[] = [];
  private random = seededRandom(4128);
  private spawnClock = 0;
  private hudClock = 0;
  private invincible = 0;
  private boss: EnemyActor | null = null;
  private bossDelay = 0;
  private bossCooldown = 3;
  private stomp: Stomp | null = null;
  private effectsEnabled = true;
  constructor() {
    super("forest");
  }
  preload() {
    PlayerActor.preload(this);
    EnemyActor.preload(this);
    preloadPets(this);
    for (const id of ["ashlands", "glacier"])
      this.load.image(`ground-${id}`, `/assets/expansion/${id}.webp`);
    this.load.spritesheet("atlas", "/assets/forest-atlas.webp", {
      frameWidth: 512,
      frameHeight: 512,
    });
  }
  create() {
    this.world = new CampaignWorld(this);
    this.trees = this.world.trees;
    this.effects = new Effects(this);
    this.combat = new CombatSystem(this, this.effects);
    this.hostile = new HostileAttacks(this);
    this.rage = new RageCombat(this, this.effects);
    this.pet = new PetActor(this, this.effects);
    this.encounters = new EliteEncounters(this, this.effects);
    this.pickups = new Pickups(this, this.effects);
    this.shadow = this.add
      .ellipse(1200, 1226, 35, 13, 0x13382b, 0.28)
      .setDepth(1199)
      .setVisible(false);
    this.aura = this.add
      .circle(1200, 1220, 27, 0xd6ffd7, 0.04)
      .setStrokeStyle(1, 0xe6ffb2, 0.28)
      .setDepth(1199)
      .setVisible(false);
    this.player = new PlayerActor(this, 1200, 1200).setDepth(1200).setAlpha(0);
    this.cameras.main
      .setZoom(renderScale())
      .setBounds(0, 0, WORLD_SIZE, WORLD_SIZE)
      .startFollow(this.player, true, 0.09, 0.09);
    this.keys = this.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);
    this.removers = [
      bridge.on("start", (profile) => this.begin(profile)),
      bridge.on("pause", (pause) => {
        this.manualPaused = pause;
        this.motion.reset();
        this.move = { x: 0, y: 0 };
        this.syncPause();
      }),
      bridge.on("home", () => this.home()),
      bridge.on("move", (move) => {
        this.move = normalizeMovement(move.x, move.y);
      }),
      bridge.on("choose", (id) => this.choose(id)),
      bridge.on("relic", (id) => this.chooseRelic(id)),
      bridge.on("rage", () => this.activateRage()),
      bridge.on("rageWeapon", (id) => {
        this.run?.selectRage(id);
        this.publish();
      }),
      bridge.on("quality", (value) => {
        this.effectsEnabled = value;
        this.effects.enabled = value;
      }),
      bridge.on("settings", (settings) => this.configure(settings)),
    ];
    this.events.once("shutdown", () => this.removers.forEach((fn) => fn()));
    bridge.ready();
  }
  private configure(settings: Settings) {
    this.effectsEnabled = settings.effects;
    this.effects.enabled = settings.effects;
    audioManager.configure(settings);
  }
  private syncPause() {
    if (this.manualPaused || this.run?.pending) {
      this.tweens.pauseAll();
      audioManager.setScene("paused");
    } else {
      this.tweens.resumeAll();
      audioManager.setScene(this.activeRun ? "game" : "menu");
    }
  }
  private begin(profile: Profile) {
    this.clearRun();
    this.run = new RunModel(profile, this.random);
    this.world.show(profile.campaign.map);
    this.bossPattern = 0;
    this.activeRun = true;
    this.manualPaused = false;
    this.configure(profile.settings);
    this.spawnClock = 0;
    this.hudClock = 0;
    this.invincible = 0;
    this.bossDelay = 0;
    this.bossCooldown = 3;
    this.motion.reset();
    this.move = { x: 0, y: 0 };
    this.player.useHero(profile.hero);
    this.player.setPosition(1200, 1200).setVisible(true).setAlpha(1);
    this.shadow.setVisible(true);
    this.aura.setVisible(true);
    this.cameras.main
      .startFollow(this.player, true, 0.09, 0.09)
      .centerOn(1200, 1200);
    this.cameras.main.preRender();
    for (let i = 0; i < 4; i++)
      this.spawn(MAPS[profile.campaign.map].enemies[0], i);
    this.syncPause();
    this.publish();
  }
  private clearRun() {
    bridge.emit("choices", []);
    bridge.emit("treasure", []);
    this.tweens.resumeAll();
    for (const enemy of this.enemies) enemy.setActive(false).setVisible(false);
    this.combat.reset();
    this.hostile.reset();
    this.rage.reset();
    this.pet.reset();
    this.encounters.reset();
    this.pickups.clear();
    this.effects.clear();
    this.tweens.killTweensOf(this.player);
    this.stomp?.circle.destroy();
    this.stomp = null;
    this.boss = null;
    this.motion.reset();
  }
  private home() {
    this.clearRun();
    this.world.show("forest");
    this.activeRun = false;
    this.run = null;
    this.move = { x: 0, y: 0 };
    this.manualPaused = false;
    this.player.setPosition(1200, 1200).setAlpha(0);
    this.shadow.setVisible(false);
    this.aura.setVisible(false);
    this.trees.forEach((tree) => tree.setAlpha(1));
    audioManager.setScene("menu");
  }
  private choose(id: UpgradeId) {
    if (!this.activeRun || !this.run?.select(id)) return;
    this.motion.reset();
    this.move = { x: 0, y: 0 };
    this.effects.ring(this.player.x, this.player.y, 65, 0xffde8d, 500);
    if (isEvolution(id)) {
      this.effects.burst(this.player.x, this.player.y, 0xffdb87, 24);
      this.effects.ring(this.player.x, this.player.y, 100, 0xffdb87, 700);
      audioManager.play("evolution");
    }
    bridge.emit("choices", [...this.run.choices]);
    bridge.emit("treasure", [...this.run.relicChoices]);
    this.syncPause();
    this.publish();
  }
  private chooseRelic(id: RelicId) {
    const run = this.run;
    if (!this.activeRun || !run?.selectRelic(id)) return;
    this.motion.reset();
    this.move = { x: 0, y: 0 };
    this.effects.burst(this.player.x, this.player.y, 0xffda8b, 20);
    this.effects.ring(this.player.x, this.player.y, 95, 0xffdf99, 650);
    if (id === "heart") {
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        this.pickups.spawn(
          this.player.x + Math.cos(angle) * 80,
          this.player.y + Math.sin(angle) * 80,
          8,
          "heal",
        );
      }
    }
    audioManager.play("treasure");
    bridge.emit("choices", [...run.choices]);
    bridge.emit("treasure", [...run.relicChoices]);
    this.syncPause();
    this.publish();
  }
  private spawn(kind: EnemyKind, sideIndex?: number, priority = false) {
    const active = this.enemies.filter((e) => e.active);
    if (
      active.length >= DIFFICULTIES[this.run!.profile.campaign.difficulty].cap
    ) {
      if (!isBoss(kind) && !priority) return null;
      // Make room for the boss within the total entity budget.
      const farthest = active
        .filter((e) => !isBoss(e.kind) && !e.elite)
        .sort(
          (a, b) =>
            Math.hypot(b.x - this.player.x, b.y - this.player.y) -
            Math.hypot(a.x - this.player.x, a.y - this.player.y),
        )[0];
      if (!farthest) return null;
      farthest.setActive(false).setVisible(false);
    }
    const view = this.cameras.main.worldView,
      side = sideIndex ?? Math.floor(this.random() * 4);
    let x = 0,
      y = 0;
    const t = 0.1 + this.random() * 0.8;
    if (side < 2) {
      x = side === 0 ? view.left - 65 : view.right + 65;
      y = view.top + view.height * t;
    } else {
      x = view.left + view.width * t;
      y = side === 2 ? view.top - 65 : view.bottom + 65;
    }
    x = Phaser.Math.Clamp(x, 24, WORLD_SIZE - 24);
    y = Phaser.Math.Clamp(y, 24, WORLD_SIZE - 24);
    if (view.contains(x, y)) {
      // At world edges choose a valid point along the outside of another camera edge.
      const candidates = [
        { x: view.left - 65, y: this.player.y },
        { x: view.right + 65, y: this.player.y },
        { x: this.player.x, y: view.top - 65 },
        { x: this.player.x, y: view.bottom + 65 },
      ];
      const valid = candidates.find(
        (p) =>
          p.x > 20 &&
          p.x < WORLD_SIZE - 20 &&
          p.y > 20 &&
          p.y < WORLD_SIZE - 20 &&
          !view.contains(p.x, p.y),
      );
      if (!valid) return null;
      x = valid.x;
      y = valid.y;
    }
    let enemy = this.enemies.find((e) => !e.active && e.kind === kind);
    if (!enemy) {
      const replace = this.enemies.findIndex((e) => !e.active);
      enemy = new EnemyActor(this, kind);
      if (replace >= 0) {
        this.enemies[replace].destroy();
        this.enemies[replace] = enemy;
      } else this.enemies.push(enemy);
    }
    const wave = waveAt(this.run?.time ?? 0);
    enemy.activate(
      x,
      y,
      (isBoss(kind) ? 1 : wave.hpScale) *
        DIFFICULTIES[this.run!.profile.campaign.difficulty].hp *
        (this.run!.profile.campaign.map === "forest"
          ? 1
          : this.run!.profile.campaign.map === "ashlands"
            ? 1.15
            : 1.3),
      (isBoss(kind) ? 1 : wave.speedScale) *
        DIFFICULTIES[this.run!.profile.campaign.difficulty].speed,
    );
    enemy.damage *= DIFFICULTIES[this.run!.profile.campaign.difficulty].damage;
    return enemy;
  }
  private activateRage() {
    if (!this.activeRun || this.manualPaused || !this.run?.activateRage())
      return;
    this.invincible = Math.max(this.invincible, 0.3);
    this.effects.ring(this.player.x, this.player.y, 180, 0xffdc87, 500);
    audioManager.play("evolution");
    this.publish();
  }
  update(_time: number, delta: number) {
    // Consume elapsed play time in small collision-safe slices. This keeps XP,
    // spawn/attack cadence and the match clock aligned on slower displays.
    const elapsed = Math.min(Math.max(delta, 0), 250) / 1000;
    this.cameras.main.setLerp(1 - Math.exp(-9 * elapsed));
    // Let the last impact settle behind the result panel; pause/level-up still
    // stop active-run effects alongside combat and the match clock.
    if (!this.activeRun) {
      this.effects.update(elapsed);
      return;
    }
    let remaining = elapsed;
    while (remaining > 0.000001) {
      const dt = Math.min(remaining, 1 / 30);
      this.simulate(dt);
      remaining -= dt;
    }
  }
  private simulate(dt: number) {
    const run = this.run;
    if (
      !this.activeRun ||
      !run ||
      this.manualPaused ||
      run.pending ||
      run.ended
    )
      return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.activateRage();
    run.tick(dt, false);
    this.invincible = Math.max(0, this.invincible - dt);
    let x = this.move.x,
      y = this.move.y;
    if (this.keys.A.isDown || this.keys.LEFT.isDown) x -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) x += 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) y -= 1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) y += 1;
    const movement = this.motion.step(x, y, dt, run.stats.movementSpeed);
    const beforeX = this.player.x,
      beforeY = this.player.y;
    this.player.x = Phaser.Math.Clamp(
      this.player.x + movement.dx,
      35,
      WORLD_SIZE - 35,
    );
    this.player.y = Phaser.Math.Clamp(
      this.player.y + movement.dy,
      40,
      WORLD_SIZE - 35,
    );
    const footfall = this.player.animate(
      this.player.x - beforeX,
      this.player.y - beforeY,
      dt,
    );
    run.trackMovement(
      dt,
      Math.hypot(this.player.x - beforeX, this.player.y - beforeY),
    );
    this.player
      .setDepth(this.player.y)
      .setAlpha(
        this.invincible > 0 ? 0.84 + Math.sin(run.time * 32) * 0.13 : 1,
      );
    if (footfall && this.effectsEnabled)
      this.effects.burst(this.player.x, this.player.y + 27, 0xe9dfaf, 2);
    this.shadow
      .setPosition(this.player.x, this.player.y + 28)
      .setDepth(this.player.y - 1);
    this.aura
      .setPosition(this.player.x, this.player.y + 22)
      .setDepth(this.player.y - 2);
    for (const tree of run.profile.campaign.map === "forest"
      ? this.trees
      : []) {
      const near =
        Math.abs(tree.x - this.player.x) < tree.displayWidth * 0.5 + 20 &&
        this.player.y > tree.y - tree.displayHeight * 0.9 - 25 &&
        this.player.y < tree.y + 45;
      tree.alpha = near ? 0.24 : 1;
    }
    this.directWaves(dt);
    this.encounters.update(dt, this.player.x, this.player.y, (damage) => {
      if (this.invincible > 0 || run.ended) return;
      this.hurtPlayer(
        damage * DIFFICULTIES[run.profile.campaign.difficulty].damage,
      );
      if (run.hp <= 0) this.finish(false);
    });
    if (run.ended) return;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (!enemy.living) {
        enemy.animate(dt, 0, 0);
        continue;
      }
      const dx = this.player.x - enemy.x,
        dy = this.player.y - enemy.y,
        d = Math.hypot(dx, dy) || 1;
      enemy.attackClock -= dt;
      const sprint =
        (enemy.kind === "frost-wolf" || enemy.kind === "ember-beetle") &&
        Math.sin(run.time * 1.7 + enemy.id) > 0.8
          ? 1.7
          : 1;
      if (
        (enemy.kind === "ash-imp" || enemy.kind === "ice-wisp") &&
        enemy.attackClock <= 0 &&
        d < 520
      ) {
        enemy.attackClock = enemy.kind === "ash-imp" ? 3.3 : 4;
        const angle = Math.atan2(dy, dx);
        this.hostile.zone(
          enemy.x,
          enemy.y,
          20,
          0,
          enemy.kind === "ice-wisp",
          0.65,
        );
        this.hostile.fan(
          enemy.x,
          enemy.y,
          angle,
          enemy.kind === "ice-wisp" ? 3 : 1,
          0.5,
          ENEMIES[enemy.kind].damage * 0.8,
          enemy.kind === "ice-wisp",
          130,
        );
      }
      const speed =
        enemy.charging > 0
          ? 0
          : enemy.speed *
            sprint *
            enemy.movementMultiplier() *
            (isBoss(enemy.kind) && enemy.hp < enemy.maxHp * 0.35 ? 1.25 : 1);
      const stepX =
          (dx / d) * speed * dt + (enemy.charging > 0 ? 0 : enemy.knockX * dt),
        stepY =
          (dy / d) * speed * dt + (enemy.charging > 0 ? 0 : enemy.knockY * dt);
      enemy.knockX *= Math.exp(-16 * dt);
      enemy.knockY *= Math.exp(-16 * dt);
      enemy.x = Phaser.Math.Clamp(enemy.x + stepX, 15, WORLD_SIZE - 15);
      enemy.y = Phaser.Math.Clamp(enemy.y + stepY, 15, WORLD_SIZE - 15);
      const view = this.cameras.main.worldView;
      enemy.animate(
        dt,
        Math.hypot(stepX, stepY),
        dx / d,
        enemy.x > view.left - 120 &&
          enemy.x < view.right + 120 &&
          enemy.y > view.top - 160 &&
          enemy.y < view.bottom + 160,
      );
      if (d < enemy.radius + 13 && this.invincible === 0) {
        this.hurtPlayer(enemy.damage);
        if (run.hp <= 0) {
          this.finish(false);
          return;
        }
      }
    }
    this.grid.rebuild(this.enemies);
    this.combat.update(
      dt,
      this.player.x,
      this.player.y,
      run,
      this.grid,
      (enemy, damage, dx, dy, weapon) =>
        this.hitEnemy(enemy, damage, dx, dy, weapon),
    );
    if (run.ended) return;
    this.rage.update(
      dt,
      this.player.x,
      this.player.y,
      run,
      this.grid,
      (enemy, damage, dx, dy, weapon) =>
        this.hitEnemy(enemy, damage, dx, dy, weapon),
    );
    if (run.ended) return;
    this.pet.update(
      dt,
      this.player.x,
      this.player.y,
      run,
      this.grid,
      (enemy, damage, dx, dy) => this.hitEnemy(enemy, damage, dx, dy, "pet"),
    );
    if (run.ended) return;
    this.updateBoss(dt);
    this.hostile.update(dt, this.player.x, this.player.y, (damage) => {
      if (this.invincible > 0 || run.ended || damage <= 0) return;
      this.hurtPlayer(
        damage * DIFFICULTIES[run.profile.campaign.difficulty].damage,
      );
      if (run.hp <= 0) this.finish(false);
    });
    if (run.ended) return;
    this.pickups.update(dt, this.player.x, this.player.y, run, () =>
      this.heartBlast(),
    );
    if (run.ended) return;
    const treasure = this.encounters.collect(this.player.x, this.player.y, run);
    this.effects.update(dt);
    if (run.pending) {
      this.move = { x: 0, y: 0 };
      this.motion.reset();
      audioManager.play(treasure ? "treasure" : "level");
      this.effects.ring(this.player.x, this.player.y, 70, 0xffe4a2);
      bridge.emit("choices", [...run.choices]);
      bridge.emit("treasure", [...run.relicChoices]);
      this.syncPause();
      this.publish();
      return;
    }
    this.hudClock += dt;
    if (this.hudClock >= 0.1) {
      this.hudClock = 0;
      this.publish();
    }
  }
  private directWaves(dt: number) {
    const run = this.run!;
    const wave = waveAt(run.time);
    this.spawnClock += dt;
    const difficulty = DIFFICULTIES[run.profile.campaign.difficulty];
    const interval =
      (run.bossSpawned ? 1.4 : wave.interval) * difficulty.interval;
    if (this.spawnClock >= interval) {
      this.spawnClock -= interval;
      const composition =
        run.profile.campaign.map === "forest"
          ? wave.composition
          : MAPS[run.profile.campaign.map].enemies.slice(
              0,
              Math.min(4, 1 + wave.phase),
            );
      for (let i = 0; i < difficulty.group; i++)
        this.spawn(composition[Math.floor(this.random() * composition.length)]);
    }
    for (const id of run.dueElites()) {
      const enemy = this.spawn(ELITES[id].kind, undefined, true);
      if (enemy) {
        enemy.makeElite(id);
        enemy.hp = enemy.maxHp = enemy.maxHp * difficulty.hp;
        enemy.damage *= difficulty.damage;
        enemy.speed *= difficulty.speed;
        run.elites[id] = "active";
        this.encounters.register(id, enemy);
        audioManager.play("boss");
        this.publish();
      }
    }
    if (!run.bossSpawned && run.time >= MATCH_DURATION) {
      run.bossSpawned = true;
      this.bossDelay = 2.2;
      audioManager.play("boss");
      this.publish();
    }
    if (this.bossDelay > 0) {
      this.bossDelay -= dt;
      if (this.bossDelay <= 0) {
        this.boss = this.spawn(MAPS[run.profile.campaign.map].boss);
        if (!this.boss) this.bossDelay = 0.25;
      }
    }
  }
  private updateBoss(dt: number) {
    const boss = this.boss;
    if (!boss?.living) return;
    if (boss.kind !== "golem") {
      this.updateCampaignBoss(dt, boss);
      return;
    }
    if (this.stomp) {
      this.stomp.remaining -= dt;
      boss.charging = 1 - Math.max(0, this.stomp.remaining);
      this.stomp.circle.setFillStyle(0xe66c54, 0.18 + boss.charging * 0.24);
      if (this.stomp.remaining <= 0) {
        const { x, y, circle } = this.stomp;
        circle.destroy();
        this.stomp = null;
        boss.charging = 0;
        this.effects.golemBlast(x, y);
        if (this.effectsEnabled) this.cameras.main.shake(220, 0.006);
        audioManager.play("explosion");
        if (
          Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) <
            GOLEM_BLAST_RADIUS &&
          this.invincible === 0
        ) {
          this.hurtPlayer(
            25 * DIFFICULTIES[this.run!.profile.campaign.difficulty].damage,
          );
          if (this.run!.hp <= 0) this.finish(false);
        }
      }
    } else {
      this.bossCooldown -= dt;
      if (this.bossCooldown <= 0) {
        this.bossCooldown = boss.hp < boss.maxHp * 0.35 ? 2.7 : 4.5;
        this.bossPattern++;
        if (this.bossPattern % 3 !== 1) {
          const angle = Math.atan2(
            this.player.y - boss.y,
            this.player.x - boss.x,
          );
          if (this.bossPattern % 3 === 2)
            this.hostile.fan(
              boss.x,
              boss.y,
              angle,
              9,
              Math.PI * 1.5,
              24,
              false,
              155,
            );
          else
            for (let i = 0; i < 5; i++)
              this.hostile.zone(
                this.player.x + Math.cos(i * 1.256) * 95,
                this.player.y + Math.sin(i * 1.256) * 95,
                58,
                30,
                false,
                0.9,
              );
          return;
        }
        const x = this.player.x,
          y = this.player.y;
        const circle = this.add
          .circle(x, y, GOLEM_BLAST_RADIUS, 0xe66c54, 0.2)
          .setStrokeStyle(3, 0xffe2a3, 0.9)
          .setDepth(y - 1);
        this.stomp = { x, y, remaining: 1, circle };
        boss.charging = 0.01;
      }
    }
  }
  private updateCampaignBoss(dt: number, boss: EnemyActor) {
    this.bossCooldown -= dt;
    if (this.bossCooldown > 0) return;
    const enraged = boss.hp < boss.maxHp * 0.4,
      ice = boss.kind === "frost-warden";
    this.bossCooldown = enraged ? 1.65 : 3;
    const x = this.player.x,
      y = this.player.y,
      angle = Math.atan2(y - boss.y, x - boss.x),
      pattern = this.bossPattern++ % 3;
    if (pattern === 0) {
      const count = enraged ? 7 : 4;
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count,
          r = i === 0 ? 0 : 110;
        this.hostile.zone(
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          ice ? 62 : 72,
          ice ? 34 : 32,
          ice,
          0.95 + i * 0.1,
        );
      }
    } else if (pattern === 1) {
      // A readable fan leaves lateral escape routes; the second phase adds rays.
      this.hostile.zone(boss.x, boss.y, 35, 0, ice, 0.7);
      this.hostile.fan(
        boss.x,
        boss.y,
        angle,
        enraged ? 13 : 9,
        ice ? Math.PI * 2 : Math.PI * 0.9,
        ice ? 27 : 29,
        ice,
        ice ? 175 : 155,
      );
    } else {
      const length = 400,
        dx = Math.cos(angle) * length,
        dy = Math.sin(angle) * length;
      this.hostile.zone(
        boss.x,
        boss.y,
        ice ? 30 : 40,
        ice ? 38 : 40,
        ice,
        1.1,
        boss.x + dx,
        boss.y + dy,
      );
      if (enraged)
        this.hostile.zone(x - 130, y + 80, 50, 32, ice, 1.25, x + 130, y - 80);
    }
    this.effects.ring(boss.x, boss.y, 45, ice ? 0xb4edff : 0xffbe7b, 300);
    audioManager.play(ice ? "frost" : "fireball");
  }
  private hurtPlayer(damage: number) {
    const run = this.run!;
    run.hurt(damage);
    this.invincible = 0.8;
    this.player.hit();
    this.effects.burst(this.player.x, this.player.y, 0xffb79b, 7);
    audioManager.play("damage");
    audioManager.vibrate(30);
    if (this.effectsEnabled) this.cameras.main.shake(80, 0.002);
  }
  private hitEnemy(
    enemy: EnemyActor,
    baseDamage: number,
    dx: number,
    dy: number,
    weapon: WeaponId | "relic" | "pet",
  ) {
    if (!enemy.living || this.run!.ended) return;
    const multiplier = relicHitMultiplier(
      this.run!.relics,
      enemy.chill.remaining > 0,
      !!enemy.elite || isBoss(enemy.kind),
    );
    const hit = rolledDamage(
      baseDamage * multiplier,
      this.run!.stats,
      this.random,
    );
    enemy.hp = Math.max(0, enemy.hp - hit.damage);
    enemy.hit(dx, dy);
    if (weapon === "frost" && enemy.hp > 0) {
      const rank = this.run!.weapons.frost;
      const evolved = this.run!.evolutions.blizzard;
      enemy.chill.apply(
        evolved ? 1.8 : 1.4 + (rank - 1) * 0.16,
        evolved ? 0.48 : 0.3 + rank * 0.015,
        isBoss(enemy.kind) || !!enemy.elite,
      );
    }
    this.effects.number(enemy.x, enemy.y, hit.damage, hit.critical);
    this.effects.burst(
      enemy.x,
      enemy.y,
      hit.critical ? 0xffd06d : weapon === "frost" ? 0x9ce8ff : 0xecffb4,
      4,
    );
    audioManager.play("hit");
    if (enemy.hp === 0) {
      this.run!.kills++;
      this.run!.gainMana(enemy.elite || isBoss(enemy.kind) ? 10 : 2);
      enemy.die();
      this.encounters.defeat(enemy, this.run!);
      this.pickups.spawn(enemy.x, enemy.y, enemy.xp);
      if (!isBoss(enemy.kind) && this.random() < 0.045)
        this.pickups.spawn(enemy.x + 10, enemy.y, 8, "heal");
      this.effects.burst(
        enemy.x,
        enemy.y,
        enemy.kind === "bat" ? 0xcab0e9 : 0xd2efa0,
        9,
      );
      audioManager.play("death");
      if (enemy === this.boss) this.finish(true);
    }
  }
  private heartBlast() {
    const run = this.run!;
    if (!run.relics.includes("heart") || run.ended) return;
    const x = this.player.x,
      y = this.player.y;
    this.effects.ring(x, y, 140, 0xffb5c7, 380);
    this.effects.burst(x, y, 0xffd7df, 16);
    audioManager.play("fireball");
    this.grid.query(x, y, 200, this.relicTargets);
    const damage = run.stats.damage * 3;
    for (const enemy of this.relicTargets)
      if (
        enemy.living &&
        Math.hypot(enemy.x - x, enemy.y - y) <= 140 + enemy.radius
      )
        this.hitEnemy(enemy, damage, enemy.x - x, enemy.y - y, "relic");
  }
  private finish(victory: boolean) {
    const result = this.run?.finish(victory);
    if (!result) return;
    this.activeRun = false;
    this.combat.stop();
    this.encounters.reset();
    this.rage.reset();
    this.pet.reset();
    this.hostile.reset();
    this.motion.reset();
    this.move = { x: 0, y: 0 };
    this.stomp?.circle.destroy();
    this.stomp = null;
    if (victory) {
      this.effects.ring(this.player.x, this.player.y, 100, 0xffd376, 700);
      this.effects.burst(this.player.x, this.player.y, 0xffd376, 35);
    } else this.player.fall();
    audioManager.play(victory ? "victory" : "defeat");
    audioManager.setScene("menu");
    this.publish();
    bridge.emit("result", result);
  }
  private publish() {
    const run = this.run;
    if (!run) return;
    bridge.snapshot({
      hp: run.hp,
      mana: run.mana,
      rageRemaining: run.rageRemaining,
      rageWeapon: run.rageWeapon,
      map: run.profile.campaign.map,
      difficulty: run.profile.campaign.difficulty,
      maxHp: run.stats.maxHp,
      level: run.level,
      xp: run.xp,
      nextXp: xpRequired(run.level),
      kills: run.kills,
      time: run.time,
      enemies: this.enemies.filter((e) => e.living).length,
      x: this.player.x,
      y: this.player.y,
      attacks: this.combat.attacks,
      weapons: { ...run.weapons },
      ranks: { ...run.ranks },
      evolutions: { ...run.evolutions },
      relics: [...run.relics],
      relicActive: {
        root: run.relics.includes("root") && run.stationaryTime >= 1,
        rage: run.relics.includes("rage") && run.hp <= run.stats.maxHp * 0.4,
      },
      elites: this.encounters.snapshot(),
      chests: this.encounters.chests(),
      boss: this.boss?.living
        ? { hp: this.boss.hp, maxHp: this.boss.maxHp, warning: false }
        : this.bossDelay > 0
          ? { hp: 1500, maxHp: 1500, warning: true }
          : null,
      wave: waveAt(run.time).phase + 1,
      fps: Math.round(this.game.loop.actualFps),
    });
  }
}
