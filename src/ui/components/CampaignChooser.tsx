import { useRef, useState } from "react";
import { ArrowLeft, Check, Lock, Skull, Coins } from "lucide-react";
import {
  MAPS,
  MAP_IDS,
  DIFFICULTIES,
  DIFFICULTY_IDS,
  mapUnlocked,
  difficultyUnlocked,
  selectCampaign,
} from "../../core/campaign";
import type { MapId, DifficultyId } from "../../core/campaign";
import { profileRepository } from "../../core/profile";
import { useUI } from "../store";
import { useDialogFocus } from "./useDialogFocus";
export function CampaignChooser({ close }: { close: () => void }) {
  const profile = useUI((s) => s.profile),
    dialog = useDialogFocus();
  const [map, setMap] = useState<MapId>(profile.campaign.map),
    [difficulty, setDifficulty] = useState<DifficultyId>(
      profile.campaign.difficulty,
    ),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const saved = await profileRepository.update((p) =>
        selectCampaign(p, map, difficulty),
      );
      useUI.getState().setProfile(saved);
      useUI.setState({ storageAvailable: profileRepository.available });
      close();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="armory-screen campaign-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Chọn vùng đất"
      ref={dialog}
    >
      <header className="armory-header">
        <button
          className="icon-button"
          aria-label="Đóng chọn vùng đất"
          onClick={close}
          disabled={busy}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <small>CHINH PHỤC · 3 VÙNG ĐẤT</small>
          <h2>Chuyến đi tiếp theo</h2>
        </div>
      </header>
      <div className="armory-scroll campaign-scroll">
        <p className="campaign-intro">
          Thắng Thường mở vùng đất kế tiếp và Khắc nghiệt tại vùng vừa thắng.
          Thắng Khắc nghiệt để bước vào Ác mộng.
        </p>
        <div className="campaign-maps">
          {MAP_IDS.map((id, index) => {
            const unlocked = mapUnlocked(profile, id),
              done = profile.campaign.completed.includes(`${id}:normal`);
            return (
              <button
                key={id}
                disabled={busy || !unlocked}
                aria-pressed={map === id}
                className={`campaign-card ${map === id ? "selected" : ""}`}
                onClick={() => {
                  setMap(id);
                  if (!difficultyUnlocked(profile, id, difficulty))
                    setDifficulty("normal");
                }}
                style={{ "--map-color": MAPS[id].color } as React.CSSProperties}
              >
                <div className={`campaign-art campaign-${id}`}>
                  <img
                    src={
                      id === "forest"
                        ? "/assets/enemies/golem/head.webp"
                        : `/assets/expansion/${MAPS[id].boss}.webp`
                    }
                    alt=""
                  />
                  {!unlocked && <Lock size={25} />}
                  <span>0{index + 1}</span>
                </div>
                <div>
                  <small>
                    {unlocked
                      ? done
                        ? "ĐÃ CHINH PHỤC"
                        : "SẴN SÀNG"
                      : "THẮNG VÙNG ĐẤT TRƯỚC"}
                  </small>
                  <h3>{MAPS[id].name}</h3>
                  <p>{MAPS[id].subtitle}</p>
                </div>
                {done && <Check size={18} />}
              </button>
            );
          })}
        </div>
        <h3 className="difficulty-heading">Độ thử thách</h3>
        <div className="difficulty-options">
          {DIFFICULTY_IDS.map((id) => (
            <button
              key={id}
              disabled={busy || !difficultyUnlocked(profile, map, id)}
              onClick={() => setDifficulty(id)}
              aria-pressed={difficulty === id}
            >
              <Skull size={18} />
              <strong>{DIFFICULTIES[id].name}</strong>
              <small>{DIFFICULTIES[id].cap} quái tối đa</small>
              <span>
                <Coins size={10} />×{DIFFICULTIES[id].reward}
              </span>
            </button>
          ))}
        </div>
        <p className="campaign-intro">
          {difficulty === "nightmare"
            ? "Mật độ cực cao, quái nhanh hơn 22%, sát thương gấp đôi. Chuẩn bị trang bị, pet và dành cuồng nộ cho lúc bị vây."
            : difficulty === "hard"
              ? "Quái bền hơn 60%, sát thương tăng 40%. Dành cho người đã nắm nhịp né chưởng."
              : "Năm phút sống sót, hai mini-boss và một trận đánh trùm cuối."}
        </p>
        <button
          className="play-button compact"
          disabled={busy || !difficultyUnlocked(profile, map, difficulty)}
          onClick={() => void save()}
        >
          {busy ? "ĐANG LƯU…" : "CHỌN VÙNG ĐẤT"}
        </button>
      </div>
    </section>
  );
}
