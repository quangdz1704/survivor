import { useDialogFocus } from "./useDialogFocus";
import { useState } from "react";
import { ArrowRight, Check, Heart, Sparkles, X } from "lucide-react";
import { HEROES, UPGRADE_NAMES } from "../../core/game";
import type { HeroId } from "../../core/game";
import { profileRepository } from "../../core/profile";
import { useUI } from "../store";
import { SkillIcon } from "./SkillIcon";
import { audioManager } from "../../audio/AudioManager";

export function HeroChooser({ close }: { close: () => void }) {
  const dialog = useDialogFocus();
  const current = useUI((s) => s.profile.hero);
  const [selected, setSelected] = useState<HeroId>(current);
  const [busy, setBusy] = useState(false);
  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      const saved = await profileRepository.update((profile) => ({
        ...profile,
        hero: selected,
      }));
      useUI.getState().setProfile(saved);
      useUI.setState({ storageAvailable: profileRepository.available });
      audioManager.play("level");
      close();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        ref={dialog}
        className="modal hero-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-heading"
      >
        <button
          className="modal-close icon-button"
          aria-label="Đóng chọn nhân vật"
          disabled={busy}
          onClick={close}
        >
          <X size={20} />
        </button>
        <div className="modal-emblem">
          <Sparkles size={27} />
        </div>
        <span className="eyebrow">HAI NGƯỜI BẠN · HAI CÁCH PHIÊU LƯU</span>
        <h2 id="hero-heading">Ai sẽ vào rừng?</h2>
        <p>
          Vũ khí và sức mạnh khởi đầu khác nhau.
          <br />
          Mọi nâng cấp ở trại đều dùng chung.
        </p>
        <div className="hero-options">
          {(Object.keys(HEROES) as HeroId[]).map((id) => {
            const hero = HEROES[id];
            return (
              <button
                key={id}
                className={`hero-option ${selected === id ? "selected" : ""}`}
                aria-pressed={selected === id}
                disabled={busy}
                onClick={() => setSelected(id)}
              >
                <img src={hero.portrait} alt="" draggable={false} />
                <span className="hero-option-copy">
                  <strong>
                    {hero.name} <small>{hero.title}</small>
                  </strong>
                  <span>{hero.description}</span>
                  <span className="hero-traits">
                    <span>
                      <Heart size={12} />
                      {hero.hp} HP
                    </span>
                    <span>
                      <SkillIcon id={hero.weapon} size={13} />
                      {UPGRADE_NAMES[hero.weapon]}
                    </span>
                  </span>
                </span>
                <span className="hero-choice-check">
                  {selected === id && <Check size={16} />}
                </span>
              </button>
            );
          })}
        </div>
        <p className="hero-hint">
          Tất cả nhân vật và vũ khí đều mở sẵn.
          <br />
          Nhặt XP để phối hợp cả 5 vũ khí trong cùng lượt chơi.
        </p>
        <button
          className="play-button compact"
          disabled={busy}
          onClick={() => void confirm()}
        >
          <span>
            {busy ? "ĐANG LƯU…" : `CHỌN ${HEROES[selected].name.toUpperCase()}`}
          </span>
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}
