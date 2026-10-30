import Phaser from "phaser";
import { ForestScene } from "./ForestScene";
import { renderScale } from "./renderQuality";
export function createGame(parent: HTMLElement) {
  const ratio = renderScale();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth * ratio,
    height: parent.clientHeight * ratio,
    backgroundColor: "#629c64",
    antialias: true,
    render: {
      pixelArt: false,
      roundPixels: false,
      powerPreference: "high-performance",
    },
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / ratio },
    input: { activePointers: 3 },
    scene: [ForestScene],
    audio: { noAudio: true },
    banner: false,
  });
  const observer = new ResizeObserver(() => {
    game.scale.resize(parent.clientWidth * ratio, parent.clientHeight * ratio);
  });
  observer.observe(parent);
  game.events.once("destroy", () => observer.disconnect());
  return game;
}
