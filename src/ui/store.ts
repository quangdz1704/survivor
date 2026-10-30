import { create } from "zustand";
import type { GameMode, Snapshot } from "../game/bridge";
import { emptySnapshot } from "../game/bridge";
import { newProfile, DEFAULT_SETTINGS } from "../core/game";
import type { Profile, RunResult, Settings, UpgradeChoice } from "../core/game";
interface UIState {
  mode: GameMode;
  ready: boolean;
  profileReady: boolean;
  profile: Profile;
  settings: Settings;
  storageAvailable: boolean;
  stats: Snapshot;
  choices: UpgradeChoice[];
  result: RunResult | null;
  rewardSaved: boolean;
  effects: boolean;
  sensitivity: number;
  setMode: (mode: GameMode) => void;
  setStats: (stats: Snapshot) => void;
  setReady: () => void;
  setProfile: (profile: Profile) => void;
  initializeProfile: (profile: Profile, available: boolean) => void;
  setSettings: (settings: Settings) => void;
  setEffects: (effects: boolean) => void;
  setSensitivity: (sensitivity: number) => void;
  setChoices: (choices: UpgradeChoice[]) => void;
  setResult: (result: RunResult) => void;
  markRewardSaved: () => void;
}
export const useUI = create<UIState>((set) => ({
  mode: "menu",
  ready: false,
  profileReady: false,
  profile: newProfile(),
  settings: { ...DEFAULT_SETTINGS },
  storageAvailable: true,
  stats: emptySnapshot(),
  choices: [],
  result: null,
  rewardSaved: false,
  effects: true,
  sensitivity: 1,
  setMode: (mode) => set({ mode }),
  setStats: (stats) => set({ stats }),
  setReady: () => set({ ready: true }),
  setProfile: (profile) => set({ profile }),
  initializeProfile: (profile, available) =>
    set({
      profile,
      profileReady: true,
      settings: profile.settings,
      effects: profile.settings.effects,
      sensitivity: profile.settings.sensitivity,
      storageAvailable: available,
    }),
  setSettings: (settings) =>
    set({
      settings,
      effects: settings.effects,
      sensitivity: settings.sensitivity,
    }),
  setEffects: (effects) =>
    set((state) => ({ effects, settings: { ...state.settings, effects } })),
  setSensitivity: (sensitivity) =>
    set((state) => ({
      sensitivity,
      settings: { ...state.settings, sensitivity },
    })),
  setChoices: (choices) =>
    set({ choices, mode: choices.length ? "levelup" : "playing" }),
  setResult: (result) => set({ result, rewardSaved: false, mode: "ended" }),
  markRewardSaved: () => set({ rewardSaved: true }),
}));
