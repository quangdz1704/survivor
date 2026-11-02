import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Flame,
  Leaf,
  Snowflake,
  Sparkles,
  X,
} from "lucide-react";
import { HEROES } from "../../core/game";
import type { HeroId } from "../../core/game";
import { STORY_PAGES } from "../../core/story";
import { LESSON_STAGES } from "../../core/tutorial";
import { useUI } from "../store";
import { useDialogFocus } from "./useDialogFocus";

export function StoryIntro({
  hero,
  busy,
  onClose,
  onPractice,
  onSkip,
}: {
  hero: HeroId;
  busy: boolean;
  onClose: () => void;
  onPractice: () => void;
  onSkip: () => void;
}) {
  const [page, setPage] = useState(0),
    ref = useDialogFocus(),
    story = STORY_PAGES[page];
  return (
    <section
      ref={ref}
      className={`story-screen story-page-${page}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-title"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header className="story-top">
        <span>
          <Leaf size={15} /> KÝ SỰ ÁNH RỪNG
        </span>
        <button
          className="icon-button"
          disabled={busy}
          aria-label="Đóng câu chuyện"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>
      <div
        className="story-pages"
        aria-label={`Cảnh ${page + 1} trên ${STORY_PAGES.length}`}
      >
        {STORY_PAGES.map((_, i) => (
          <i key={i} className={i <= page ? "story-page-read" : ""} />
        ))}
      </div>
      <div className="story-viewport" key={page}>
        <div className="story-illustration" aria-hidden="true">
          <div className="story-orbit" />
          <div className="story-heart">
            <Leaf size={34} />
          </div>
          <img
            className="story-hero"
            src={HEROES[hero].portrait}
            alt=""
            draggable={false}
          />
          {page === 1 && (
            <img
              className="story-ally"
              src={HEROES[hero === "an" ? "linh" : "an"].portrait}
              alt=""
              draggable={false}
            />
          )}
          {page === 2 && (
            <div className="story-seals">
              <span>
                <Leaf />
                RỄ CÂY
              </span>
              <span>
                <Flame />
                NGỌN LỬA
              </span>
              <span>
                <Snowflake />
                SƯƠNG GIÁ
              </span>
            </div>
          )}
          <span className="story-mote story-mote-one">✦</span>
          <span className="story-mote story-mote-two">✧</span>
        </div>
        <article className="story-copy" aria-live="polite" aria-atomic="true">
          <span className="eyebrow">{story.chapter}</span>
          <h2 id="story-title">{story.title}</h2>
          <p>{story.body}</p>
          <blockquote>“{story.quote}”</blockquote>
        </article>
      </div>
      <footer className="story-controls">
        <small>
          {HEROES[hero].name} · {page + 1} / {STORY_PAGES.length}
        </small>
        <div>
          {page > 0 && (
            <button
              className="icon-button"
              aria-label="Cảnh trước"
              onClick={() => setPage(page - 1)}
              disabled={busy}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            className="play-button compact"
            disabled={busy}
            onClick={() =>
              page < STORY_PAGES.length - 1 ? setPage(page + 1) : onPractice()
            }
          >
            {page < STORY_PAGES.length - 1
              ? "TIẾP CÂU CHUYỆN"
              : "TẬP LUYỆN CÙNG MẦM SÁNG"}
            <ArrowRight size={19} />
          </button>
        </div>
        <button className="story-skip" disabled={busy} onClick={onSkip}>
          {busy ? "Đang chuẩn bị…" : "Bỏ qua tour & vào trận chính"}
        </button>
      </footer>
    </section>
  );
}

const LESSON_COPY = {
  move: {
    title: "Bước chân đầu tiên",
    body: "Chạm bất kỳ đâu trong vùng chơi rồi kéo để di chuyển. Máy tính dùng WASD hoặc phím mũi tên.",
    task: "Di chuyển một đoạn để bảo vệ mầm sáng.",
  },
  fight: {
    title: "Mầm sáng biết tự vệ",
    body: "Đến gần Slime. Vũ khí sẽ tự tấn công, bạn chỉ cần điều khiển bước chân.",
    task: "Hạ Slime tập luyện · Bạn đang được bảo vệ.",
  },
  collect: {
    title: "Nhặt ánh sáng trở về",
    body: "Slime để lại tinh thể xanh. Đi đến gần để hút tinh thể và nhận kinh nghiệm.",
    task: "Theo hướng mũi tên tới tinh thể.",
  },
  upgrade: {
    title: "Chọn sức mạnh của bạn",
    body: "Kinh nghiệm giúp bạn lên cấp. Chọn một trong ba kỹ năng; trận đang tạm dừng.",
    task: "Chạm một thẻ kỹ năng để tiếp tục.",
  },
  dodge: {
    title: "Đừng đứng trong vòng sáng",
    body: "Vùng đỏ báo trước đòn đánh. Rời khỏi vòng trước khi nó lóe sáng; né đúng đòn nặng của boss sẽ mở cơ hội phản công.",
    task: "Né khỏi vòng cảnh báo · Có thể thử lại.",
  },
  ready: {
    title: "Sẵn sàng",
    body: "Mầm sáng đã tin vào bạn.",
    task: "Bắt đầu hành trình.",
  },
};
export function TutorialCoach({
  busy,
  onSkip,
}: {
  busy: boolean;
  onSkip: () => void;
}) {
  const stats = useUI((s) => s.stats),
    mode = useUI((s) => s.mode),
    lesson = stats.tutorial;
  if (!lesson || lesson.stage === "ready" || mode !== "playing") return null;
  const copy = LESSON_COPY[lesson.stage],
    step = LESSON_STAGES.indexOf(lesson.stage) + 1;
  const target =
    (lesson.stage === "fight" || lesson.stage === "collect") && lesson.target;
  return (
    <aside className="tutorial-coach">
      <div className="tutorial-coach-heading">
        <span>
          <Leaf size={14} /> TIẾNG VỌNG CỦA RỪNG
        </span>
        <small>{step} / 5</small>
      </div>
      <h3>{copy.title}</h3>
      <p>{copy.body}</p>
      <div className="tutorial-task">
        <Compass
          size={18}
          style={
            target
              ? {
                  transform: `rotate(${Math.atan2(target.y - stats.y, target.x - stats.x) + Math.PI / 4}rad)`,
                }
              : undefined
          }
        />
        <span>
          {lesson.stage === "dodge" && lesson.attempts > 0
            ? "Chưa sao cả! Thử bước ra ngoài vòng lần nữa."
            : copy.task}
        </span>
      </div>
      {lesson.stage === "move" && (
        <progress
          aria-label="Tiến độ di chuyển tập luyện"
          value={Math.min(100, lesson.distance)}
          max={100}
        />
      )}
      <button disabled={busy} onClick={onSkip}>
        {busy ? "Đang chuẩn bị…" : "Bỏ qua tour & vào trận chính"}
      </button>
    </aside>
  );
}
export function TutorialReady({
  busy,
  onContinue,
}: {
  busy: boolean;
  onContinue: () => void;
}) {
  const ref = useDialogFocus();
  return (
    <div className="modal-backdrop tutorial-ready-backdrop">
      <section
        ref={ref}
        className="modal tutorial-ready"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-ready-title"
      >
        <div className="modal-emblem">
          <Sparkles size={30} />
        </div>
        <span className="eyebrow">LỜI HỨA ĐÃ ĐƯỢC TRAO</span>
        <h2 id="tutorial-ready-title">Mầm sáng chọn bạn.</h2>
        <p>
          Trong trận chính, sống sót 5 phút để thủ lĩnh xuất hiện. Né chưởng và
          hạ thủ lĩnh để giải phóng phong ấn, mang ánh sáng trở về khu rừng.
        </p>
        <div className="tutorial-checklist">
          <span>
            <Check size={16} /> Di chuyển & tự động tấn công
          </span>
          <span>
            <Check size={16} /> Kinh nghiệm & nâng kỹ năng
          </span>
          <span>
            <Check size={16} /> Né cảnh báo & phản công
          </span>
        </div>
        <button
          className="play-button compact"
          disabled={busy}
          onClick={onContinue}
        >
          {busy ? "Đang chuẩn bị…" : "BẮT ĐẦU TRẬN CHÍNH"}
          <ArrowRight size={19} />
        </button>
        <small>
          Trận mới bắt đầu ở cấp 1 với trang bị của bạn.
          <br />
          Có thể học lại tại Câu chuyện & tour trong trại.
          <br />
          Về trại để trang bị đồ và chọn pet đồng hành.
        </small>
      </section>
    </div>
  );
}
