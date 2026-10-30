import { useDialogFocus } from "./useDialogFocus";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Coins,
  Gem,
  Heart,
  Shield,
  Swords,
  Wind,
  Crown,
  Shirt,
  Footprints,
  CircleDot,
  Sparkles,
  PawPrint,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HEROES, statsFor } from "../../core/game";
import type { Profile } from "../../core/game";
import {
  GEAR,
  GEAR_IDS,
  GEAR_SLOTS,
  SLOT_NAMES,
  PETS,
  PET_IDS,
  MAX_GEAR_LEVEL,
  MAX_PET_LEVEL,
  equipGear,
  equipPet,
  improveGear,
  improvePet,
  gearCost,
  petCost,
} from "../../core/equipment";
import type { GearId, GearSlot, PetId } from "../../core/equipment";
import { profileRepository } from "../../core/profile";
import { useUI } from "../store";
import { SkillIcon } from "./SkillIcon";
import { audioManager } from "../../audio/AudioManager";
const slotIcons: Record<GearSlot, LucideIcon> = {
  weapon: Swords,
  hood: Crown,
  coat: Shirt,
  boots: Footprints,
  ring: CircleDot,
  charm: Sparkles,
};
const NO_RANKS = {
  damage: 0,
  haste: 0,
  speed: 0,
  magnet: 0,
  critical: 0,
  health: 0,
};
export function GearIcon({ id, size = 25 }: { id: GearId; size?: number }) {
  const Icon = slotIcons[GEAR[id].slot];
  return <Icon size={size} strokeWidth={1.7} />;
}
export function Armory({
  close,
  chooseHero,
  permanent,
}: {
  close: () => void;
  chooseHero: () => void;
  permanent: () => void;
}) {
  const dialog = useDialogFocus();
  const profile = useUI((s) => s.profile);
  const [tab, setTab] = useState<"gear" | "pets">("gear");
  const [selected, setSelected] = useState<GearId>("dawnblade");
  const [pet, setPet] = useState<PetId>(profile.loadout.pet ?? "fox");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  const stats = statsFor(profile, NO_RANKS),
    hero = HEROES[profile.hero];
  const item = GEAR[selected],
    level = profile.loadout.inventory[selected],
    cost = gearCost(level);
  const companion = PETS[pet],
    petLevel = profile.loadout.pets[pet],
    companionCost = petCost(petLevel);
  async function save(mutator: (p: Profile) => Profile, success: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      let changed = false;
      const saved = await profileRepository.update((current) => {
        const next = mutator(current);
        changed = next !== current;
        return next;
      });
      useUI.getState().setProfile(saved);
      useUI.setState({ storageAvailable: profileRepository.available });
      setMessage(
        changed
          ? success
          : "Hành trang đã thay đổi. Hãy kiểm tra lại vàng và tinh hoa.",
      );
      if (changed) audioManager.play("level");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      ref={dialog}
      className="armory-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Nhân vật và trang bị"
    >
      <header className="armory-header">
        <button
          className="icon-button"
          aria-label="Đóng hồ sơ nhân vật"
          onClick={close}
          disabled={busy}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <small>TRẠI THÁM HIỂM</small>
          <h2>Hành trang</h2>
        </div>
        <div className="armory-currency">
          <span>
            <Coins size={13} />
            {profile.gold.toLocaleString("vi-VN")}
          </span>
          <span>
            <Gem size={13} />
            {profile.loadout.essence}
          </span>
        </div>
      </header>
      <div className="armory-scroll">
        <div className="armory-hero">
          <div className="armory-halo" />
          <img
            className="armory-portrait"
            src={hero.portrait}
            alt={hero.name}
            draggable={false}
          />
          <div className="equipped-slots">
            {GEAR_SLOTS.map((slot, index) => {
              const id = profile.loadout.equipped[slot],
                Icon = slotIcons[slot];
              return (
                <button
                  key={slot}
                  className={`gear-slot ${id ? `rarity-${GEAR[id].tier}` : "empty"}`}
                  style={{
                    gridColumn: index < 3 ? 1 : 2,
                    gridRow: (index % 3) + 1,
                  }}
                  disabled={busy}
                  onClick={() => {
                    setTab("gear");
                    setSelected(
                      id ?? GEAR_IDS.find((g) => GEAR[g].slot === slot)!,
                    );
                  }}
                  aria-label={`${SLOT_NAMES[slot]}: ${id ? GEAR[id].name : "chưa trang bị"}`}
                >
                  {id ? <GearIcon id={id} size={27} /> : <Icon size={23} />}
                  <small>
                    {id
                      ? `+${profile.loadout.inventory[id]}`
                      : SLOT_NAMES[slot]}
                  </small>
                </button>
              );
            })}
          </div>
          <button
            className="armory-pet-slot"
            disabled={busy}
            onClick={() => setTab("pets")}
            aria-label="Chọn pet đồng hành"
          >
            {profile.loadout.pet ? (
              <img
                src={PETS[profile.loadout.pet].image}
                alt={PETS[profile.loadout.pet].name}
              />
            ) : (
              <PawPrint size={24} />
            )}
            <span>
              Pet <ChevronRight size={10} />
            </span>
          </button>
          <button
            className="armory-hero-name"
            onClick={chooseHero}
            disabled={busy}
          >
            {hero.name}
            <small>
              {hero.title} <ChevronRight size={12} />
            </small>
          </button>
        </div>
        <div className="armory-stat-grid">
          <span>
            <Swords size={15} />
            <small>SÁT THƯƠNG</small>
            <strong>{stats.damage.toFixed(1)}</strong>
          </span>
          <span>
            <Heart size={15} />
            <small>SINH LỰC</small>
            <strong>{stats.maxHp}</strong>
          </span>
          <span>
            <Shield size={15} />
            <small>GIÁP</small>
            <strong>{stats.armor.toFixed(1)}</strong>
          </span>
          <span>
            <Wind size={15} />
            <small>TỐC ĐỘ</small>
            <strong>{Math.round(stats.movementSpeed)}</strong>
          </span>
        </div>
        <div className="armory-skill-line">
          <SkillIcon id={hero.weapon} size={18} />
          <span>{hero.description}</span>
          <strong>{Math.round(stats.criticalChance * 100)}% chí mạng</strong>
        </div>
        <nav className="armory-tabs" aria-label="Danh mục hành trang">
          <button
            aria-pressed={tab === "gear"}
            onClick={() => setTab("gear")}
            disabled={busy}
          >
            <Shield size={15} />
            Trang bị{" "}
            <span>
              {
                GEAR_IDS.filter((id) => profile.loadout.inventory[id] > 0)
                  .length
              }
              /12
            </span>
          </button>
          <button
            aria-pressed={tab === "pets"}
            onClick={() => setTab("pets")}
            disabled={busy}
          >
            <PawPrint size={15} />
            Đồng hành{" "}
            <span>
              {PET_IDS.filter((id) => profile.loadout.pets[id] > 0).length}/3
            </span>
          </button>
        </nav>
        {tab === "gear" ? (
          <>
            <div className="gear-collection">
              {GEAR_IDS.map((id) => (
                <button
                  key={id}
                  disabled={busy}
                  className={`collection-item rarity-${GEAR[id].tier} ${selected === id ? "selected" : ""} ${!profile.loadout.inventory[id] ? "locked" : ""}`}
                  onClick={() => setSelected(id)}
                  aria-label={`${GEAR[id].name} cấp ${profile.loadout.inventory[id]}`}
                  aria-pressed={selected === id}
                >
                  <GearIcon id={id} size={29} />
                  <small>
                    {profile.loadout.inventory[id]
                      ? `+${profile.loadout.inventory[id]}`
                      : "CHẾ TẠO"}
                  </small>
                  {profile.loadout.equipped[GEAR[id].slot] === id && (
                    <Check className="equipped-check" size={12} />
                  )}
                </button>
              ))}
            </div>
            <article className={`gear-detail rarity-${item.tier}`}>
              <div className="gear-detail-heading">
                <GearIcon id={selected} />
                <div>
                  <small>
                    {SLOT_NAMES[item.slot]} ·{" "}
                    {item.tier === "epic" ? "SỬ THI" : "HIẾM"}
                  </small>
                  <h3>
                    {item.name} <span>+{level}</span>
                  </h3>
                </div>
              </div>
              <p>{item.description}</p>
              <div className="gear-bonuses">
                {Object.entries(item.bonus).map(([stat, amount]) => {
                  const value = amount * (1 + Math.max(0, level - 1) * 0.22);
                  const names = {
                    hp: "HP",
                    damage: "sát thương",
                    armor: "giáp",
                    speed: "tốc chạy",
                    haste: "tốc đánh",
                    pickup: "hút XP",
                    crit: "chí mạng",
                  };
                  const percent = ["speed", "haste", "pickup", "crit"].includes(
                    stat,
                  );
                  return (
                    <span key={stat}>
                      +
                      {(value * (percent ? 100 : 1)).toFixed(
                        percent ? 1 : stat === "hp" ? 0 : 1,
                      )}
                      {percent ? "%" : ""} {names[stat as keyof typeof names]}
                    </span>
                  );
                })}
              </div>
              <div className="gear-detail-actions">
                <button
                  className="secondary-button"
                  disabled={
                    busy ||
                    !level ||
                    profile.loadout.equipped[item.slot] === selected
                  }
                  onClick={() =>
                    void save(
                      (p) => equipGear(p, selected),
                      `Đã trang bị ${item.name}.`,
                    )
                  }
                >
                  <Check size={15} />
                  {profile.loadout.equipped[item.slot] === selected
                    ? "Đang dùng"
                    : "Trang bị"}
                </button>
                <button
                  className="forge-button"
                  disabled={
                    busy ||
                    level >= MAX_GEAR_LEVEL ||
                    profile.gold < cost.gold ||
                    profile.loadout.essence < cost.essence
                  }
                  onClick={() =>
                    void save(
                      (p) => improveGear(p, selected),
                      `Đã nâng ${item.name}.`,
                    )
                  }
                >
                  <ArrowUp size={15} />
                  <span>
                    {level >= MAX_GEAR_LEVEL
                      ? "TỐI ĐA"
                      : level
                        ? "Nâng cấp"
                        : "Chế tạo"}
                    <small>
                      {cost.gold} vàng · {cost.essence} tinh hoa
                    </small>
                  </span>
                </button>
              </div>
            </article>
          </>
        ) : (
          <>
            <div className="pet-collection">
              {PET_IDS.map((id) => (
                <button
                  key={id}
                  disabled={busy}
                  aria-pressed={pet === id}
                  onClick={() => setPet(id)}
                  className={pet === id ? "selected" : ""}
                >
                  <img src={PETS[id].image} alt="" />
                  <strong>{PETS[id].name}</strong>
                  <small>
                    {profile.loadout.pets[id]
                      ? `Cấp ${profile.loadout.pets[id]}`
                      : "Chưa kết bạn"}
                  </small>
                  {profile.loadout.pet === id && <Check size={13} />}
                </button>
              ))}
            </div>
            <article className="gear-detail pet-detail">
              <h3>
                {companion.name} <span>Cấp {petLevel}</span>
              </h3>
              <p>{companion.description}</p>
              <p className="pet-note">
                Theo chân bạn trong trận. Sát thương và hỗ trợ tăng theo cấp
                pet.
              </p>
              <div className="gear-detail-actions">
                <button
                  className="secondary-button"
                  disabled={busy || !petLevel || profile.loadout.pet === pet}
                  onClick={() =>
                    void save(
                      (p) => equipPet(p, pet),
                      `${companion.name} sẽ đi cùng bạn.`,
                    )
                  }
                >
                  <PawPrint size={15} />
                  {profile.loadout.pet === pet ? "Đang đồng hành" : "Đồng hành"}
                </button>
                <button
                  className="forge-button"
                  disabled={
                    busy ||
                    petLevel >= MAX_PET_LEVEL ||
                    profile.gold < companionCost.gold ||
                    profile.loadout.essence < companionCost.essence
                  }
                  onClick={() =>
                    void save(
                      (p) => improvePet(p, pet),
                      `Đã chăm sóc ${companion.name}.`,
                    )
                  }
                >
                  <ArrowUp size={15} />
                  <span>
                    {petLevel >= MAX_PET_LEVEL
                      ? "TỐI ĐA"
                      : petLevel
                        ? "Nâng cấp"
                        : "Kết bạn"}
                    <small>
                      {companionCost.gold} vàng · {companionCost.essence} tinh
                      hoa
                    </small>
                  </span>
                </button>
              </div>
            </article>
          </>
        )}
        <p className="armory-message" role="status">
          {busy
            ? "Đang lưu hành trang…"
            : message ||
              "Sống sót 60 giây để nhận trang bị. Món trùng đổi thành 5 tinh hoa."}
        </p>
        <button
          className="armory-permanent"
          onClick={permanent}
          disabled={busy}
        >
          <Heart size={14} />
          Nâng cấp nội tại ở trại
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
}
