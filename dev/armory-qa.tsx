import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Armory } from "../src/ui/components/Armory";
import { HeroChooser } from "../src/ui/components/HeroChooser";
import { Shop } from "../src/ui/components/Progression";
import { ProfileRepository, profileRepository } from "../src/core/profile";
import { newProfile } from "../src/core/game";
import { useUI } from "../src/ui/store";
import "../src/style.css";
const repository = new ProfileRepository(indexedDB, "survivor-mini-armory-qa");
// Production components write exclusively to this fixture's isolated repository.
profileRepository.update = repository.update.bind(repository);
function UI() {
  const [panel, setPanel] = useState("armory");
  return panel === "hero" ? (
    <HeroChooser close={() => setPanel("armory")} />
  ) : panel === "shop" ? (
    <Shop close={() => setPanel("armory")} />
  ) : (
    <Armory
      close={() => setPanel("armory")}
      chooseHero={() => setPanel("hero")}
      permanent={() => setPanel("shop")}
    />
  );
}
const root = createRoot(document.getElementById("stage")!);
useUI.subscribe(({ profile }) => {
  document.getElementById("log")!.textContent =
    `QA · Vàng ${profile.gold} · Tinh hoa ${profile.loadout.essence}\nTrang bị ${JSON.stringify(profile.loadout.equipped)}\nPet ${profile.loadout.pet}\nKho ${JSON.stringify(profile.loadout.inventory)}`;
});
async function reset() {
  const profile = newProfile();
  profile.gold = 1000;
  profile.totalRuns = 1;
  profile.loadout.essence = 100;
  useUI.getState().setProfile(await repository.update(() => profile));
  root.render(<UI />);
}
document.getElementById("reset")!.onclick = () => void reset();
void repository.load().then(async (p) => {
  if (!p.totalRuns) await reset();
  else {
    useUI.getState().setProfile(p);
    root.render(<UI />);
  }
});
