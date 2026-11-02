import { ArrowUpRight, Check, Flame, Gem, X } from "lucide-react";
import { useUI } from "../store";
import { bridge } from "../../game/bridge";
import { GEAR } from "../../core/equipment";
import { TRIAL } from "../../core/trials";
import { useDialogFocus } from "./useDialogFocus";

export function RiskEventStatus() {
  const stats = useUI((s) => s.stats),
    mode = useUI((s) => s.mode);
  const trial = stats.trial;
  if (!trial || (mode !== "playing" && mode !== "trial")) return null;
  return (
    <aside
      className={`trial-status trial-${trial.phase}`}
      inert={mode === "trial"}
    >
      <span className="trial-status-icon">
        {trial.phase === "won" ? <Check size={20} /> : <Flame size={20} />}
      </span>
      <div>
        <small>
          {trial.phase === "active"
            ? "KHẾ ƯỚC ĐANG DIỄN RA"
            : trial.phase === "won"
              ? "KHẾ ƯỚC HOÀN THÀNH"
              : "SỰ KIỆN TỰ CHỌN"}
        </small>
        <strong>
          {trial.phase === "active"
            ? `Sống sót · ${Math.ceil(trial.remaining)}s`
            : trial.phase === "won" && trial.reward
              ? GEAR[trial.reward].name
              : "Tế đàn nguyền rủa"}
        </strong>
        <span>
          {trial.phase === "active"
            ? "Quái xuất hiện ×2 · Thưởng 1 trang bị"
            : trial.phase === "won"
              ? "Đã cất vào túi · Nhận khi kết thúc trận"
              : `Đến gần để xem · Còn ${Math.ceil(trial.remaining)}s`}
        </span>
      </div>
      {trial.phase === "available" &&
        (trial.nearby ? (
          <button onClick={() => bridge.send("trial", "inspect")}>
            Xem
            <br />
            tế đàn
          </button>
        ) : (
          <ArrowUpRight
            size={23}
            aria-label="Hướng tới tế đàn"
            style={{
              transform: `rotate(${Math.atan2(trial.y - stats.y, trial.x - stats.x) + Math.PI / 4}rad)`,
            }}
          />
        ))}
    </aside>
  );
}
export function RiskEventChoice() {
  const ref = useDialogFocus();
  return (
    <div className="modal-backdrop trial-backdrop">
      <section
        ref={ref}
        className="modal trial-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-title"
      >
        <button
          className="trial-close icon-button"
          aria-label="Đóng tế đàn"
          onClick={() => bridge.send("trial", "close")}
        >
          <X size={18} />
        </button>
        <div className="trial-emblem">
          <Flame size={35} />
        </div>
        <span className="eyebrow">MỘT GIAO KÈO VỚI BÓNG TỐI</span>
        <h2 id="trial-title">Tế đàn nguyền rủa</h2>
        <p>Sức mạnh luôn có giá. Anh hùng sẽ nhận lời chứ?</p>
        <div className="trial-terms">
          <div>
            <Flame size={22} />
            <span>
              <strong>Bầy đàn thức giấc</strong>Quái xuất hiện gấp đôi trong{" "}
              {TRIAL.duration} giây.
            </span>
          </div>
          <div>
            <Gem size={22} />
            <span>
              <strong>Một món trang bị ngẫu nhiên</strong>Sống sót hết thời gian
              để cất đồ vào túi.
            </span>
          </div>
        </div>
        <button
          className="play-button compact"
          onClick={() => bridge.send("trial", "accept")}
        >
          NHẬN KHẾ ƯỚC <ArrowUpRight size={20} />
        </button>
        <button
          className="secondary-button"
          onClick={() => bridge.send("trial", "skip")}
        >
          Bỏ qua · Tiếp tục hành trình
        </button>
        <small className="trial-footnote">
          Trận đang tạm dừng. Bỏ qua không bị phạt.
          <br />
          Đồ đã kiếm được nhận khi kết thúc trận; về trại giữa chừng sẽ mất
          thưởng.
        </small>
      </section>
    </div>
  );
}
