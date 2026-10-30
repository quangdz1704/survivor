import Phaser from "phaser";
import { PlayerActor } from "./PlayerActor";
import { PlayerMotion } from "./PlayerMotion";
import { EnemyActor } from "./EnemyActor";
import { CombatSystem } from "./CombatSystem";
import { Pickups } from "./Pickups";
import { Effects } from "./Effects";
import { GOLEM_BLAST_RADIUS } from "./GolemBlast";
import { SpatialGrid } from "./SpatialGrid";
import { drawForestMap } from "./ForestMap";
import { renderScale } from "./renderQuality";
import { bridge } from "./bridge";
import {
  MAX_ENEMIES,
  WORLD_SIZE,
  normalizeMovement,
  seededRandom,
} from "./rules";
import {
  MATCH_DURATION,
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
    this.load.spritesheet("atlas", "/assets/forest-atlas.webp", {
      frameWidth: 512,
      frameHeight: 512,
    });
  }
  create() {
    this.trees = drawForestMap(this);
    this.effects = new Effects(this);
    this.combat = new CombatSystem(this, this.effects);
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
      "W,A,S,D,UP,DOWN,LEFT,RIGHT",
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
    for (let i = 0; i < 4; i++) this.spawn("slime", i);
    this.syncPause();
    this.publish();
  }
  private clearRun() {
    this.tweens.resumeAll();
    for (const enemy of this.enemies) enemy.setActive(false).setVisible(false);
    this.combat.reset();
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
    this.syncPause();
    this.publish();
  }
  private spawn(kind: EnemyKind, sideIndex?: number) {
    const active = this.enemies.filter((e) => e.active);
    if (active.length >= MAX_ENEMIES) {
      if (kind !== "golem") return null;
      // Make room for the boss within the total entity budget.
      const farthest = active
        .filter((e) => e.kind !== "golem")
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
      kind === "golem" ? 1 : wave.hpScale,
      kind === "golem" ? 1 : wave.speedScale,
    );
    return enemy;
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
    for (const tree of this.trees) {
      const near =
        Math.abs(tree.x - this.player.x) < tree.displayWidth * 0.5 + 20 &&
        this.player.y > tree.y - tree.displayHeight * 0.9 - 25 &&
        this.player.y < tree.y + 45;
      tree.alpha = near ? 0.24 : 1;
    }
    this.directWaves(dt);
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      if (!enemy.living) {
        enemy.animate(dt, 0, 0);
        continue;
      }
      const dx = this.player.x - enemy.x,
        dy = this.player.y - enemy.y,
        d = Math.hypot(dx, dy) || 1;
      const speed =
        enemy.charging > 0
          ? 0
          : enemy.speed *
            enemy.movementMultiplier() *
            (enemy.kind === "golem" && enemy.hp < enemy.maxHp * 0.35
              ? 1.25
              : 1);
      const stepX = (dx / d) * speed * dt + enemy.knockX * dt,
        stepY = (dy / d) * speed * dt + enemy.knockY * dt;
      enemy.knockX *= Math.exp(-16 * dt);
      enemy.knockY *= Math.exp(-16 * dt);
      enemy.x = Phaser.Math.Clamp(enemy.x + stepX, 15, WORLD_SIZE - 15);
      enemy.y = Phaser.Math.Clamp(enemy.y + stepY, 15, WORLD_SIZE - 15);
      enemy.animate(dt, Math.hypot(stepX, stepY), dx / d);
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
    this.updateBoss(dt);
    if (run.ended) return;
    this.pickups.update(dt, this.player.x, this.player.y, run);
    this.effects.update(dt);
    if (run.pending) {
      this.move = { x: 0, y: 0 };
      this.motion.reset();
      audioManager.play("level");
      this.effects.ring(this.player.x, this.player.y, 70, 0xffe4a2);
      bridge.emit("choices", [...run.choices]);
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
    const interval = run.bossSpawned ? 1.4 : wave.interval;
    if (this.spawnClock >= interval) {
      this.spawnClock -= interval;
      this.spawn(
        wave.composition[Math.floor(this.random() * wave.composition.length)],
      );
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
        this.boss = this.spawn("golem");
        if (!this.boss) this.bossDelay = 0.25;
      }
    }
  }
  private updateBoss(dt: number) {
    const boss = this.boss;
    if (!boss?.living) return;
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
          this.hurtPlayer(25);
          if (this.run!.hp <= 0) this.finish(false);
        }
      }
    } else {
      this.bossCooldown -= dt;
      if (this.bossCooldown <= 0) {
        this.bossCooldown = boss.hp < boss.maxHp * 0.35 ? 2.7 : 4.5;
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
    weapon: WeaponId,
  ) {
    if (!enemy.living || this.run!.ended) return;
    const hit = rolledDamage(baseDamage, this.run!.stats, this.random);
    enemy.hp = Math.max(0, enemy.hp - hit.damage);
    enemy.hit(dx, dy);
    if (weapon === "frost" && enemy.hp > 0) {
      const rank = this.run!.weapons.frost;
      const evolved = this.run!.evolutions.blizzard;
      enemy.chill.apply(
        evolved ? 1.8 : 1.4 + (rank - 1) * 0.16,
        evolved ? 0.48 : 0.3 + rank * 0.015,
        enemy.kind === "golem",
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
      enemy.die();
      this.pickups.spawn(enemy.x, enemy.y, enemy.xp);
      if (enemy.kind !== "golem" && this.random() < 0.045)
        this.pickups.spawn(enemy.x + 10, enemy.y, 8, "heal");
      this.effects.burst(
        enemy.x,
        enemy.y,
        enemy.kind === "bat" ? 0xcab0e9 : 0xd2efa0,
        9,
      );
      audioManager.play("death");
      if (enemy.kind === "golem") this.finish(true);
    }
  }
  private finish(victory: boolean) {
    const result = this.run?.finish(victory);
    if (!result) return;
    this.activeRun = false;
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
