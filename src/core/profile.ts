import { DEFAULT_SETTINGS, MAX_PERMANENT_LEVEL, newProfile } from "./game";
import type { Profile, Settings } from "./game";
const finite = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
export function sanitizeProfile(value: unknown): Profile {
  const defaults = newProfile();
  if (!value || typeof value !== "object") return defaults;
  const data = value as Partial<Profile>;
  if (data.version !== 1) return defaults;
  const upgrades = data.upgrades ?? defaults.upgrades,
    settings = data.settings ?? DEFAULT_SETTINGS;
  return {
    version: 1,
    hero: data.hero === "linh" ? "linh" : "an",
    gold: Math.floor(finite(data.gold, 0, 0, 1e9)),
    upgrades: {
      health: Math.floor(finite(upgrades.health, 0, 0, MAX_PERMANENT_LEVEL)),
      damage: Math.floor(finite(upgrades.damage, 0, 0, MAX_PERMANENT_LEVEL)),
      speed: Math.floor(finite(upgrades.speed, 0, 0, MAX_PERMANENT_LEVEL)),
    },
    settings: sanitizeSettings(settings),
    bestTime: finite(data.bestTime, 0, 0, 86400),
    bestKills: Math.floor(finite(data.bestKills, 0, 0, 1e7)),
    totalRuns: Math.floor(finite(data.totalRuns, 0, 0, 1e7)),
    wins: Math.floor(finite(data.wins, 0, 0, 1e7)),
    settledRuns: Array.isArray(data.settledRuns)
      ? data.settledRuns
          .filter(
            (id): id is string => typeof id === "string" && id.length < 120,
          )
          .slice(-64)
      : [],
  };
}
export function sanitizeSettings(settings: Partial<Settings>): Settings {
  return {
    music: finite(settings.music, 0.35, 0, 1),
    sound: finite(settings.sound, 0.65, 0, 1),
    effects: typeof settings.effects === "boolean" ? settings.effects : true,
    sensitivity: finite(settings.sensitivity, 1, 0.6, 1.4),
    vibration:
      typeof settings.vibration === "boolean" ? settings.vibration : true,
  };
}

/** Atomic IDB read/modify/write; queue also protects the unavailable-storage fallback. */
export class ProfileRepository {
  private memory = newProfile();
  private db: IDBDatabase | null = null;
  private initialized: Promise<void> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  available = true;
  constructor(
    private factory: IDBFactory | undefined = globalThis.indexedDB,
    private name = "survivor-mini",
  ) {}
  private initialize() {
    return (this.initialized ??= (async () => {
      if (!this.factory) {
        this.available = false;
        return;
      }
      try {
        this.db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = this.factory!.open(this.name, 1);
          let failed = false;
          const fail = (error: unknown) => {
            failed = true;
            clearTimeout(timeout);
            reject(error);
          };
          const timeout = setTimeout(
            () => fail(new Error("Storage timed out")),
            2500,
          );
          request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains("state"))
              request.result.createObjectStore("state");
          };
          request.onsuccess = () => {
            clearTimeout(timeout);
            if (failed) request.result.close();
            else resolve(request.result);
          };
          request.onerror = () => {
            fail(request.error);
          };
          request.onblocked = () => {
            fail(new Error("Storage blocked"));
          };
        });
        this.db.onversionchange = () => {
          this.db?.close();
          this.db = null;
          this.available = false;
        };
      } catch {
        this.available = false;
      }
    })());
  }
  async load() {
    return this.update((profile) => profile);
  }
  update(mutator: (profile: Profile) => Profile): Promise<Profile> {
    const operation = this.queue.then(async () => {
      await this.initialize();
      if (this.db) {
        try {
          return await new Promise<Profile>((resolve, reject) => {
            const transaction = this.db!.transaction("state", "readwrite");
            const store = transaction.objectStore("state");
            const request = store.get("profile");
            let next = this.memory;
            request.onsuccess = () => {
              try {
                next = sanitizeProfile(
                  mutator(sanitizeProfile(request.result)),
                );
                store.put(next, "profile");
              } catch (error) {
                transaction.abort();
                reject(error);
              }
            };
            transaction.oncomplete = () => {
              this.memory = next;
              resolve(structuredClone(next));
            };
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () =>
              reject(transaction.error ?? new Error("Save aborted"));
          });
        } catch {
          this.available = false;
          this.db?.close();
          this.db = null;
        }
      }
      this.memory = sanitizeProfile(mutator(structuredClone(this.memory)));
      return structuredClone(this.memory);
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
  close() {
    this.db?.close();
    this.db = null;
  }
}
export const profileRepository = new ProfileRepository();
