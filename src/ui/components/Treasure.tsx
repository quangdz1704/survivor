import {
  ArrowRight,
  Gem,
  HeartPulse,
  Snowflake,
  Skull,
  TreePine,
  Wind,
  PackageOpen,
} from "lucide-react";
import { RELICS } from "../../core/relics";
import type { RelicId } from "../../core/relics";
import { bridge } from "../../game/bridge";
import { useUI } from "../store";

const icons = {
  root: TreePine,
  rage: Gem,
  heart: HeartPulse,
  rime: Snowflake,
  return: Wind,
  fang: Skull,
};
export function RelicIcon({ id, size = 24 }: { id: RelicId; size?: number }) {
  const Icon = icons[id];
  return <Icon size={size} />;
}
export function Treasure() {
  const choices = useUI((s) => s.relicChoices);
  return (
    <div className="modal-backdrop level-backdrop">
      <section
        className="modal level-modal treasure-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="treasure-title"
      >
        <div className="modal-emblem">
          <PackageOpen size={30} />
        </div>
        <span className="eyebrow">CHIẾN LỢI PHẨM THỦ LĨNH</span>
        <h2 id="treasure-title">Một bảo vật cho bạn.</h2>
        <p>Chọn 1 trong 3 · Thay đổi cách bạn chiến đấu.</p>
        <div className="upgrade-choices">
          {choices.map((id, index) => (
            <button
              key={id}
              className="upgrade-card relic-card"
              autoFocus={index === 0}
              onClick={() => bridge.send("relic", id)}
            >
              <span className="skill-icon" style={{ color: RELICS[id].color }}>
                <RelicIcon id={id} />
              </span>
              <span className="upgrade-copy">
                <small>BẢO VẬT ĐỘC NHẤT</small>
                <strong>{RELICS[id].name}</strong>
                <span>{RELICS[id].description}</span>
                <em>{RELICS[id].hint}</em>
              </span>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
        <small className="modal-note">
          Thời gian đang dừng · Bảo vật giữ đến hết lượt chơi.
        </small>
      </section>
    </div>
  );
}
export function RelicInventory() {
  const relics = useUI((s) => s.stats.relics);
  if (!relics.length) return null;
  return (
    <details className="relic-inventory">
      <summary>
        <Gem size={14} /> Bảo vật <span>{relics.length}/2</span>
      </summary>
      <div>
        {relics.map((id) => (
          <p key={id}>
            <span style={{ color: RELICS[id].color }}>
              <RelicIcon id={id} size={18} />
            </span>
            <span>
              <strong>{RELICS[id].name}</strong>
              <small>{RELICS[id].description}</small>
            </span>
          </p>
        ))}
      </div>
    </details>
  );
}
