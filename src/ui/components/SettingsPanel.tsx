import { Check, Settings, X } from "lucide-react";
import { useUI } from "../store";
export function SettingsPanel({ close }: { close: () => void }) {
  const settings = useUI((s) => s.settings),
    setSettings = useUI((s) => s.setSettings);
  return (
    <div className="modal-backdrop">
      <section className="modal settings-modal">
        <button
          className="modal-close icon-button"
          aria-label="Đóng cài đặt"
          onClick={close}
        >
          <X size={20} />
        </button>
        <div className="modal-emblem">
          <Settings size={27} />
        </div>
        <h2>Một chút tùy chỉnh</h2>
        <p>Để cuộc phiêu lưu vừa ý bạn hơn.</p>
        {(
          [
            { key: "music", label: "Nhạc nền" },
            { key: "sound", label: "Âm thanh chiến đấu" },
          ] as const
        ).map(({ key, label }) => (
          <label className="setting-range" key={key}>
            <span>
              {label}
              <strong>{Math.round(settings[key] * 100)}%</strong>
            </span>
            <input
              type="range"
              aria-label={label}
              min="0"
              max="1"
              step="0.05"
              value={settings[key]}
              onChange={(e) =>
                setSettings({ ...settings, [key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
        <label className="setting-row">
          <span>
            <strong>Hiệu ứng chiến đấu</strong>
            <small>Tia sáng, hạt và rung màn hình</small>
          </span>
          <input
            type="checkbox"
            checked={settings.effects}
            onChange={(e) =>
              setSettings({ ...settings, effects: e.target.checked })
            }
          />
        </label>
        <label className="setting-range">
          <span>
            Độ nhạy điều khiển
            <strong>{settings.sensitivity.toFixed(1)}×</strong>
          </span>
          <input
            aria-label="Độ nhạy điều khiển"
            type="range"
            min="0.6"
            max="1.4"
            step="0.1"
            value={settings.sensitivity}
            onChange={(e) =>
              setSettings({ ...settings, sensitivity: Number(e.target.value) })
            }
          />
        </label>
        <label className="setting-row">
          <span>
            <strong>Rung khi bị thương</strong>
            <small>Trên thiết bị có hỗ trợ rung</small>
          </span>
          <input
            type="checkbox"
            checked={settings.vibration}
            onChange={(e) =>
              setSettings({ ...settings, vibration: e.target.checked })
            }
          />
        </label>
        <button className="secondary-button" onClick={close}>
          <Check size={17} /> Xong rồi
        </button>
      </section>
    </div>
  );
}
