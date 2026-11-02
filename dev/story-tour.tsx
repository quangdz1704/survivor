import { createRoot } from "react-dom/client";
import { App } from "../src/ui/App";
import { ProfileRepository, profileRepository } from "../src/core/profile";
import { newProfile } from "../src/core/game";
import type { HeroId } from "../src/core/game";
import { useUI } from "../src/ui/store";
import "../src/style.css";

const repository = new ProfileRepository(
  indexedDB,
  "survivor-mini-story-tour-qa",
);
profileRepository.load = repository.load.bind(repository);
profileRepository.update = repository.update.bind(repository);
useUI.subscribe((state) => {
  document.getElementById("qa-log")!.textContent =
    `QA save riêng · ${state.profile.hero}\nOnboarding: ${state.profile.onboarding}\nMode: ${state.mode}\nLesson: ${JSON.stringify(state.stats.tutorial)}\nT=${state.stats.time.toFixed(1)} · Cấp ${state.stats.level}\nVàng ${state.profile.gold} · Lượt ${state.profile.totalRuns}\nTrial ${JSON.stringify(state.stats.trial)}`;
});
createRoot(document.getElementById("root")!).render(<App />);
async function reset(hero: HeroId, veteran = false) {
  const profile = newProfile();
  profile.hero = hero;
  if (veteran) {
    profile.onboarding = "done";
    profile.totalRuns = 4;
    profile.gold = 800;
    profile.loadout.inventory.frostcrown = 3;
  }
  await repository.update(() => profile);
  location.reload();
}
document.getElementById("kang")!.onclick = () => void reset("an");
document.getElementById("dun")!.onclick = () => void reset("linh");
document.getElementById("veteran")!.onclick = () => void reset("an", true);
let narrow = false;
document.getElementById("narrow")!.onclick = () => {
  narrow = !narrow;
  document.documentElement.style.setProperty(
    "--qa-width",
    narrow ? "320px" : "390px",
  );
};
