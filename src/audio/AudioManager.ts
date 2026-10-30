import type { Settings } from "../core/game";
import { DEFAULT_SETTINGS } from "../core/game";
export type Sound =
  | "click"
  | "sword"
  | "fireball"
  | "lightning"
  | "hit"
  | "death"
  | "xp"
  | "level"
  | "damage"
  | "boss"
  | "victory"
  | "defeat";
/** Original synthesized score/SFX. No audio downloads or external licenses. */
class AudioManager {
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private fxGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private note = 0;
  private activeVoices = 0;
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private scene: "menu" | "game" | "paused" = "menu";
  unlock() {
    try {
      if (!this.context) {
        const Constructor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!Constructor) return;
        this.context = new Constructor();
        const master = this.context.createGain();
        master.gain.value = 0.28;
        master.connect(this.context.destination);
        this.musicGain = this.context.createGain();
        this.fxGain = this.context.createGain();
        this.musicGain.connect(master);
        this.fxGain.connect(master);
        this.nextNote = this.context.currentTime + 0.08;
        this.timer = setInterval(() => this.schedule(), 180);
        this.applySettings();
      }
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => undefined);
    } catch {
      /* Audio unavailable: game remains playable. */
    }
  }
  configure(settings: Settings) {
    this.settings = settings;
    this.applySettings();
  }
  setScene(scene: "menu" | "game" | "paused") {
    this.scene = scene;
    this.applySettings();
  }
  private applySettings() {
    if (!this.context) return;
    this.musicGain?.gain.setTargetAtTime(
      this.settings.music * (this.scene === "paused" ? 0.3 : 1),
      this.context.currentTime,
      0.08,
    );
    this.fxGain?.gain.setTargetAtTime(
      this.settings.sound,
      this.context.currentTime,
      0.03,
    );
  }
  private tone(
    frequency: number,
    start: number,
    duration: number,
    gain: number,
    type: OscillatorType,
    bus: GainNode,
    slide?: number,
  ) {
    if (!this.context || this.activeVoices > 40) return;
    const context = this.context,
      osc = context.createOscillator(),
      envelope = context.createGain();
    this.activeVoices++;
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (slide)
      osc.frequency.exponentialRampToValueAtTime(slide, start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, gain),
      start + 0.009,
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(envelope);
    envelope.connect(bus);
    osc.onended = () => {
      osc.disconnect();
      envelope.disconnect();
      this.activeVoices--;
    };
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
  private schedule() {
    if (!this.context || !this.musicGain || this.context.state !== "running")
      return;
    const now = this.context.currentTime;
    if (this.nextNote < now) this.nextNote = now + 0.05;
    const notes =
      this.scene === "menu"
        ? [64, 67, 71, 67, 62, 66, 69, 66, 60, 64, 67, 64, 62, 66, 69, 71]
        : [52, 59, 64, 67, 55, 62, 67, 71, 57, 64, 69, 72, 55, 62, 67, 71];
    const beat = this.scene === "menu" ? 0.42 : 0.29;
    while (this.nextNote < now + 0.35) {
      const midi = notes[this.note % notes.length];
      if (this.settings.music > 0) {
        this.tone(
          440 * 2 ** ((midi - 69) / 12),
          this.nextNote,
          beat * 1.5,
          0.16,
          "sine",
          this.musicGain,
        );
        if (this.note % 4 === 0)
          this.tone(
            440 * 2 ** ((midi - 24 - 69) / 12),
            this.nextNote,
            beat * 3,
            0.12,
            "triangle",
            this.musicGain,
          );
      }
      this.note++;
      this.nextNote += beat;
    }
  }
  play(sound: Sound) {
    if (!this.context || !this.fxGain || this.settings.sound === 0) return;
    const t = this.context.currentTime,
      b = this.fxGain;
    const notes: Partial<Record<Sound, number[]>> = {
      level: [523, 659, 784, 1047],
      victory: [523, 659, 784, 1047, 1319],
      defeat: [392, 330, 262, 196],
      boss: [110, 82, 110, 65],
    };
    if (notes[sound]) {
      notes[sound]!.forEach((freq, i) =>
        this.tone(
          freq,
          t + i * 0.11,
          0.25,
          0.45,
          sound === "boss" ? "sawtooth" : "sine",
          b,
        ),
      );
      return;
    }
    const config: Record<
      Exclude<Sound, "level" | "victory" | "defeat" | "boss">,
      [number, number, number, OscillatorType, number]
    > = {
      click: [620, 0.07, 0.25, "sine", 420],
      sword: [950, 0.1, 0.14, "triangle", 340],
      fireball: [160, 0.24, 0.4, "sawtooth", 50],
      lightning: [1400, 0.16, 0.3, "sawtooth", 110],
      hit: [220, 0.065, 0.2, "triangle", 90],
      death: [240, 0.12, 0.2, "sine", 60],
      xp: [900, 0.08, 0.12, "sine", 1500],
      damage: [125, 0.17, 0.6, "triangle", 55],
    };
    const [freq, duration, gain, type, slide] =
      config[sound as keyof typeof config];
    this.tone(freq, t, duration, gain, type, b, slide);
  }
  vibrate(ms: number) {
    if (this.settings.vibration && navigator.vibrate) navigator.vibrate(ms);
  }
  suspend() {
    void this.context?.suspend().catch(() => undefined);
  }
  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    void this.context?.close();
    this.context = null;
  }
}
export const audioManager = new AudioManager();
