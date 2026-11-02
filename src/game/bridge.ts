import type { MapId, DifficultyId } from "../core/campaign";
import type {
  Profile,
  RunResult,
  Settings,
  UpgradeChoice,
  UpgradeId,
  WeaponId,
  PassiveId,
  EvolutionId,
} from "../core/game";
import { initialWeapons, initialEvolutions } from "../core/game";
import type { RelicId } from "../core/relics";
import type { EliteId } from "../core/encounters";
import type { TrialPhase } from "../core/trials";
import type { GearId } from "../core/equipment";
import type { LessonStage } from "../core/tutorial";
export type GameMode =
  "menu" | "playing" | "paused" | "levelup" | "treasure" | "trial" | "ended";
export interface Snapshot {
  hp: number;
  mana: number;
  rageRemaining: number;
  rageUses: number;
  rageWeapon: WeaponId;
  map: MapId;
  difficulty: DifficultyId;
  maxHp: number;
  level: number;
  xp: number;
  nextXp: number;
  kills: number;
  time: number;
  enemies: number;
  x: number;
  y: number;
  attacks: number;
  weapons: Record<WeaponId, number>;
  ranks: Record<PassiveId, number>;
  evolutions: Record<EvolutionId, boolean>;
  relics: RelicId[];
  relicActive: { root: boolean; rage: boolean };
  elites: { id: EliteId; hp: number; maxHp: number }[];
  chests: { id: EliteId; x: number; y: number }[];
  boss: {
    hp: number;
    maxHp: number;
    warning: boolean;
    counter?: number;
  } | null;
  wave: number;
  fps: number;
  tutorial: {
    stage: LessonStage;
    distance: number;
    attempts: number;
    target: { x: number; y: number } | null;
  } | null;
  trial: {
    phase: TrialPhase;
    round: number;
    remaining: number;
    nearby: boolean;
    x: number;
    y: number;
    reward: GearId | null;
  } | null;
}
export const emptySnapshot = (): Snapshot => ({
  hp: 100,
  mana: 0,
  rageRemaining: 0,
  rageUses: 0,
  rageWeapon: "sword",
  map: "forest",
  difficulty: "normal",
  maxHp: 100,
  level: 1,
  xp: 0,
  nextXp: 20,
  kills: 0,
  time: 0,
  enemies: 0,
  x: 1200,
  y: 1200,
  attacks: 0,
  weapons: initialWeapons("an"),
  ranks: { damage: 0, haste: 0, speed: 0, magnet: 0, critical: 0, health: 0 },
  evolutions: initialEvolutions(),
  relics: [],
  relicActive: { root: false, rage: false },
  elites: [],
  chests: [],
  boss: null,
  wave: 1,
  fps: 60,
  tutorial: null,
  trial: null,
});
export interface Commands {
  start: Profile;
  practice: Profile;
  pause: boolean;
  home: undefined;
  move: { x: number; y: number };
  quality: boolean;
  settings: Settings;
  choose: UpgradeId;
  relic: RelicId;
  rage: undefined;
  rageWeapon: WeaponId;
  trial: "inspect" | "accept" | "skip" | "close";
}
interface Events {
  snapshot: Snapshot;
  ready: undefined;
  choices: UpgradeChoice[];
  treasure: RelicId[];
  result: RunResult;
  trial: boolean;
}
class Bridge {
  private target = new EventTarget();
  send<K extends keyof Commands>(type: K, detail: Commands[K]) {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }
  on<K extends keyof Commands>(type: K, fn: (data: Commands[K]) => void) {
    return this.listen(type, fn);
  }
  private listen<T>(type: string, fn: (data: T) => void) {
    const cb = (event: Event) => fn((event as CustomEvent<T>).detail);
    this.target.addEventListener(type, cb);
    return () => this.target.removeEventListener(type, cb);
  }
  emit<K extends keyof Events>(type: K, detail: Events[K]) {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }
  event<K extends keyof Events>(type: K, fn: (data: Events[K]) => void) {
    return this.listen(type, fn);
  }
  snapshot(data: Snapshot) {
    this.emit("snapshot", data);
  }
  subscribe(fn: (data: Snapshot) => void) {
    return this.event("snapshot", fn);
  }
  ready() {
    this.emit("ready", undefined);
  }
  whenReady(fn: () => void) {
    return this.event("ready", fn);
  }
}
export const bridge = new Bridge();
